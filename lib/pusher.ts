// Server-side Pusher instance for triggering events
// Used in API routes only

import Pusher from "pusher";

// Lazy initialization to avoid errors during build
let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherInstance;
}

// Pusher channel naming conventions
export const CHANNELS = {
  room: (roomCode: string) => `presence-room-${roomCode.toUpperCase()}`,
  game: (roomId: string) => `private-game-${roomId}`,
};

// Pusher event names
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
