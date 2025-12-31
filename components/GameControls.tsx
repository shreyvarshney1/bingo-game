"use client";

// GameControls Component - Current number display, history, mute, and Bingo button

import React from "react";
import { useGame } from "@/context/GameContext";
import { getColumnForNumber } from "@/lib/bingo-utils";

export function GameControls() {
  const {
    currentNumber,
    calledNumbers,
    isMuted,
    toggleMute,
    claimBingo,
    roundNumber,
    card,
  } = useGame();

  // Get last 5 called numbers (excluding current)
  const historyNumbers = calledNumbers.slice(0, -1).reverse().slice(0, 5);

  // Check if player has potential bingo
  const hasBingo = React.useMemo(() => {
    if (!card) return false;

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (card[row].every((cell) => cell.marked)) return true;
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card.every((row) => row[col].marked)) return true;
    }

    // Check diagonals
    const diag1 = [0, 1, 2, 3, 4].every((i) => card[i][i].marked);
    const diag2 = [0, 1, 2, 3, 4].every((i) => card[i][4 - i].marked);

    return diag1 || diag2;
  }, [card]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Round indicator */}
      <div className="text-center">
        <span className="px-3 py-1 bg-white/10 rounded-full text-white/60 text-sm">
          Round {roundNumber}
        </span>
      </div>

      {/* Current Number Display */}
      <div className="relative">
        <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-1 shadow-2xl shadow-orange-500/30">
          <div className="bg-black/50 backdrop-blur-sm rounded-[22px] p-6 text-center">
            {currentNumber !== null ? (
              <div className="animate-scaleIn">
                <div className="text-white/60 text-sm mb-1">Current Number</div>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                    {getColumnForNumber(currentNumber)}
                  </span>
                  <span className="text-6xl md:text-7xl font-black text-white">
                    {currentNumber}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-white/60">
                <div className="text-sm mb-2">Waiting for first number...</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={`absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shadow-lg ${
            isMuted
              ? "bg-red-500 text-white"
              : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* History Rail */}
      {historyNumbers.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="text-white/50 text-xs mb-2 text-center">
            Previously Called
          </div>
          <div className="flex items-center justify-center gap-2">
            {historyNumbers.map((num, index) => (
              <div
                key={num}
                className="w-12 h-12 rounded-xl bg-white/10 flex flex-col items-center justify-center text-sm transition-all"
                style={{ opacity: 1 - index * 0.15 }}
              >
                <span className="text-yellow-400 text-xs font-bold">
                  {getColumnForNumber(num)}
                </span>
                <span className="text-white font-bold">{num}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numbers called count */}
      <div className="text-center text-white/50 text-sm">
        {calledNumbers.length} of 75 numbers called
      </div>

      {/* Bingo Button */}
      <button
        onClick={claimBingo}
        disabled={!hasBingo}
        className={`w-full py-5 px-6 text-xl font-black rounded-2xl transition-all transform ${
          hasBingo
            ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-orange-500/50 animate-pulse"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        🎯 BINGO! 🎯
      </button>
    </div>
  );
}
