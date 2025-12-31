"use client";

// useBingoGame Hook - Pusher-based implementation
// Handles game state and real-time updates via Pusher

import { useState, useEffect, useCallback, useRef } from "react";
import Pusher, { Channel } from "pusher-js";
import { BingoCard, PlayerInfo, MarkResultPayload } from "@/lib/types";
import { EVENTS } from "@/lib/pusher-client";

// Session storage keys
const SESSION_ID_KEY = "teambingo_session_id";
const ROOM_CODE_KEY = "teambingo_room_code";
const PLAYER_ID_KEY = "teambingo_player_id";
const ROOM_ID_KEY = "teambingo_room_id";

export type GamePhase = "lobby" | "waiting" | "playing" | "finished";

interface UseBingoGameReturn {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  // Player state
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;

  // Room state
  roomId: string | null;
  roomCode: string | null;
  roomName: string | null;
  players: PlayerInfo[];

  // Game state
  phase: GamePhase;
  card: BingoCard | null;
  currentNumber: number | null;
  calledNumbers: number[];
  winner: { id: string; name: string } | null;
  roundNumber: number;
  leaderboard: PlayerInfo[];

  // Mark state
  lastMarkResult: MarkResultPayload | null;

  // Actions
  createRoom: (playerName: string, roomName: string) => Promise<void>;
  joinRoom: (playerName: string, roomCode: string) => Promise<void>;
  startGame: () => Promise<void>;
  markNumber: (number: number) => Promise<void>;
  claimBingo: () => Promise<void>;
  newRound: () => Promise<void>;
  leaveRoom: () => void;
}

