"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/icons";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";

interface UserDetail {
  id: number;
  useremail: string;
  today_revenue: number;
  yesterday_revenue: number;
  last_7d_revenue: number;
  this_month_revenue: number;
  last_28d_revenue: number;
  settlement_status: string;
  created_at: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserDetail() {
      try {
        const id = params?.id;
        if (!id) return;

        const res = await fetch(`/api/users/${id}`);
        const json = await res.json();

        if (json.success) {
          setUser(json.data);
        } else {
          setError(json.error || "Failed to fetch user details");
        }
      } catch {
        setError("An error occurred while fetching user details");
      } finally {
        setLoading(false);
      }
    }

    fetchUserDetail();
  }, [params?.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 3,
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4 font-medium">Error: {error || "User not found"}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="User Revenue Details" />
      
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/[0.03] transition-colors"
          aria-label="Go back"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {user.useremail}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revenue Performance Metrics for User ID: {user.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            General Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Email Address</Label>
              <p className="mt-1 text-gray-900 dark:text-white font-medium">{user.useremail}</p>
            </div>
            <div>
              <Label>Settlement Status</Label>
              <p className="mt-1">
                <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                  user.settlement_status === 'completed' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {user.settlement_status}
                </span>
              </p>
            </div>
            <div>
              <Label>Record Created At</Label>
              <p className="mt-1 text-gray-700 dark:text-gray-300">
                {new Date(user.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Revenue Cards */}
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
          <Label className="text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-xs font-bold">Today&apos;s Revenue</Label>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(user.today_revenue)}</p>
        </div>

        <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <Label className="text-blue-700 dark:text-blue-400 uppercase tracking-wider text-xs font-bold">Yesterday&apos;s Revenue</Label>
          <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(user.yesterday_revenue)}</p>
        </div>

        <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
          <Label className="text-indigo-700 dark:text-indigo-400 uppercase tracking-wider text-xs font-bold">Last 7 Days</Label>
          <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(user.last_7d_revenue)}</p>
        </div>

        <div className="p-6 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 shadow-sm">
          <Label className="text-purple-700 dark:text-purple-400 uppercase tracking-wider text-xs font-bold">Monthly Revenue</Label>
          <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(user.this_month_revenue)}</p>
        </div>

        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 shadow-sm">
          <Label className="text-amber-700 dark:text-amber-400 uppercase tracking-wider text-xs font-bold">Last 28 Days</Label>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(user.last_28d_revenue)}</p>
        </div>
      </div>
    </div>
  );
}
