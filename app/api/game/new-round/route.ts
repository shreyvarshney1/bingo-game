// New Round API Route - Reset for another round

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPusher, CHANNELS, EVENTS } from "@/lib/pusher";
import { generateBingoCard } from "@/lib/bingo-utils";

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId } = await request.json();

    if (!roomId || !playerId) {
      return NextResponse.json(
        { error: "Room ID and Player ID are required" },
        { status: 400 }
      );
    }

    // Get room with players and game
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { players: true, game: true },
    });

    if (!room || !room.game) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify requester is host
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isHost) {
      return NextResponse.json(
        { error: "Only the host can start a new round" },
        { status: 403 }
      );
    }

    // Generate new cards for all players
    const playerCards: Record<string, any> = {};
    for (const p of room.players) {
      const card = generateBingoCard();
      playerCards[p.id] = card;

      await prisma.player.update({
        where: { id: p.id },
        data: { cardData: JSON.stringify(card) },
      });
    }

    // Reset game state with incremented round
    const newRoundNumber = room.game.roundNumber + 1;
    await prisma.gameSession.update({
      where: { roomId: room.id },
      data: {
        status: "playing",
        calledNumbers: [],
        currentNumber: null,
        winnerId: null,
        winnerName: null,
        roundNumber: newRoundNumber,
      },
    });

    // Trigger Pusher event
    const pusher = getPusher();
    await pusher.trigger(CHANNELS.room(room.code), EVENTS.NEW_ROUND, {
      roundNumber: newRoundNumber,
    });

    return NextResponse.json({
      success: true,
      playerCards,
      gameState: {
        status: "playing",
        calledNumbers: [],
        currentNumber: null,
        roundNumber: newRoundNumber,
      },
    });
  } catch (error) {
    console.error("[New Round] Error:", error);
    return NextResponse.json(
      { error: "Failed to start new round" },
      { status: 500 }
    );
  }
}
