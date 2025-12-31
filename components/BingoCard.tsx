"use client";

// BingoCard Component - The 5x5 game grid
// Mobile-first responsive design

import React, { useState, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { BingoCell } from "@/lib/types";

const COLUMN_HEADERS = ["B", "I", "N", "G", "O"];

export function BingoCard() {
  const { card, markNumber, calledNumbers, lastMarkResult, currentNumber } =
    useGame();
  const [shakingCell, setShakingCell] = useState<string | null>(null);

  const handleCellClick = useCallback(
    (cell: BingoCell) => {
      // Ignore if already marked or FREE space
      if (cell.marked || cell.number === null) return;

      // Check if number was called
      if (!calledNumbers.includes(cell.number)) {
        // Trigger shake animation
        setShakingCell(`${cell.row}-${cell.col}`);
        setTimeout(() => setShakingCell(null), 500);
        return;
      }

      markNumber(cell.number);
    },
    [calledNumbers, markNumber]
  );

  if (!card) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <div className="text-white/60 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white/30 border-t-white rounded-full mx-auto mb-4" />
          <p>Loading your card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-0">
      {/* Card Container - Responsive width */}
      <div className="w-full max-w-[min(95vw,420px)] mx-auto">
        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 mb-1 sm:mb-2">
          {COLUMN_HEADERS.map((letter) => (
            <div
              key={letter}
              className="h-8 sm:h-10 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-400"
            >
              {letter}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 bg-gradient-to-br from-indigo-800 to-purple-900 p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-2xl">
          {card.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isJustCalled = cell.number === currentNumber;
              const isCalled =
                cell.number !== null && calledNumbers.includes(cell.number);
              const isShaking = shakingCell === `${rowIndex}-${colIndex}`;
              const isFree = cell.number === null;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(cell)}
                  disabled={cell.marked}
                  className={`
                    aspect-square flex items-center justify-center
                    text-base sm:text-lg md:text-xl font-bold
                    rounded-lg sm:rounded-xl transition-all duration-200
                    touch-manipulation select-none
                    ${isShaking ? "animate-shake" : ""}
                    ${
                      isFree
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black cursor-default"
                        : cell.marked
                        ? "bg-gradient-to-br from-emerald-400 to-green-500 text-black shadow-lg shadow-emerald-500/30 scale-[0.92]"
                        : isJustCalled
                        ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white animate-pulse ring-2 ring-white/50 hover:scale-105 active:scale-95 cursor-pointer"
                        : isCalled
                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white hover:scale-105 active:scale-95 cursor-pointer"
                        : "bg-white/10 text-white/80 hover:bg-white/20 active:bg-white/30 cursor-pointer"
                    }
                  `}
                  style={{ minHeight: "48px", minWidth: "48px" }}
                >
                  {isFree ? (
                    <span className="text-[10px] sm:text-xs md:text-sm font-black">
                      FREE
                    </span>
                  ) : cell.marked ? (
                    <span className="relative">
                      <span className="opacity-20 text-sm sm:text-base">
                        {cell.number}
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl">
                        ✓
                      </span>
                    </span>
                  ) : (
                    cell.number
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Mark result feedback */}
        {lastMarkResult && !lastMarkResult.success && (
          <div className="mt-3 sm:mt-4 text-center">
            <div className="inline-block px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs sm:text-sm animate-bounce">
              ❌ {lastMarkResult.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
