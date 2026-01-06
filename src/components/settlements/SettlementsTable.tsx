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
import { EyeIcon, PencilIcon, DownloadIcon, ChevronDownIcon } from "@/icons";
import Pagination from "../tables/Pagination";
import Badge from "../ui/badge/Badge";
import Select from "../form/Select";

interface Settlement {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "processing";
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  description: string;
}

const ITEMS_PER_PAGE = 10;

// Mock data - Replace with API call
const mockSettlements: Settlement[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    userId: "U12345",
    userName: "John Doe",
    amount: 1250.50,
    status: "completed",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T14:20:00Z",
    description: "Monthly settlement payment",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    userId: "U12346",
    userName: "Jane Smith",
    amount: 890.25,
    status: "pending",
    paymentMethod: "PayPal",
    createdAt: "2024-01-16T09:15:00Z",
    description: "Weekly settlement payment",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    userId: "U12347",
    userName: "Mike Johnson",
    amount: 2100.75,
    status: "processing",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-17T11:45:00Z",
    description: "Monthly settlement payment",
  },
  {
    id: "4",
    transactionId: "TXN-2024-004",
    userId: "U12348",
    userName: "Sarah Williams",
    amount: 450.00,
    status: "completed",
    paymentMethod: "Stripe",
    createdAt: "2024-01-18T08:20:00Z",
    completedAt: "2024-01-18T10:30:00Z",
    description: "Weekly settlement payment",
  },
  {
    id: "5",
    transactionId: "TXN-2024-005",
    userId: "U12349",
    userName: "David Brown",
    amount: 1750.00,
    status: "failed",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-19T13:10:00Z",
    description: "Monthly settlement payment",
  },
];

export default function SettlementsTable() {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "completed" | "history">("all");

  // Filter settlements based on tab and search
  const filteredSettlements = settlements.filter((settlement) => {
    // Tab filter
    if (selectedTab === "pending" && settlement.status !== "pending") return false;
    if (selectedTab === "completed" && settlement.status !== "completed") return false;
    if (selectedTab === "history" && settlement.status !== "failed") return false;

    // Search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      settlement.transactionId.toLowerCase().includes(query) ||
      settlement.userName.toLowerCase().includes(query) ||
      settlement.userId.toLowerCase().includes(query) ||
      settlement.paymentMethod.toLowerCase().includes(query) ||
      settlement.description.toLowerCase().includes(query)
    );
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

  const getStatusBadge = (status: Settlement["status"]) => {
    switch (status) {
      case "completed":
        return <Badge color="success">Completed</Badge>;
      case "pending":
        return <Badge color="warning">Pending</Badge>;
      case "processing":
        return <Badge color="info">Processing</Badge>;
      case "failed":
        return <Badge color="error">Failed</Badge>;
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

  const handleStatusChange = (settlementId: string, newStatus: string) => {
    setSettlements((prev) =>
      prev.map((settlement) =>
        settlement.id === settlementId
          ? {
              ...settlement,
              status: newStatus as Settlement["status"],
              completedAt: newStatus === "completed" ? new Date().toISOString() : settlement.completedAt,
            }
          : settlement
      )
    );
    // TODO: Add API call to update status
    console.log(`Status updated for ${settlementId} to ${newStatus}`);
  };

  const handleRowClick = (settlementId: string) => {
    router.push(`/profile/${settlementId}`);
  };

  const handleViewClick = (e: React.MouseEvent, settlementId: string) => {
    e.stopPropagation();
    router.push(`/profile/${settlementId}`);
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
            onClick={() => setSelectedTab("history")}
            className={`px-4 py-2 font-medium rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white transition-colors ${getTabClass("history")}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by transaction ID, user name, or payment method..."
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
                Transaction ID
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                User
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Amount
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Payment Method
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Created At
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Actions
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
              paginatedSettlements.map((settlement) => (
                <TableRow
                  key={settlement.id}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  onClick={() => handleRowClick(settlement.id)}
                >
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300 font-medium">
                    {settlement.transactionId}
                  </TableCell>
                  <TableCell className="py-3">
                    <div>
                      <div className="text-gray-700 text-theme-sm dark:text-gray-300 font-medium">
                        {settlement.userName}
                      </div>
                      <div className="text-gray-500 text-xs dark:text-gray-400">
                        {settlement.userId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-700 text-theme-sm dark:text-gray-300 font-semibold">
                    {formatCurrency(settlement.amount)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                    {settlement.paymentMethod}
                  </TableCell>
                  <TableCell className="py-3">
                    <div onClick={(e) => e.stopPropagation()} className="w-40">
                      <div className="relative">
                        <Select
                          options={statusOptions}
                          value={settlement.status}
                          onChange={(value) => handleStatusChange(settlement.id, value)}
                          className="text-sm"
                        />
                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                          <ChevronDownIcon className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-400">
                    {formatDate(settlement.createdAt)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => handleViewClick(e, settlement.id)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                        aria-label="View settlement"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </div>
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

