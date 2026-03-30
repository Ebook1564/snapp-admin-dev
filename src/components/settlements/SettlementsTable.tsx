"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Select from "../form/Select";
import { DownloadIcon, ChevronDownIcon } from "@/icons";

import Pagination from "../tables/Pagination";
import Badge from "../ui/badge/Badge";

interface Settlement {
  id: number;
  useremail: string;
  this_month_revenue: number;
  settlement_status: "pending" | "completed" | "processing";
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function SettlementsTable() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);


  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "completed" | "processing">("all");

  const fetchSettlements = async () => {
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (json.success) {
        setSettlements(json.data);
      }
    } catch {
      console.error("Failed to load settlements");
    }
  };



  useEffect(() => {
    fetchSettlements();
  }, []);

  const filteredSettlements = settlements.filter((s) => {
    if (selectedTab !== "all" && s.settlement_status !== selectedTab) return false;
    if (!searchQuery) return true;
    return s.useremail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredSettlements.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSettlements = filteredSettlements.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, searchQuery]);

  const getStatusBadge = (status: Settlement["settlement_status"]) => {
    switch (status) {
      case "completed":
        return <Badge color="success">Completed</Badge>;
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      case "processing":
        return <Badge color="info">Processing</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getTabClass = (tab: typeof selectedTab) =>
    selectedTab === tab
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settlement_status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        setSettlements((prev) =>
          prev.map((s) => (s.id === id ? { ...s, settlement_status: newStatus as Settlement["settlement_status"] } : s))
        );

      } else {
        alert("Failed to update status");
      }
    } catch {
      alert("Error updating status");
    }
  };




  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Settlement Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage all settlement transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 transition-colors">
            <DownloadIcon className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${getTabClass("all")}`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedTab("pending")}
            className={`px-4 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${getTabClass("pending")}`}
          >
            Pending
          </button>
          <button
            onClick={() => setSelectedTab("completed")}
            className={`px-4 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${getTabClass("completed")}`}
          >
            Completed
          </button>
          <button
            onClick={() => setSelectedTab("processing")}
            className={`px-4 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${getTabClass("processing")}`}
          >
            Processing
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:border-gray-700 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Sl.No
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User Email
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Revenue (This Month)
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status Dropdown
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Current Badge
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created At
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedSettlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "No settlements found matching your search."
                      : "No settlements found."}
                  </p>

                </TableCell>
              </TableRow>
            ) : (
              paginatedSettlements.map((s, index) => (
                <TableRow
                  key={s.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <TableCell className="py-3 text-gray-500 font-mono text-xs">
                    {(startIndex + index + 1).toString().padStart(2, "0")}
                  </TableCell>
                  <TableCell className="py-3 font-medium text-gray-800 dark:text-white/90">
                    {s.useremail}
                  </TableCell>
                  <TableCell className="py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(s.this_month_revenue)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="w-40 relative group">
                      <Select
                        options={statusOptions}
                        value={s.settlement_status}
                        onChange={(val) => handleStatusChange(s.id, val)}
                        className="text-sm border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDownIcon className="w-4 h-4" />
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {getStatusBadge(s.settlement_status)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-xs">
                    {formatDate(s.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Show current page info */}
      {filteredSettlements.length > 0 && (
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredSettlements.length)} of{" "}
            {filteredSettlements.length} settlements
          </p>
        </div>
      )}
    </div>
  );
}