export function useBingoGame(): UseBingoGameReturn {
  // Pusher refs
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const callingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCallingRef = useRef(false); // Track if we should keep calling

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  // Room state
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  // Game state
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [card, setCard] = useState<BingoCard | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [winner, setWinner] = useState<{ id: string; name: string } | null>(
    null
  );
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastMarkResult, setLastMarkResult] =
    useState<MarkResultPayload | null>(null);

  // Fetch player's card from server
  const fetchPlayerCard = useCallback(
    async (rId: string, pId: string) => {
      try {
        const res = await fetch(
          `/api/room/state?code=${roomCode}&playerId=${pId}`
        );
        const data = await res.json();
        if (data.playerCard) {
          setCard(data.playerCard);
        }
      } catch (err) {
        console.error("[Fetch Card] Error:", err);
      }
    },
    [roomCode]
  );

  // Initialize Pusher connection
  useEffect(() => {
    if (typeof window === "undefined") return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn("[Pusher] Missing configuration");
      return;
    }

    pusherRef.current = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
    });

    pusherRef.current.connection.bind("connected", () => {
      console.log("[Pusher] Connected");
      setIsConnected(true);
    });

    pusherRef.current.connection.bind("disconnected", () => {
      console.log("[Pusher] Disconnected");
      setIsConnected(false);
    });

    pusherRef.current.connection.bind("error", (err: any) => {
      console.error("[Pusher] Error:", err);
      setError("Connection error");
    });

    return () => {
      isCallingRef.current = false;
      if (callingIntervalRef.current) {
        clearTimeout(callingIntervalRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current?.unsubscribe(channelRef.current.name);
      }
      pusherRef.current?.disconnect();
    };
  }, []);

  // Subscribe to room channel
  const subscribeToRoom = useCallback(
    (code: string, currentRoomId: string, currentPlayerId: string) => {
      if (!pusherRef.current) return;

      const channelName = `presence-room-${code.toUpperCase()}`;

      // Unsubscribe from previous channel if any
      if (channelRef.current) {
        channelRef.current.unbind_all();
        pusherRef.current.unsubscribe(channelRef.current.name);
      }

      channelRef.current = pusherRef.current.subscribe(channelName);

      // Bind to events
      channelRef.current.bind(EVENTS.PLAYER_JOINED, (data: any) => {
        console.log("[Pusher] Player joined:", data);
        setPlayers((prev) => {
          if (prev.find((p) => p.id === data.player.id)) return prev;
          return [...prev, data.player];
        });
      });

      channelRef.current.bind(EVENTS.PLAYER_LEFT, (data: any) => {
        console.log("[Pusher] Player left:", data);
        setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
      });

      channelRef.current.bind(EVENTS.GAME_STARTED, async (data: any) => {
        console.log("[Pusher] Game started:", data);
        setPhase("playing");
        setCalledNumbers([]);
        setCurrentNumber(null);
        setWinner(null);

        // Non-host players need to fetch their card
        // Get card from the event data or fetch it
        if (data.playerCards && data.playerCards[currentPlayerId]) {
          setCard(data.playerCards[currentPlayerId]);
        } else {
          // Fetch card from server
          try {
            const res = await fetch(
              `/api/room/state?code=${code}&playerId=${currentPlayerId}`
            );
            const stateData = await res.json();
            if (stateData.playerCard) {
              setCard(stateData.playerCard);
            }
          } catch (err) {
            console.error("[Fetch Card] Error:", err);
          }
        }
      });

      channelRef.current.bind(EVENTS.NUMBER_CALLED, (data: any) => {
        console.log("[Pusher] Number called:", data.number);
        setCurrentNumber(data.number);
        setCalledNumbers(data.calledNumbers);
      });

      channelRef.current.bind(EVENTS.WINNER_DECLARED, (data: any) => {
        console.log("[Pusher] Winner declared:", data);
        setWinner({ id: data.winnerId, name: data.winnerName });
        setPhase("finished");
        setRoundNumber(data.roundNumber);

        // Stop calling
        isCallingRef.current = false;
        if (callingIntervalRef.current) {
          clearTimeout(callingIntervalRef.current);
          callingIntervalRef.current = null;
        }
      });

      channelRef.current.bind(EVENTS.NEW_ROUND, async (data: any) => {
        console.log("[Pusher] New round:", data);
        setPhase("playing");
        setCalledNumbers([]);
        setCurrentNumber(null);
        setWinner(null);
        setRoundNumber(data.roundNumber);

        // Fetch new card
        try {
          const res = await fetch(
            `/api/room/state?code=${code}&playerId=${currentPlayerId}`
          );
          const stateData = await res.json();
          if (stateData.playerCard) {
            setCard(stateData.playerCard);
          }
        } catch (err) {
          console.error("[Fetch Card] Error:", err);
        }
      });

      channelRef.current.bind(EVENTS.ROOM_UPDATE, (data: any) => {
        console.log("[Pusher] Room update:", data);
        if (data.players) setPlayers(data.players);
      });
    },
    []
  );

  // ================== Actions ==================

  const createRoom = useCallback(
    async (name: string, room: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/room/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerName: name, roomName: room }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create room");
        }

        setPlayerId(data.playerId);
        setPlayerName(name);
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        setRoomName(data.roomName);
        setIsHost(true);
        setPlayers(data.players);
        setPhase("waiting");

        // Save to localStorage
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
        localStorage.setItem(ROOM_CODE_KEY, data.roomCode);
        localStorage.setItem(PLAYER_ID_KEY, data.playerId);
        localStorage.setItem(ROOM_ID_KEY, data.roomId);

        // Subscribe to room
        subscribeToRoom(data.roomCode, data.roomId, data.playerId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [subscribeToRoom]
  );

  const joinRoom = useCallback(
    async (name: string, code: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const existingSessionId = localStorage.getItem(SESSION_ID_KEY);

        const res = await fetch("/api/room/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: name,
            roomCode: code,
            existingSessionId,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to join room");
        }

        setPlayerId(data.playerId);
        setPlayerName(name);
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        setRoomName(data.roomName);
        setIsHost(data.isHost);
        setPlayers(data.players);

        if (data.card) setCard(data.card);

        if (data.gameState) {
          if (data.gameState.status === "playing") {
            setPhase("playing");
            setCalledNumbers(data.gameState.calledNumbers);
            setCurrentNumber(data.gameState.currentNumber);
            setRoundNumber(data.gameState.roundNumber);
          } else if (data.gameState.status === "finished") {
            setPhase("finished");
            if (data.gameState.winnerId) {
              setWinner({
                id: data.gameState.winnerId,
                name: data.gameState.winnerName,
              });
            }
          } else {
            setPhase("waiting");
          }
        } else {
          setPhase("waiting");
        }

        // Save to localStorage
        localStorage.setItem(SESSION_ID_KEY, data.sessionId);
        localStorage.setItem(ROOM_CODE_KEY, data.roomCode);
        localStorage.setItem(PLAYER_ID_KEY, data.playerId);
        localStorage.setItem(ROOM_ID_KEY, data.roomId);

        // Subscribe to room
        subscribeToRoom(data.roomCode, data.roomId, data.playerId);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [subscribeToRoom]
  );

  const startGame = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start game");
      }

      // Set our card
      if (data.playerCards && data.playerCards[playerId]) {
        setCard(data.playerCards[playerId]);
      }

      setPhase("playing");
      setCalledNumbers([]);
      setCurrentNumber(null);

      // Start calling numbers as host
      if (isHost) {
        isCallingRef.current = true;

        const callNextNumber = async () => {
          if (!isCallingRef.current) return;

          try {
            const callRes = await fetch("/api/game/call-number", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, playerId }),
            });

            if (!callRes.ok) {
              const errorData = await callRes.json();
              console.warn("[Call Number] Error:", errorData.error);
              // Don't stop calling on temporary errors
              if (errorData.error?.includes("All numbers")) {
                isCallingRef.current = false;
                return;
              }
            }
          } catch (err) {
            console.error("[Call Number] Error:", err);
          }

          // Schedule next call if still active
          if (isCallingRef.current) {
            const delay = Math.floor(Math.random() * 3000) + 5000; // 5-8 seconds
            callingIntervalRef.current = setTimeout(callNextNumber, delay);
          }
        };

        // Start first call after initial delay
        callingIntervalRef.current = setTimeout(callNextNumber, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [roomId, playerId, isHost]);

  const markNumber = useCallback(
    async (number: number) => {
      if (!roomId || !playerId) return;

      // Client-side validation
      if (!calledNumbers.includes(number)) {
        setLastMarkResult({
          success: false,
          number,
          message: "Number has not been called yet!",
        });
        setTimeout(() => setLastMarkResult(null), 2000);
        return;
      }

      try {
        const res = await fetch("/api/game/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, playerId, number }),
        });

        const data = await res.json();

        if (data.success) {
          setCard(data.card);
          setLastMarkResult({ success: true, number });
        } else {
          setLastMarkResult({
            success: false,
            number,
            message: data.error || "Failed to mark",
          });
        }

        setTimeout(() => setLastMarkResult(null), 2000);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [roomId, playerId, calledNumbers]
  );

  const claimBingo = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const res = await fetch("/api/game/claim-bingo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.error || "Invalid Bingo claim");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [roomId, playerId]);

  const newRound = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const res = await fetch("/api/game/new-round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start new round");
      }

      // Set our new card
      if (data.playerCards && data.playerCards[playerId]) {
        setCard(data.playerCards[playerId]);
      }

      // Restart calling as host
      if (isHost) {
        isCallingRef.current = true;

        const callNextNumber = async () => {
          if (!isCallingRef.current) return;

          try {
            await fetch("/api/game/call-number", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId, playerId }),
            });
          } catch (err) {
            console.error("[Call Number] Error:", err);
          }

          if (isCallingRef.current) {
            const delay = Math.floor(Math.random() * 3000) + 5000;
            callingIntervalRef.current = setTimeout(callNextNumber, delay);
          }
        };

        callingIntervalRef.current = setTimeout(callNextNumber, 3000);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [roomId, playerId, isHost]);

  const leaveRoom = useCallback(() => {
    // Stop calling
    isCallingRef.current = false;
    if (callingIntervalRef.current) {
      clearTimeout(callingIntervalRef.current);
      callingIntervalRef.current = null;
    }

    // Unsubscribe from channel
    if (channelRef.current && pusherRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current.unsubscribe(channelRef.current.name);
      channelRef.current = null;
    }

    // Clear all state
    setPlayerId(null);
    setPlayerName(null);
    setIsHost(false);
    setRoomId(null);
    setRoomCode(null);
    setRoomName(null);
    setPlayers([]);
    setPhase("lobby");
    setCard(null);
    setCurrentNumber(null);
    setCalledNumbers([]);
    setWinner(null);
    setRoundNumber(1);
    setError(null);

    // Clear localStorage
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(ROOM_CODE_KEY);
    localStorage.removeItem(PLAYER_ID_KEY);
    localStorage.removeItem(ROOM_ID_KEY);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calculate leaderboard
  const leaderboard = [...players].sort((a, b) => b.wins - a.wins);

  return {
    // Connection state
    isConnected,
    isLoading,
    error,
    clearError,

    // Player state
    playerId,
    playerName,
    isHost,

    // Room state
    roomId,
    roomCode,
    roomName,
    players,

    // Game state
    phase,
    card,
    currentNumber,
    calledNumbers,
    winner,
    roundNumber,
    leaderboard,
    lastMarkResult,

    // Actions
    createRoom,
    joinRoom,
    startGame,
    markNumber,
    claimBingo,
    newRound,
    leaveRoom,
  };
}
