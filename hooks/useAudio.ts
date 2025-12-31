"use client";

// useAudio Hook - Web Speech API wrapper for Bot voice
// Handles text-to-speech for number announcements

import { useState, useCallback, useEffect, useRef } from "react";
import { formatNumberAnnouncement } from "@/lib/bingo-utils";

interface UseAudioReturn {
  speak: (number: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  isSpeaking: boolean;
}

export function useAudio(): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;

      // Load voices (may be async)
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // Prefer English voices
        const englishVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Microsoft") ||
              v.name.includes("Samantha"))
        );
        voiceRef.current = englishVoice || voices[0] || null;
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback(
    (number: number) => {
      if (isMuted || !synthRef.current) return;

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const text = formatNumberAnnouncement(number);
      const utterance = new SpeechSynthesisUtterance(text);

      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }

      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev && synthRef.current) {
        // Muting - cancel current speech
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (muted && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    isMuted,
    toggleMute,
    setMuted,
    isSpeaking,
  };
}
