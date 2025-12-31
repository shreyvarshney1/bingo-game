// Bingo game utility functions
// Used by both client and server

import { BingoCard, BingoCell, BINGO_COLUMNS, BingoColumn } from "./types";

const COLUMN_ORDER: BingoColumn[] = ["B", "I", "N", "G", "O"];

/**
 * Generate a random unique Bingo card following standard rules:
 * - B column: 1-15
 * - I column: 16-30
 * - N column: 31-45 (center is FREE)
 * - G column: 46-60
 * - O column: 61-75
 */
export function generateBingoCard(): BingoCard {
  const card: BingoCard = [];

  for (let row = 0; row < 5; row++) {
    const rowCells: BingoCell[] = [];
    for (let col = 0; col < 5; col++) {
      const column = COLUMN_ORDER[col];
      rowCells.push({
        number: 0, // Placeholder, will be filled below
        marked: false,
        column,
        row,
        col,
      });
    }
    card.push(rowCells);
  }

  // Fill each column with random numbers from its range
  for (let col = 0; col < 5; col++) {
    const column = COLUMN_ORDER[col];
    const { min, max } = BINGO_COLUMNS[column];
    const numbers = getRandomNumbers(min, max, 5);

    for (let row = 0; row < 5; row++) {
      // Center cell (row 2, col 2) is FREE
      if (row === 2 && col === 2) {
        card[row][col].number = null;
        card[row][col].marked = true; // FREE space is pre-marked
      } else {
        card[row][col].number = numbers[row];
      }
    }
  }

  return card;
}

/**
 * Get N random unique numbers from a range
 */
function getRandomNumbers(min: number, max: number, count: number): number[] {
  const numbers: number[] = [];
  const available = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    numbers.push(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return numbers;
}

/**
 * Check if a card has a winning pattern
 * Returns the winning pattern type or null if no win
 */
export function checkWinCondition(card: BingoCard): string | null {
  // Check all rows (horizontal)
  for (let row = 0; row < 5; row++) {
    if (card[row].every((cell) => cell.marked)) {
      return `Row ${row + 1}`;
    }
  }

  // Check all columns (vertical)
  for (let col = 0; col < 5; col++) {
    const columnMarked = card.every((row) => row[col].marked);
    if (columnMarked) {
      return `Column ${COLUMN_ORDER[col]}`;
    }
  }

  // Check diagonal (top-left to bottom-right)
  const diagonal1 = [0, 1, 2, 3, 4].every((i) => card[i][i].marked);
  if (diagonal1) {
    return "Diagonal (↘)";
  }

  // Check diagonal (top-right to bottom-left)
  const diagonal2 = [0, 1, 2, 3, 4].every((i) => card[i][4 - i].marked);
  if (diagonal2) {
    return "Diagonal (↙)";
  }

  return null;
}

/**
 * Validate that all marked numbers on a card were actually called
 */
export function validateCard(
  card: BingoCard,
  calledNumbers: number[]
): boolean {
  const calledSet = new Set(calledNumbers);

  for (const row of card) {
    for (const cell of row) {
      // Skip FREE space (null number)
      if (cell.number === null) continue;

      // If marked, must be in called numbers
      if (cell.marked && !calledSet.has(cell.number)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a number exists on a card
 */
export function findNumberOnCard(
  card: BingoCard,
  number: number
): { row: number; col: number } | null {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (card[row][col].number === number) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Generate a short alphanumeric room code
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get the column letter for a number (1-75)
 */
export function getColumnForNumber(number: number): BingoColumn {
  if (number >= 1 && number <= 15) return "B";
  if (number >= 16 && number <= 30) return "I";
  if (number >= 31 && number <= 45) return "N";
  if (number >= 46 && number <= 60) return "G";
  return "O";
}

/**
 * Format a number for announcement (e.g., "B 12")
 */
export function formatNumberAnnouncement(number: number): string {
  const column = getColumnForNumber(number);
  return `${column} ${number}`;
}

/**
 * Generate a unique session ID for reconnection
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
