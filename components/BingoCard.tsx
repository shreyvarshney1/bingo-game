"use client";

// BingoCard Component - The 5x5 game grid

import React, { useState, useCallback } from "react";
import { useGame } from "@/context/GameContext";
import { BingoCell } from "@/lib/types";
import { getColumnForNumber } from "@/lib/bingo-utils";

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

  if (!card) return null;

  return (
    <div className="w-full max-w-[min(90vw,400px)] mx-auto">
      {/* Column Headers */}
      <div className="grid grid-cols-5 gap-1 mb-1">
        {COLUMN_HEADERS.map((letter) => (
          <div
            key={letter}
            className="aspect-square flex items-center justify-center text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-400"
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1 bg-gradient-to-br from-indigo-800 to-purple-900 p-2 rounded-2xl shadow-2xl">
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
                  text-lg md:text-xl font-bold
                  rounded-xl transition-all duration-200
                  min-h-[44px] min-w-[44px]
                  ${isShaking ? "animate-shake" : ""}
                  ${
                    isFree
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black cursor-default"
                      : cell.marked
                      ? "bg-gradient-to-br from-emerald-400 to-green-500 text-black shadow-lg shadow-emerald-500/30 scale-95"
                      : isJustCalled
                      ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white animate-pulse ring-2 ring-white/50"
                      : isCalled
                      ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white hover:scale-105 cursor-pointer"
                      : "bg-white/10 text-white/80 hover:bg-white/20 cursor-pointer"
                  }
                `}
              >
                {isFree ? (
                  <span className="text-xs md:text-sm font-black">FREE</span>
                ) : cell.marked ? (
                  <span className="relative">
                    <span className="opacity-30">{cell.number}</span>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl">
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
        <div className="mt-4 text-center">
          <div className="inline-block px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm animate-bounce">
            ❌ {lastMarkResult.message}
          </div>
        </div>
      )}
    </div>
  );
}
