"use client";

// Game Context - Provides game state to all components
// Wraps the useBingoGame hook

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useBingoGame, GamePhase } from "@/hooks/useBingoGame";
import { useAudio } from "@/hooks/useAudio";
import { BingoCard, PlayerInfo, MarkResultPayload } from "@/lib/types";

interface GameContextValue {
  // Connection
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  // Player
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;

  // Room
  roomCode: string | null;
  roomName: string | null;
  players: PlayerInfo[];

  // Game
  phase: GamePhase;
  card: BingoCard | null;
  currentNumber: number | null;
  calledNumbers: number[];
  winner: { id: string; name: string } | null;
  roundNumber: number;
  leaderboard: PlayerInfo[];
  lastMarkResult: MarkResultPayload | null;

  // Audio
  isMuted: boolean;
  toggleMute: () => void;

  // Actions
  createRoom: (playerName: string, roomName: string) => void;
  joinRoom: (playerName: string, roomCode: string) => void;
  startGame: () => void;
  markNumber: (number: number) => void;
  claimBingo: () => void;
  newRound: () => void;
  leaveRoom: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useBingoGame();
  const audio = useAudio();

  // Auto-announce new numbers
  useEffect(() => {
    if (game.currentNumber !== null && !audio.isMuted) {
      audio.speak(game.currentNumber);
    }
  }, [game.currentNumber, audio.isMuted]);

  const value: GameContextValue = {
    // Connection
    isConnected: game.isConnected,
    isLoading: game.isLoading,
    error: game.error,
    clearError: game.clearError,

    // Player
    playerId: game.playerId,
    playerName: game.playerName,
    isHost: game.isHost,

    // Room
    roomCode: game.roomCode,
    roomName: game.roomName,
    players: game.players,

    // Game
    phase: game.phase,
    card: game.card,
    currentNumber: game.currentNumber,
    calledNumbers: game.calledNumbers,
    winner: game.winner,
    roundNumber: game.roundNumber,
    leaderboard: game.leaderboard,
    lastMarkResult: game.lastMarkResult,

    // Audio
    isMuted: audio.isMuted,
    toggleMute: audio.toggleMute,

    // Actions
    createRoom: game.createRoom,
    joinRoom: game.joinRoom,
    startGame: game.startGame,
    markNumber: game.markNumber,
    claimBingo: game.claimBingo,
    newRound: game.newRound,
    leaveRoom: game.leaveRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
