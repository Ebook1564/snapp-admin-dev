"use client";
import React, { useState, useEffect } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, DollarLineIcon, CheckCircleIcon, TimeIcon } from "@/icons";

interface SettlementData {
  settlement_status: string;
  this_month_revenue: number;
}

export default function SettlementMetrics() {
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/users");
        const json = await res.json();
        if (json.success) {
          const data: SettlementData[] = json.data;
          const stats = {
            total: data.length,
            pending: data.filter(s => s.settlement_status === 'pending').length,
            completed: data.filter(s => s.settlement_status === 'completed').length,
            totalAmount: data.reduce((acc, s) => acc + Number(s.this_month_revenue || 0), 0)
          };
          setMetrics(stats);
        }
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const renderValue = (val: string | number) => loading ? "..." : val;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Total Settlements Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Settlements
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {renderValue(metrics.total)}
            </h4>
          </div>
          <Badge color="primary">
            <ArrowUpIcon />
            12.5%
          </Badge>
        </div>
      </div>

      {/* Pending Settlements Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-warning-50 rounded-xl dark:bg-warning-500/15">
          <TimeIcon className="text-warning-600 size-6 dark:text-warning-400" />
        </div>
        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Pending
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {renderValue(metrics.pending)}
            </h4>
          </div>
          <Badge color="warning">
            Processing
          </Badge>
        </div>
      </div>

      {/* Completed Settlements Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/15">
          <CheckCircleIcon className="text-success-600 size-6 dark:text-success-400" />
        </div>
        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Completed
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {renderValue(metrics.completed)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            8.2%
          </Badge>
        </div>
      </div>

      {/* Total Amount Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Amount
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loading ? "..." : formatCurrency(metrics.totalAmount)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            15.8%
          </Badge>
        </div>
      </div>
    </div>
  );
}

