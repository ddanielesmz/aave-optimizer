import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Alert from "@/models/Alert";
import { auth } from "@/libs/auth";
import { enforceRateLimit, RateLimitError } from "@/libs/rateLimiter";

function getClientIdentifier(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return req.headers.get("cf-connecting-ip")?.trim() || "anonymous";
}

// GET - Recupera alert per un widget
export async function GET(req) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    try {
      await enforceRateLimit({
        identifier: session.user.id,
        action: "alerts-read",
        limit: 30,
        windowSeconds: 60,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(error.retryAfter) },
          },
        );
      }
      throw error;
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const widgetType = searchParams.get("widgetType");

    const query = { createdBy: session.user.id };
    if (widgetType) {
      query.widgetType = widgetType;
    }

    const alerts = await Alert.find(query).sort({ createdAt: -1 });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Errore nel recupero alert:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// POST - Crea nuovo alert
export async function POST(req) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    try {
      await enforceRateLimit({
        identifier: getClientIdentifier(req),
        action: "alerts-write",
        limit: 5,
        windowSeconds: 60,
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: { "Retry-After": String(error.retryAfter) },
          },
        );
      }
      throw error;
    }

    const body = await req.json();

    const alertName = typeof body.alertName === "string" ? body.alertName.trim() : "";
    const widgetType = typeof body.widgetType === "string" ? body.widgetType.trim() : "";
    const condition = typeof body.condition === "string" ? body.condition.trim() : "";
    const threshold = Number(body.threshold);
    const telegramUsername =
      typeof body.telegramUsername === "string"
        ? body.telegramUsername.trim().replace(/^@+/, "")
        : "";
    const customMessage =
      typeof body.customMessage === "string"
        ? body.customMessage.trim().slice(0, 500)
        : "";
    const cooldownMinutes = Number.isFinite(body.cooldownMinutes)
      ? Math.max(5, Math.min(Number(body.cooldownMinutes), 1440))
      : 60;

    // Validazione
    if (!alertName || !widgetType || !condition || Number.isNaN(threshold) || !telegramUsername) {
      return NextResponse.json(
        { error: "Campi obbligatori mancanti" },
        { status: 400 }
      );
    }

    if (!["healthFactor", "ltv", "netAPY"].includes(widgetType)) {
      return NextResponse.json(
        { error: "Tipo widget non valido" },
        { status: 400 }
      );
    }

    if (!["greater_than", "less_than", "equals"].includes(condition)) {
      return NextResponse.json(
        { error: "Condizione non valida" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Verifica se esiste già un alert con lo stesso nome per questo widget
    const existingAlert = await Alert.findOne({
      createdBy: session.user.id,
      widgetType,
      alertName,
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: "Esiste già un alert con questo nome per questo widget" },
        { status: 400 }
      );
    }

    const alert = await Alert.create({
      createdBy: session.user.id,
      alertName,
      widgetType,
      condition,
      threshold,
      telegramUsername,
      customMessage,
      cooldownMinutes,
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione alert:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
