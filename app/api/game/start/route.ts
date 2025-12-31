// Start Game API Route

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

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify requester is host
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isHost) {
      return NextResponse.json(
        { error: "Only the host can start the game" },
        { status: 403 }
      );
    }

    // Generate cards for all players
    const playerCards: Record<string, any> = {};
    for (const p of room.players) {
      const card = generateBingoCard();
      playerCards[p.id] = card;

      await prisma.player.update({
        where: { id: p.id },
        data: { cardData: JSON.stringify(card) },
      });
    }

    // Update game state
    await prisma.gameSession.update({
      where: { roomId: room.id },
      data: {
        status: "playing",
        calledNumbers: [],
        currentNumber: null,
        winnerId: null,
        winnerName: null,
      },
    });

    // Trigger Pusher event with each player's card
    const pusher = getPusher();

    // Send a general game started event
    await pusher.trigger(CHANNELS.room(room.code), EVENTS.GAME_STARTED, {
      status: "playing",
      roundNumber: room.game?.roundNumber || 1,
    });

    return NextResponse.json({
      success: true,
      playerCards, // Map of playerId -> card
      gameState: {
        status: "playing",
        calledNumbers: [],
        currentNumber: null,
        roundNumber: room.game?.roundNumber || 1,
      },
    });
  } catch (error) {
    console.error("[Start Game] Error:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
