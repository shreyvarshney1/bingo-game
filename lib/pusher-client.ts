"use client";

// Client-side Pusher instance for subscriptions
// Used in React components/hooks

import Pusher from "pusher-js";

// Singleton pattern for Pusher client
let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherClient && typeof window !== "undefined") {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return pusherClient!;
}

// Cleanup function for when component unmounts
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// Channel naming conventions (same as server)
export const CHANNELS = {
  room: (roomCode: string) => `presence-room-${roomCode.toUpperCase()}`,
  game: (roomId: string) => `private-game-${roomId}`,
};

// Event names
export const EVENTS = {
  PLAYER_JOINED: "player-joined",
  PLAYER_LEFT: "player-left",
  GAME_STARTED: "game-started",
  NUMBER_CALLED: "number-called",
  PLAYER_MARKED: "player-marked",
  WINNER_DECLARED: "winner-declared",
  NEW_ROUND: "new-round",
  ROOM_UPDATE: "room-update",
};
