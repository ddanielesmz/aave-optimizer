import { NextResponse } from "next/server";
import alertMonitor from "@/libs/alertMonitor";
import { initializeApp } from "@/libs/initApp";

// POST - Avvia il sistema di monitoraggio alert
export async function POST(req) {
  try {
    // Inizializza l'app se non è già inizializzata
    await initializeApp();
    
    if (alertMonitor.isActive()) {
      return NextResponse.json({ 
        message: "AlertMonitor già attivo",
        isActive: true 
      });
    }

    alertMonitor.start();
    
    return NextResponse.json({ 
      message: "AlertMonitor avviato con successo",
      isActive: true 
    });

  } catch (error) {
    console.error("Errore nell'avvio AlertMonitor:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// GET - Verifica stato del sistema di monitoraggio
export async function GET(req) {
  try {
    return NextResponse.json({ 
      isActive: alertMonitor.isActive(),
      message: alertMonitor.isActive() ? "AlertMonitor attivo" : "AlertMonitor non attivo"
    });

  } catch (error) {
    console.error("Errore nel controllo stato AlertMonitor:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// DELETE - Ferma il sistema di monitoraggio alert
export async function DELETE(req) {
  try {
    if (!alertMonitor.isActive()) {
      return NextResponse.json({ 
        message: "AlertMonitor non è attivo",
        isActive: false 
      });
    }

    alertMonitor.stop();
    
    return NextResponse.json({ 
      message: "AlertMonitor fermato con successo",
      isActive: false 
    });

  } catch (error) {
    console.error("Errore nella fermata AlertMonitor:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
