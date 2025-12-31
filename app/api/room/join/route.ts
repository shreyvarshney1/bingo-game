// Join Room API Route

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPusher, CHANNELS, EVENTS } from "@/lib/pusher";
import { generateSessionId, generateBingoCard } from "@/lib/bingo-utils";

export async function POST(request: NextRequest) {
  try {
    const { playerName, roomCode, existingSessionId } = await request.json();

    if (!playerName || !roomCode) {
      return NextResponse.json(
        { error: "Player name and room code are required" },
        { status: 400 }
      );
    }

    // Find room by code
    const room = await prisma.room.findUnique({
      where: { code: roomCode.toUpperCase() },
      include: {
        players: true,
        game: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check for reconnection
    if (existingSessionId) {
      const existingPlayer = await prisma.player.findUnique({
        where: { sessionId: existingSessionId },
      });

      if (existingPlayer && existingPlayer.roomId === room.id) {
        // Reconnection - return existing player data
        return NextResponse.json({
          success: true,
          isReconnect: true,
          roomId: room.id,
          roomCode: room.code,
          roomName: room.name,
          playerId: existingPlayer.id,
          sessionId: existingPlayer.sessionId,
          isHost: existingPlayer.isHost,
          card: existingPlayer.cardData
            ? JSON.parse(existingPlayer.cardData)
            : null,
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
        });
      }
    }

    // Check for duplicate name
    const duplicateName = room.players.find(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (duplicateName) {
      return NextResponse.json(
        { error: "Player name already taken in this room" },
        { status: 400 }
      );
    }

    const sessionId = generateSessionId();

    // Create player
    let cardData: string | null = null;

    // If game is in progress, generate a card for the new player
    if (room.game?.status === "playing") {
      const card = generateBingoCard();
      // Mark already called numbers
      if (room.game.calledNumbers.length > 0) {
        for (const row of card) {
          for (const cell of row) {
            if (
              cell.number !== null &&
              room.game.calledNumbers.includes(cell.number)
            ) {
              // Don't auto-mark - let player mark manually
            }
          }
        }
      }
      cardData = JSON.stringify(card);
    }

    const player = await prisma.player.create({
      data: {
        name: playerName,
        sessionId,
        roomId: room.id,
        isHost: false,
        cardData,
      },
    });

    // Trigger Pusher event for other players
    const pusher = getPusher();
    await pusher.trigger(CHANNELS.room(room.code), EVENTS.PLAYER_JOINED, {
      player: {
        id: player.id,
        name: player.name,
        isHost: false,
        wins: 0,
      },
    });

    // Get updated player list
    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: { players: true, game: true },
    });

    return NextResponse.json({
      success: true,
      isReconnect: false,
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      playerId: player.id,
      sessionId,
      isHost: false,
      card: cardData ? JSON.parse(cardData) : null,
      players: updatedRoom!.players.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        wins: p.wins,
      })),
      gameState: updatedRoom!.game
        ? {
            status: updatedRoom!.game.status,
            calledNumbers: updatedRoom!.game.calledNumbers,
            currentNumber: updatedRoom!.game.currentNumber,
            winnerId: updatedRoom!.game.winnerId,
            winnerName: updatedRoom!.game.winnerName,
            roundNumber: updatedRoom!.game.roundNumber,
          }
        : null,
    });
  } catch (error) {
    console.error("[Join Room] Error:", error);
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }
}
