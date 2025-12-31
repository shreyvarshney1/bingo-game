// Create Room API Route

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPusher, CHANNELS, EVENTS } from "@/lib/pusher";
import { generateRoomCode, generateSessionId } from "@/lib/bingo-utils";

export async function POST(request: NextRequest) {
  try {
    const { playerName, roomName } = await request.json();

    if (!playerName || !roomName) {
      return NextResponse.json(
        { error: "Player name and room name are required" },
        { status: 400 }
      );
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({
        where: { code: roomCode },
      });
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    const sessionId = generateSessionId();

    // Create room with host player
    const room = await prisma.room.create({
      data: {
        code: roomCode,
        name: roomName,
        hostId: sessionId, // Using session ID as host reference
        players: {
          create: {
            name: playerName,
            sessionId,
            isHost: true,
          },
        },
        game: {
          create: {
            status: "waiting",
            calledNumbers: [],
          },
        },
      },
      include: {
        players: true,
        game: true,
      },
    });

    const player = room.players[0];

    return NextResponse.json({
      success: true,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      playerId: player.id,
      sessionId: player.sessionId,
      isHost: true,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        wins: p.wins,
      })),
    });
  } catch (error) {
    console.error("[Create Room] Error:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}
