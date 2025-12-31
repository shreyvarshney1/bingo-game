// Call Number API Route - Host triggers to call next number

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPusher, CHANNELS, EVENTS } from "@/lib/pusher";

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
      include: { players: true, game: true },
    });

    if (!room || !room.game) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify requester is host
    const player = room.players.find((p) => p.id === playerId);
    if (!player || !player.isHost) {
      return NextResponse.json(
        { error: "Only the host can call numbers" },
        { status: 403 }
      );
    }

    // Check game is in progress
    if (room.game.status !== "playing") {
      return NextResponse.json(
        { error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // Get available numbers (1-75 minus already called)
    const calledSet = new Set(room.game.calledNumbers);
    const available: number[] = [];
    for (let i = 1; i <= 75; i++) {
      if (!calledSet.has(i)) available.push(i);
    }

    if (available.length === 0) {
      return NextResponse.json(
        { error: "All numbers have been called" },
        { status: 400 }
      );
    }

    // Pick random number
    const randomIndex = Math.floor(Math.random() * available.length);
    const number = available[randomIndex];

    // Update game state
    const newCalledNumbers = [...room.game.calledNumbers, number];
    await prisma.gameSession.update({
      where: { roomId: room.id },
      data: {
        calledNumbers: newCalledNumbers,
        currentNumber: number,
      },
    });

    // Trigger Pusher event
    const pusher = getPusher();
    await pusher.trigger(CHANNELS.room(room.code), EVENTS.NUMBER_CALLED, {
      number,
      calledNumbers: newCalledNumbers,
    });

    return NextResponse.json({
      success: true,
      number,
      calledNumbers: newCalledNumbers,
      remainingNumbers: available.length - 1,
    });
  } catch (error) {
    console.error("[Call Number] Error:", error);
    return NextResponse.json(
      { error: "Failed to call number" },
      { status: 500 }
    );
  }
}
