"use client";
import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon, AlertIcon, CheckCircleIcon, TimeIcon, BoltIcon } from "@/icons";

export default function TicketMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Total Tickets Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <AlertIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Tickets
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              856
            </h4>
          </div>
          <Badge color="primary">
            <ArrowUpIcon />
            8.2%
          </Badge>
        </div>
      </div>

      {/* Open Tickets Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-error-50 rounded-xl dark:bg-error-500/15">
          <BoltIcon className="text-error-600 size-6 dark:text-error-400" />
        </div>
        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Open Tickets
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              124
            </h4>
          </div>
          <Badge color="error">
            Urgent
          </Badge>
        </div>
      </div>

      {/* Resolved Tickets Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 h-full flex flex-col">
        <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-xl dark:bg-success-500/15">
          <CheckCircleIcon className="text-success-600 size-6 dark:text-success-400" />
        </div>
        <div className="flex items-end justify-between mt-5 flex-grow">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Resolved
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              698
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            12.5%
          </Badge>
        </div>
      </div>

      {/* Pending Tickets Card */}
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
              34
            </h4>
          </div>
          <Badge color="warning">
            In Review
          </Badge>
        </div>
      </div>
    </div>
  );
}




