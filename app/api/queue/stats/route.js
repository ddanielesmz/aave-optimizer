import { NextResponse } from "next/server";
import { getQueueSystemStats } from "@/libs/initQueueSystem";
import { initializeApp } from "@/libs/initApp";
import { auth } from "@/libs/auth";

/**
 * API Route per ottenere statistiche del sistema di code
 * GET /api/queue/stats
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    // Inizializza il sistema se non è già inizializzato
    await initializeApp();

    const stats = await getQueueSystemStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[API Queue Stats] ❌ Errore:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Errore nel recupero delle statistiche delle code",
        message: error.message
      },
      { status: 500 }
    );
  }
}
