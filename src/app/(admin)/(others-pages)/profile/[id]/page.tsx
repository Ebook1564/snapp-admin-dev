"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeftIcon, EyeIcon, PencilIcon, CheckCircleIcon, TimeIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Select from "@/components/form/Select";
import { ChevronDownIcon } from "@/icons";

interface Settlement {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: "pending" | "completed" | "processing";
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  description: string;
  bankAccount?: string;
  notes?: string;
}

// Mock data - Replace with API call
const mockSettlements: Settlement[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    userId: "U12345",
    userName: "John Doe",
    userEmail: "john.doe@example.com",
    amount: 1250.50,
    status: "completed",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T14:20:00Z",
    description: "Monthly settlement payment",
    bankAccount: "****1234",
    notes: "Payment processed successfully",
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    userId: "U12346",
    userName: "Jane Smith",
    userEmail: "jane.smith@example.com",
    amount: 890.25,
    status: "pending",
    paymentMethod: "PayPal",
    createdAt: "2024-01-16T09:15:00Z",
    description: "Weekly settlement payment",
    notes: "Awaiting verification",
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    userId: "U12347",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    amount: 2100.75,
    status: "processing",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-17T11:45:00Z",
    description: "Monthly settlement payment",
    bankAccount: "****5678",
    notes: "Processing payment",
  },
  {
    id: "4",
    transactionId: "TXN-2024-003",
    userId: "U12347",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    amount: 2100.75,
    status: "processing",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-17T11:45:00Z",
    description: "Monthly settlement payment",
    bankAccount: "****5678",
    notes: "Processing payment",
  },
  {
    id: "5",
    transactionId: "TXN-2024-003",
    userId: "U12347",
    userName: "Mike Johnson",
    userEmail: "mike.johnson@example.com",
    amount: 2100.75,
    status: "processing",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-17T11:45:00Z",
    description: "Monthly settlement payment",
    bankAccount: "****5678",
    notes: "Processing payment",
  },
];

export default function SettlementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const settlementId = params?.id as string;
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Settlement | null>(null);

  useEffect(() => {
    // Simulate API call
    const foundSettlement = mockSettlements.find((s) => s.id === settlementId);
    if (foundSettlement) {
      setSettlement(foundSettlement);
      setFormData(foundSettlement);
    } else {
      setError("Settlement not found");
    }
    setLoading(false);
  }, [settlementId]);

  const handleStatusChange = (newStatus: string) => {
    if (formData) {
      setFormData({
        ...formData,
        status: newStatus as Settlement["status"],
        completedAt: newStatus === "completed" ? new Date().toISOString() : formData.completedAt,
      });
      // TODO: Add API call to update status
      console.log(`Status updated to ${newStatus}`);
    }
  };

  const handleSave = async () => {
    if (formData) {
      setSettlement(formData);
      setIsEditing(false);
      // TODO: Add API call to update settlement
      console.log("Saving settlement:", formData);
    }
  };

  const handleCancel = () => {
    if (settlement) {
      setFormData(settlement);
      setIsEditing(false);
    }
  };

  const getStatusBadge = (status: Settlement["status"]) => {
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
      month: "long",
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

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading settlement details...</p>
        </div>
      </div>
    );
  }

  if (error || !settlement) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || "Settlement not found"}</p>
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
      <div className="flex items-center justify-between">
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
              Settlement Details
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Transaction ID: {settlement.transactionId}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4" />
            Edit Settlement
          </Button>
        )}
      </div>

      {/* Settlement Details Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Transaction ID
              </label>
              <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 font-medium">
                {settlement.transactionId}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                User Information
              </label>
              <div className="mt-2 space-y-2">
                <div className="px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                  <div className="font-medium">{settlement.userName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {settlement.userEmail}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    ID: {settlement.userId}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Amount
              </label>
              <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 font-bold text-xl">
                {formatCurrency(settlement.amount)}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payment Method
              </label>
              <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                {settlement.paymentMethod}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Status
              </label>
              {isEditing ? (
                <div className="relative">
                  <Select
                    options={statusOptions}
                    value={formData?.status || settlement.status}
                    onChange={handleStatusChange}
                    className="text-sm"
                  />
                  <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
                    <ChevronDownIcon className="w-4 h-4" />
                  </span>
                </div>
              ) : (
                <div className="mt-2">
                  {getStatusBadge(settlement.status)}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created At
              </label>
              <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                {formatDate(settlement.createdAt)}
              </div>
            </div>

            {settlement.completedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed At
                </label>
                <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                  {formatDate(settlement.completedAt)}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </label>
              <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                {settlement.description}
              </div>
            </div>

            {settlement.bankAccount && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Bank Account
                </label>
                <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                  {settlement.bankAccount}
                </div>
              </div>
            )}

            {settlement.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Notes
                </label>
                <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                  {settlement.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

