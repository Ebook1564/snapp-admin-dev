"use client";
import React from "react";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { ChevronLeftIcon } from "@/icons";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
    const router = useRouter();

    return (
        <div className="space-y-6">
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
                            Google Analytics Data
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            View real-time traffic and revenue performance
                        </p>
                    </div>
                </div>
            </div>

            <AnalyticsDashboard />
        </div>
    );
}
