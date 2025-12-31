import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeamBingo - Real-Time Multiplayer Bingo",
  description:
    "Play Bingo with your friends in real-time! Create a room, share the code, and compete to be the first to get BINGO!",
  keywords: ["bingo", "multiplayer", "game", "real-time", "team", "party game"],
  authors: [{ name: "TeamBingo" }],
  openGraph: {
    title: "TeamBingo - Real-Time Multiplayer Bingo",
    description: "Play Bingo with your friends in real-time!",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e1b4b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prevent iOS from zooming on input focus */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
