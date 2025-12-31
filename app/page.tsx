"use client";

// Main Game Page - Orchestrates all game components
// Mobile-first responsive layout

import { GameProvider, useGame } from "@/context/GameContext";
import { Lobby } from "@/components/Lobby";
import { WaitingRoom } from "@/components/WaitingRoom";
import { BingoCard } from "@/components/BingoCard";
import { GameControls } from "@/components/GameControls";
import { Leaderboard } from "@/components/Leaderboard";
import { WinnerModal } from "@/components/WinnerModal";

function GameContent() {
  const { phase, leaveRoom, roomName, players, error, clearError } = useGame();

  // Lobby - Create or Join
  if (phase === "lobby") {
    return <Lobby />;
  }

  // Waiting Room - Pre-game
  if (phase === "waiting") {
    return <WaitingRoom />;
  }

  // Playing or Finished
  return (
    <div className="min-h-screen min-h-dvh bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-red-500/90 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
            <span className="text-sm">{error}</span>
            <button
              onClick={clearError}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header - Fixed on mobile */}
      <header className="relative z-10 flex items-center justify-between p-3 sm:p-4 bg-black/20 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 truncate">
            🎱 {roomName || "TeamBingo"}
          </h1>
          <p className="text-white/50 text-xs sm:text-sm">
            {players.length} player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={leaveRoom}
          className="ml-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl transition-all whitespace-nowrap"
        >
          Leave
        </button>
      </header>

      {/* Main Game Area - Scrollable */}
      <main className="relative z-10 flex-1 overflow-auto p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Mobile Layout: Card first, then controls */}
          <div className="lg:hidden space-y-4">
            {/* Bingo Card - Main focus on mobile */}
            <BingoCard />

            {/* Game Controls */}
            <GameControls />

            {/* Leaderboard */}
            <Leaderboard />
          </div>

          {/* Desktop Layout: Side by side */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6">
            {/* Left Column - Controls */}
            <div className="lg:col-span-1 space-y-4">
              <GameControls />
              <Leaderboard />
            </div>

            {/* Right Column - Bingo Card */}
            <div className="lg:col-span-2">
              <BingoCard />
            </div>
          </div>
        </div>
      </main>

      {/* Winner Modal */}
      {phase === "finished" && <WinnerModal />}
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
