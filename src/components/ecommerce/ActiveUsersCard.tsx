"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, GroupIcon } from "@/icons";

interface DashboardMetrics {
  todayLogin: number;
  totalLogin: number;
  monthlyRevenue: number;
  activeUsers: number;
}

export default function ActiveUsersCard() {
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/dashboard/metrics", {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setActiveUsers(data.data.activeUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching active users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
      </div>

      <div className="flex items-end justify-between mt-5 flex-grow">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Active Users
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {loading ? "..." : formatNumber(activeUsers)}
          </h4>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          Today
        </Badge>
      </div>
    </div>
  );
}

