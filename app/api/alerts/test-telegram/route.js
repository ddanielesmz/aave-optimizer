import { NextResponse } from "next/server";
import telegramNotifier from "@/libs/telegram";

// POST - Testa la connessione Telegram e invia una notifica di test
export async function POST(req) {
  try {
    const body = await req.json();
    const { telegramUsername, testMessage } = body;

    if (!telegramUsername) {
      return NextResponse.json(
        { error: "Telegram username richiesto" },
        { status: 400 }
      );
    }

    // Testa la connessione del bot
    const connectionTest = await telegramNotifier.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json(
        { 
          error: "Errore connessione bot Telegram", 
          details: connectionTest.error 
        },
        { status: 500 }
      );
    }

    // Invia messaggio di test
    const testAlert = {
      alertName: "Test Alert",
      condition: "less_than",
      threshold: 1.5,
      telegramUsername: telegramUsername,
      customMessage: testMessage || "Questo è un messaggio di test per verificare che le notifiche Telegram funzionino correttamente."
    };

    const result = await telegramNotifier.sendAlert(testAlert, 1.2, "Health Factor");

    return NextResponse.json({
      success: true,
      message: "Test completato",
      botInfo: connectionTest.botInfo,
      notificationResult: result
    });

  } catch (error) {
    console.error("Errore nel test Telegram:", error);
    return NextResponse.json(
      { error: "Errore interno del server", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Verifica solo la connessione del bot
export async function GET() {
  try {
    const connectionTest = await telegramNotifier.testConnection();
    
    return NextResponse.json({
      success: connectionTest.success,
      botInfo: connectionTest.botInfo,
      error: connectionTest.error
    });

  } catch (error) {
    console.error("Errore nel test connessione Telegram:", error);
    return NextResponse.json(
      { error: "Errore interno del server", details: error.message },
      { status: 500 }
    );
  }
}
