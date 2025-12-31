// Mark Number API Route - Player marks a number on their card

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { BingoCard } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId, number } = await request.json();

    if (!roomId || !playerId || number === undefined) {
      return NextResponse.json(
        { error: "Room ID, Player ID, and number are required" },
        { status: 400 }
      );
    }

    // Get room with game
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { game: true },
    });

    if (!room || !room.game) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if number was called
    if (!room.game.calledNumbers.includes(number)) {
      return NextResponse.json(
        { success: false, error: "Number has not been called yet!" },
        { status: 400 }
      );
    }

    // Get player and their card
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player || !player.cardData) {
      return NextResponse.json(
        { error: "Player or card not found" },
        { status: 404 }
      );
    }

    // Parse and update card
    const card: BingoCard = JSON.parse(player.cardData);
    let found = false;

    for (const row of card) {
      for (const cell of row) {
        if (cell.number === number) {
          cell.marked = true;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return NextResponse.json(
        { success: false, error: "Number not on your card" },
        { status: 400 }
      );
    }

    // Save updated card
    await prisma.player.update({
      where: { id: playerId },
      data: { cardData: JSON.stringify(card) },
    });

    return NextResponse.json({
      success: true,
      number,
      card,
    });
  } catch (error) {
    console.error("[Mark Number] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark number" },
      { status: 500 }
    );
  }
}
