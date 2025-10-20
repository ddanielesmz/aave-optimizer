import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Alert from "@/models/Alert";

// PATCH - Aggiorna alert (toggle attivo/disattivo)
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    await connectMongo();

    const alert = await Alert.findByIdAndUpdate(
      { _id: id },
      { isActive },
      { new: true }
    );

    if (!alert) {
      return NextResponse.json(
        { error: "Alert non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Errore nell'aggiornamento alert:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}

// DELETE - Elimina alert
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    await connectMongo();

    const alert = await Alert.findByIdAndDelete({
      _id: id,
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Alert eliminato con successo" });
  } catch (error) {
    console.error("Errore nell'eliminazione alert:", error);
    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
