"use client";

// WaitingRoom Component - Pre-game lobby

import React, { useState } from "react";
import { useGame } from "@/context/GameContext";

export function WaitingRoom() {
  const {
    roomCode,
    roomName,
    players,
    isHost,
    playerName,
    startGame,
    leaveRoom,
  } = useGame();
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Room Info Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">{roomName}</h2>

          {/* Invite Code */}
          <div className="bg-black/30 rounded-2xl p-4 mb-4">
            <p className="text-white/60 text-sm mb-2">Share this code:</p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-4xl font-mono font-bold text-yellow-300 tracking-[0.3em]">
                {roomCode}
              </span>
              <button
                onClick={copyCode}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Player count */}
          <div className="flex items-center gap-2 text-white/80">
            <span className="text-2xl">👥</span>
            <span>
              {players.length} player{players.length !== 1 ? "s" : ""} in room
            </span>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all animate-fadeIn ${
                  player.name === playerName
                    ? "bg-yellow-500/20 border border-yellow-500/30"
                    : "bg-white/5"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    player.isHost
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  }`}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {player.name}
                      {player.name === playerName && " (You)"}
                    </span>
                    {player.isHost && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-500/30 text-yellow-300 rounded-full">
                        Host
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        player.isConnected ? "bg-emerald-400" : "bg-gray-400"
                      }`}
                    />
                    {player.isConnected ? "Online" : "Offline"}
                  </div>
                </div>
                {player.wins > 0 && (
                  <div className="text-yellow-400 font-bold">
                    🏆 {player.wins}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={startGame}
              disabled={players.length < 1}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              🎮 Start Game
            </button>
          ) : (
            <div className="w-full py-4 px-6 bg-white/10 border border-white/20 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-white/80">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Waiting for host to start...
              </div>
            </div>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-3 px-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-medium rounded-2xl transition-all"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
