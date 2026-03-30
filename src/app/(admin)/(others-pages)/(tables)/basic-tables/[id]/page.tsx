"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/icons";
import Button from "@/components/ui/button/Button";

import Image from "next/image";

// Game interface stays the same
interface Game {
  uid: number;
  title: string;
  thumb: string;
  categories: string[];
  description: string;
  embedurl: string;
  orientation: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/games/${gameId}`);
        const data = await response.json();
        if (data.success) {
          setGame(data.data);
        } else {
          setError(data.error || "Game not found");
        }
      } catch {
        setError("An error occurred while fetching game details");
      } finally {

        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || "Game not found"}</p>
          <Button onClick={() => router.back()} className="inline-flex items-center gap-2">
            <ChevronLeftIcon className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/[0.03] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Game Details
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View complete game information
            </p>
          </div>
        </div>
      </div>

      {/* Game Hero Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Image */}
          <div className="lg:col-span-1">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <Image
                src={game.thumb || "/images/placeholder.svg"}
                alt={game.title || "Game"}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Game Info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white/90 mb-3">
                {game.title}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                {game.categories?.map((cat, index) => (
                  <span key={index} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                    {cat}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
                  {game.orientation}
                </span>
                <span className="px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-300">
                  ID: {game.uid}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">Embed URL</h3>
              <code className="block p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-gray-600 dark:text-gray-300 break-all">
                {game.embedurl}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          About This Game
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {game.description}
        </p>
      </div>
    </div>
  );
}











