"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { EyeIcon } from "@/icons";
import Pagination from "../tables/Pagination";
import Badge from "../ui/badge/Badge";

interface Ticket {
  id: number;
  category: string;
  description: string;
  attachment_filename: string | null;
  attachment_filetype: string | null;
  attachment_filesize: number | null;
  attachment_id: string | null;
  status: "open" | "pending" | "resolved" | "closed";
  created_at: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}

const ITEMS_PER_PAGE = 10;

export default function TicketsTable() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<"all" | "open" | "pending" | "resolved" | "closed">("all");
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, debouncedSearchQuery]);

  // Extract subject from description
  const getSubjectFromDescription = (description: string): string => {
    const subjectMatch = description.match(/Subject:\s*(.+?)(?:\n|$)/i);
    return subjectMatch ? subjectMatch[1].trim() : description.substring(0, 50) + (description.length > 50 ? "..." : "");
  };

  // Fetch tickets from API
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: selectedTab === "all" ? "" : selectedTab,
        search: debouncedSearchQuery || "",
      });

      const res = await fetch(`/api/tickets?${params.toString()}`, {
        cache: 'no-store'
      });
      
      const apiResponse: ApiResponse = await res.json();
      
      if (!res.ok || !apiResponse.success) {
        throw new Error(apiResponse.error || `HTTP error! status: ${res.status}`);
      }
      
      const data = apiResponse.data;
      setTickets(data.tickets || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / ITEMS_PER_PAGE));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load tickets";
      setError(`Failed to load tickets: ${errorMessage}. Please try again.`);
      setTickets([]);
      setTotalCount(0);
      setTotalPages(0);
      console.error("Fetch tickets error:", err);
    } finally {

      setLoading(false);
    }
  }, [currentPage, selectedTab, debouncedSearchQuery]);

  // Initial fetch and refetch on changes
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const getStatusBadge = (status: "open" | "pending" | "resolved" | "closed") => {
    const statusConfig: Record<"open" | "pending" | "resolved" | "closed", { color: "error" | "warning" | "info" | "success" | "light"; label: string }> = {
      open: { color: "warning", label: "Open" },
      pending: { color: "info", label: "Pending" },
      resolved: { color: "success", label: "Resolved" },
      closed: { color: "light", label: "Closed" },
    };

    const config = statusConfig[status] || { color: "info" as const, label: "Pending" };
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleRowClick = (ticketId: number) => {
    router.push(`/tickets/${ticketId}`);
  };

  const handleViewClick = (e: React.MouseEvent<HTMLButtonElement>, ticketId: number) => {
    e.stopPropagation();
    router.push(`/tickets/${ticketId}`);
  };




  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-lg font-medium text-gray-900 dark:text-white">Loading tickets...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fetching your support tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ticket Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and track all support tickets ({totalCount.toLocaleString()} total)
          </p>
        </div>
      </div>

      {/* Success/Error Message */}
      {error && !error.includes("export") && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs and Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900">
          {[
            { key: "all" as const, label: "All" },
            { key: "open" as const, label: "Open" },
            { key: "pending" as const, label: "Pending" },
            { key: "resolved" as const, label: "Resolved" },
            { key: "closed" as const, label: "Closed" },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedTab(key)}
              className={`px-4 py-2.5 font-semibold text-sm rounded-lg transition-all duration-200 ${
                selectedTab === key
                  ? "bg-white text-blue-600 shadow-md dark:bg-gray-800 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 pl-11 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 transition-all"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800/50">
              <TableRow>
                <TableCell isHeader className="py-4 pl-6 font-bold text-gray-900 text-sm dark:text-white w-24">ID</TableCell>
                <TableCell isHeader className="py-4 font-bold text-gray-900 text-sm dark:text-white">Category</TableCell>
                <TableCell isHeader className="py-4 font-bold text-gray-900 text-sm dark:text-white">Subject & Description</TableCell>
                <TableCell isHeader className="py-4 font-bold text-gray-900 text-sm dark:text-white w-32">Status</TableCell>
                <TableCell isHeader className="py-4 font-bold text-gray-900 text-sm dark:text-white">Created At</TableCell>
                <TableCell isHeader className="py-4 pr-6 font-bold text-gray-900 text-sm dark:text-white w-24 text-center">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center dark:bg-gray-800">
                        <span className="text-3xl">📋</span>
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {searchQuery || selectedTab !== "all" ? "No matching tickets" : "No tickets yet"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                          {searchQuery 
                            ? `No tickets match "${searchQuery}". Try different keywords.` 
                            : selectedTab !== "all" 
                            ? "No tickets match this filter. Adjust your selection."
                            : "Get started by creating your first support ticket."
                          }
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => {
                  const subject = getSubjectFromDescription(ticket.description);
                  
                  return (
                    <TableRow
                      key={ticket.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:bg-gray-900/70 transition-all duration-200 cursor-pointer group"
                      onClick={() => handleRowClick(ticket.id)}
                    >
                      <TableCell className="py-5 pl-6">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-xs">
                              #{ticket.id.toString().padStart(3, "0")}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          {ticket.category}
                        </span>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="space-y-1.5">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={subject}>
                            {subject}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed" title={ticket.description}>
                            {ticket.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(ticket.created_at).split(',')[0]}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(ticket.created_at).split(',')[1]?.trim()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 pr-6">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => handleViewClick(e, ticket.id)}
                            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                            aria-label="View ticket details"
                            title="View details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-semibold">{startIndex}</span>–<span className="font-semibold">{endIndex}</span> of{' '}
            <span className="font-semibold">{totalCount.toLocaleString()}</span> tickets
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>  
  );  
}
