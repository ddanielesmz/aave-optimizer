import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongo";
import Alert from "@/models/Alert";
import alertMonitor from "@/libs/alertMonitor";

// POST - Testa un alert specifico
export async function POST(req, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 401 }
      );
    }

    const { id } = params;

    await connectMongo();

    // Verifica che l'alert appartenga all'utente
    const alert = await Alert.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert non trovato" },
        { status: 404 }
      );
    }

    // Testa l'alert
    await alertMonitor.testAlert(id);

    return NextResponse.json({ 
      message: "Test alert eseguito con successo",
      alertName: alert.alertName,
    });

  } catch (error) {
    console.error("Errore nel test alert:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
