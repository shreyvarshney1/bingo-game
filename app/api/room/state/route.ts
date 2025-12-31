// Get Room State API Route - Fetch current room state

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get("code");
    const playerId = searchParams.get("playerId");

    if (!roomCode) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
      include: {
        players: {
          orderBy: { createdAt: "asc" },
        },
        game: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get player's card if specified
    let playerCard = null;
    if (playerId) {
      const player = await prisma.player.findUnique({
        where: { id: playerId },
      });
      if (player?.cardData) {
        playerCard = JSON.parse(player.cardData);
      }
    }

    return NextResponse.json({
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      hostId: room.hostId,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        wins: p.wins,
      })),
      gameState: room.game
        ? {
            status: room.game.status,
            calledNumbers: room.game.calledNumbers,
            currentNumber: room.game.currentNumber,
            winnerId: room.game.winnerId,
            winnerName: room.game.winnerName,
            roundNumber: room.game.roundNumber,
          }
        : null,
      playerCard,
    });
  } catch (error) {
    console.error("[Get Room] Error:", error);
    return NextResponse.json(
      { error: "Failed to get room state" },
      { status: 500 }
    );
  }
}
