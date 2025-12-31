// Pusher authentication endpoint for private/presence channels

import { NextRequest, NextResponse } from "next/server";
import { getPusher } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string;
    const channelName = formData.get("channel_name") as string;

    // Get user info from request (stored in cookie/header)
    const playerId = request.headers.get("x-player-id") || "anonymous";
    const playerName = request.headers.get("x-player-name") || "Anonymous";

    const pusher = getPusher();

    // For presence channels, include user info
    if (channelName.startsWith("presence-")) {
      const presenceData = {
        user_id: playerId,
        user_info: {
          name: playerName,
        },
      };
      const auth = pusher.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(auth);
    }

    // For private channels, just authorize
    const auth = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(auth);
  } catch (error) {
    console.error("[Pusher Auth] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 403 }
    );
  }
}
