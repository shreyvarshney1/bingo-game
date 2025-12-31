// Shared TypeScript types for TeamBingo
// Used by both client and server

// ================== Bingo Card Types ==================

export interface BingoCell {
  number: number | null; // null for FREE space
  marked: boolean;
  column: "B" | "I" | "N" | "G" | "O";
  row: number; // 0-4
  col: number; // 0-4
}

export type BingoCard = BingoCell[][];

// ================== Player Types ==================

export interface Player {
  id: string;
  socketId: string;
  name: string;
  card: BingoCard | null;
  isHost: boolean;
  isConnected: boolean;
  wins: number;
}

// ================== Room & Game State Types ==================

export type GameStatus = "waiting" | "playing" | "finished";

export interface GameState {
  status: GameStatus;
  calledNumbers: number[];
  currentNumber: number | null;
  winnerId: string | null;
  winnerName: string | null;
  roundNumber: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: Map<string, Player>;
  gameState: GameState;
  callingIntervalId?: NodeJS.Timeout;
}

// Serializable version for client
export interface RoomState {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: PlayerInfo[];
  gameState: GameState;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  wins: number;
}

// ================== Socket Event Payloads ==================

// Client -> Server Events
export interface CreateRoomPayload {
  playerName: string;
  roomName: string;
}

export interface JoinRoomPayload {
  playerName: string;
  roomCode: string;
  sessionId?: string; // For reconnection
}

export interface MarkNumberPayload {
  number: number;
}

// Server -> Client Events
export interface RoomCreatedPayload {
  roomId: string;
  roomCode: string;
  playerId: string;
  sessionId: string;
}

export interface RoomJoinedPayload {
  roomId: string;
  playerId: string;
  sessionId: string;
  roomState: RoomState;
}

export interface PlayerJoinedPayload {
  player: PlayerInfo;
}

export interface PlayerLeftPayload {
  playerId: string;
  playerName: string;
}

export interface GameStartedPayload {
  card: BingoCard;
  gameState: GameState;
}

export interface NumberCalledPayload {
  number: number;
  calledNumbers: number[];
}

export interface MarkResultPayload {
  success: boolean;
  number: number;
  message?: string;
}

export interface WinnerDeclaredPayload {
  winnerId: string;
  winnerName: string;
  roundNumber: number;
}

export interface NewRoundPayload {
  card: BingoCard;
  gameState: GameState;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
}

// ================== Socket Event Names ==================

export const SOCKET_EVENTS = {
  // Client -> Server
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  START_GAME: "start_game",
  MARK_NUMBER: "mark_number",
  CLAIM_BINGO: "claim_bingo",
  NEW_ROUND: "new_round",
  LEAVE_ROOM: "leave_room",

  // Server -> Client
  ROOM_CREATED: "room_created",
  ROOM_JOINED: "room_joined",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",
  GAME_STARTED: "game_started",
  NUMBER_CALLED: "number_called",
  MARK_RESULT: "mark_result",
  WINNER_DECLARED: "winner_declared",
  NEW_ROUND_STARTED: "new_round_started",
  ROOM_STATE_UPDATE: "room_state_update",
  ERROR: "error",
} as const;

// Column ranges for Bingo card generation
export const BINGO_COLUMNS = {
  B: { min: 1, max: 15 },
  I: { min: 16, max: 30 },
  N: { min: 31, max: 45 },
  G: { min: 46, max: 60 },
  O: { min: 61, max: 75 },
} as const;

export type BingoColumn = keyof typeof BINGO_COLUMNS;
