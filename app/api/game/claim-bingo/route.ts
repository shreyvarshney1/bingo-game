// Claim Bingo API Route - Validate and claim victory

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPusher, CHANNELS, EVENTS } from "@/lib/pusher";
import { checkWinCondition, validateCard } from "@/lib/bingo-utils";
import { BingoCard } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json(
        { error: "Room ID and Player ID are required" },
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

    // Prevent claiming on already finished game (prevents double-clicks)
    if (room.game.status === "finished") {
      return NextResponse.json(
        { valid: false, error: "Game already has a winner" },
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

    const card: BingoCard = JSON.parse(player.cardData);

    // Validate that all marked numbers were actually called
    if (!validateCard(card, room.game.calledNumbers)) {
      return NextResponse.json(
        { valid: false, error: "Invalid marks on card" },
        { status: 400 }
      );
    }

    // Check for winning pattern
    const winPattern = checkWinCondition(card);
    if (!winPattern) {
      return NextResponse.json(
        { valid: false, error: "No winning pattern found" },
        { status: 400 }
      );
    }

    // Valid Bingo! Update game state
    await prisma.gameSession.update({
      where: { roomId: room.id },
      data: {
        status: "finished",
        winnerId: player.id,
        winnerName: player.name,
      },
    });

    // Increment player's win count
    await prisma.player.update({
      where: { id: player.id },
      data: { wins: { increment: 1 } },
    });

    // Trigger Pusher event
    const pusher = getPusher();
    await pusher.trigger(CHANNELS.room(room.code), EVENTS.WINNER_DECLARED, {
      winnerId: player.id,
      winnerName: player.name,
      winPattern,
      roundNumber: room.game.roundNumber,
    });

    return NextResponse.json({
      valid: true,
      winnerId: player.id,
      winnerName: player.name,
      winPattern,
    });
  } catch (error) {
    console.error("[Claim Bingo] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate Bingo" },
      { status: 500 }
    );
  }
}
