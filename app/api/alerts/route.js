import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongo";
import Alert from "@/models/Alert";

// GET - Recupera alert per un utente
export async function GET(req) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const widgetType = searchParams.get("widgetType");

    const query = { userId: session.user.id };
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
        { error: "Non autorizzato" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      alertName,
      widgetType,
      condition,
      threshold,
      telegramChatId,
      customMessage,
      cooldownMinutes,
    } = body;

    // Validazione
    if (!alertName || !widgetType || !condition || threshold === undefined || !telegramChatId) {
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
      userId: session.user.id,
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
      userId: session.user.id,
      alertName,
      widgetType,
      condition,
      threshold,
      telegramChatId,
      customMessage: customMessage || "",
      cooldownMinutes: cooldownMinutes || 60,
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
