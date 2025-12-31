"use client";

// WinnerModal Component - Victory celebration with confetti

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { useGame } from "@/context/GameContext";

export function WinnerModal() {
  const { winner, isHost, newRound, leaveRoom, playerId, roundNumber } =
    useGame();

  const isWinner = winner?.id === playerId;

  // Trigger confetti on mount
  useEffect(() => {
    if (winner) {
      // Fire confetti from both sides
      const fireConfetti = () => {
        const count = 200;
        const defaults = {
          origin: { y: 0.7 },
          zIndex: 9999,
        };

        function fire(particleRatio: number, opts: confetti.Options) {
          confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio),
          });
        }

        fire(0.25, {
          spread: 26,
          startVelocity: 55,
          origin: { x: 0.2, y: 0.7 },
        });

        fire(0.2, {
          spread: 60,
          origin: { x: 0.5, y: 0.7 },
        });

        fire(0.35, {
          spread: 100,
          decay: 0.91,
          scalar: 0.8,
          origin: { x: 0.8, y: 0.7 },
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 25,
          decay: 0.92,
          scalar: 1.2,
          origin: { x: 0.5, y: 0.7 },
        });

        fire(0.1, {
          spread: 120,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.7 },
        });
      };

      fireConfetti();

      // Fire again after a short delay
      const timer = setTimeout(fireConfetti, 500);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-scaleIn">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-3xl blur-xl" />

        <div className="relative">
          {/* Trophy */}
          <div className="text-center mb-6">
            <div className="text-8xl animate-bounce">🏆</div>
          </div>

          {/* Winner announcement */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 mb-2">
              BINGO!
            </h2>
            <p className="text-2xl font-bold text-white">
              {isWinner ? "🎉 You Won! 🎉" : `${winner.name} Wins!`}
            </p>
            <p className="text-white/60 mt-2">Round {roundNumber} Complete</p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isHost && (
              <button
                onClick={newRound}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-black font-bold text-lg rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                🔄 New Round
              </button>
            )}

            {!isHost && (
              <div className="w-full py-4 px-6 bg-white/10 border border-white/20 rounded-2xl text-center text-white/80">
                Waiting for host to start new round...
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
    </div>
  );
}
