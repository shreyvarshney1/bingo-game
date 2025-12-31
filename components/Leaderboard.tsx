"use client";

// Leaderboard Component - Shows player rankings

import React from "react";
import { useGame } from "@/context/GameContext";

export function Leaderboard() {
  const { leaderboard, playerId } = useGame();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          🏆 Leaderboard
        </h3>

        <div className="space-y-2">
          {leaderboard.map((player, index) => {
            const isCurrentPlayer = player.id === playerId;
            const medal =
              index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrentPlayer
                    ? "bg-yellow-500/20 border border-yellow-500/30"
                    : "bg-white/5"
                }`}
              >
                <span className="w-6 text-center text-lg">
                  {medal || `#${index + 1}`}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-white">
                    {player.name}
                    {isCurrentPlayer && " (You)"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 font-bold text-lg">
                    {player.wins}
                  </span>
                  <span className="text-white/50 text-sm">wins</span>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="text-center text-white/50 py-4">
              No games played yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
