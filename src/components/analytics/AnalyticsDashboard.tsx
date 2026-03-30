"use client";
import React, { useState, useEffect } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import Badge from "../ui/badge/Badge";
import {
    GroupIcon,
    DollarLineIcon,
    PieChartIcon,
    ChevronDownIcon
} from "@/icons";
import Select from "../form/Select";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

interface User {
    id: number;
    useremail: string;
}

interface AnalyticsSummary {
    id: string;
    useremail: string;
    totalSessions: number;
    totalImpressions: number;
    revenueShare: number;
    todayRevenue: number;
    trend: {
        date: string;
        sessions: number;
        impressions: number;
    }[];
    gaStatus?: 'connected' | 'pending_setup';
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all users on mount
    useEffect(() => {
        async function fetchUsers() {
            try {
                const res = await fetch("/api/profile");
                const json = await res.json();
                if (json.success) {
                    const userList = json.data as User[];
                    setUsers(userList);
                    // Default to first user if available
                    if (userList.length > 0) {
                        setSelectedUserId(userList[0].id.toString());
                    }
                }
            } catch (err: unknown) {
                console.error("Failed to fetch users:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    // Fetch analytics when selected user changes
    useEffect(() => {
        if (!selectedUserId) return;

        async function fetchAnalytics() {
            try {
                setAnalyticsLoading(true);
                setError(null);
                // Use the selected user ID in the API call
                const res = await fetch(`/api/admin/analytics/${selectedUserId}/?secret=myAdminDashboardSecret456`);
                if (!res.ok) throw new Error("Failed to fetch analytics for this user");
                const json = await res.json();
                setData(json);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "An unknown error occurred";
                setError(message);
            } finally {
                setAnalyticsLoading(false);
            }
        }
        fetchAnalytics();
    }, [selectedUserId]);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const chartOptions: ApexOptions = {
        colors: ["#465fff", "#9cb1ff"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "area",
            height: 310,
            toolbar: { show: false },
        },
        stroke: { curve: "smooth", width: 2 },
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.5,
                opacityTo: 0.1,
                stops: [0, 90, 100],
            },
        },
        xaxis: {
            categories: data?.trend.map(t => t.date.slice(-2)) || [], // Showing days
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { show: true },
        grid: {
            strokeDashArray: 5,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        dataLabels: { enabled: false },
        tooltip: { x: { format: "dd MMM" } },
    };

    const chartSeries = [
        {
            name: "Sessions",
            data: data?.trend.map(t => t.sessions) || [],
        },
        {
            name: "Impressions",
            data: data?.trend.map(t => t.impressions) || [],
        },
    ];

    const userOptions = users.map(u => ({
        value: u.id.toString(),
        label: `ID: ${u.id} | ${u.useremail}`
    }));

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
            {/* User Selection Header */}
            <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            User Analytics Overview
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select a user to view their specific performance data
                        </p>
                    </div>
                    <div className="w-full sm:w-72 relative">
                        <Select
                            options={userOptions}
                            value={selectedUserId}
                            onChange={setSelectedUserId}
                            placeholder="Select a registered user"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDownIcon className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>

            {analyticsLoading ? (
                <div className="col-span-12 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : error ? (
                <div className="col-span-12 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
                    Error: {error}
                </div>
            ) : data ? (
                <>
                    {/* Setup Warning */}
                    {data.gaStatus === 'pending_setup' && (
                        <div className="col-span-12 p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 mb-2">
                            <strong>Notice:</strong> Your Individual Traffic data is pending. This is because the <code>partner_uid</code> dimension needs to be registered in your GA4 Console (as explained in the instructions). Revenue data from the database is still visible below.
                        </div>
                    )}

                    {/* Metrics Row */}
                    <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <MetricCard
                            title="Sessions"
                            value={data.totalSessions}
                            icon={<GroupIcon />}
                            badge="Live Traffic"
                            color="info"
                        />
                        <MetricCard
                            title="Impressions"
                            value={data.totalImpressions}
                            icon={<PieChartIcon />}
                            badge="GA4 Data"
                            color="success"
                        />
                        <MetricCard
                            title="Monthly Revenue"
                            value={formatCurrency(data.revenueShare)}
                            icon={<DollarLineIcon />}
                            badge="DB Record"
                            color="warning"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Traffic Trends for {data.useremail} (User ID: {data.id})
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Last 30 days performance (including today)
                                </p>
                            </div>
                        </div>
                        <div className="w-full">
                            <ReactApexChart
                                options={chartOptions}
                                series={chartSeries}
                                type="area"
                                height={310}
                                width="100%"
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="col-span-12 p-12 text-center text-gray-500">
                    No data available for this selection.
                </div>
            )}
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    badge: string;
    color: "success" | "error" | "warning" | "info" | "light";
}

function MetricCard({ title, value, icon, badge, color }: MetricCardProps) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 flex flex-col">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <div className="text-gray-800 size-6 dark:text-white/90">{icon}</div>
            </div>
            <div className="flex items-end justify-between mt-5 flex-grow">
                <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
                    <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                        {value}
                    </h4>
                </div>
                <Badge color={color}>{badge}</Badge>
            </div>
        </div>
    );
}

