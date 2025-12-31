"use client";

// Main Game Page - Orchestrates all game components

import { GameProvider, useGame } from "@/context/GameContext";
import { Lobby } from "@/components/Lobby";
import { WaitingRoom } from "@/components/WaitingRoom";
import { BingoCard } from "@/components/BingoCard";
import { GameControls } from "@/components/GameControls";
import { Leaderboard } from "@/components/Leaderboard";
import { WinnerModal } from "@/components/WinnerModal";

function GameContent() {
  const { phase, leaveRoom, roomName, players } = useGame();

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4 pb-safe">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
            🎱 {roomName || "TeamBingo"}
          </h1>
          <p className="text-white/50 text-sm">
            {players.length} player{players.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={leaveRoom}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-sm font-medium rounded-xl transition-all"
        >
          Leave
        </button>
      </header>

      {/* Main Game Area */}
      <main className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls (on desktop) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="space-y-4">
              <GameControls />
              <div className="hidden lg:block">
                <Leaderboard />
              </div>
            </div>
          </div>

          {/* Center Column - Bingo Card */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <BingoCard />
          </div>
        </div>

        {/* Mobile Leaderboard */}
        <div className="lg:hidden mt-6">
          <Leaderboard />
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
