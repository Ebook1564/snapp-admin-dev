"use client";

import React, { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import { EyeIcon, PencilIcon, TrashBinIcon, PlusIcon, ChevronDownIcon } from "@/icons";
import { Modal } from "../ui/modal";
import { useModal } from "@/hooks/useModal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";
import Pagination from "./Pagination";

const ITEMS_PER_PAGE = 10;

interface User {
    id: number;
    useremail: string;
    today_revenue: number;
    yesterday_revenue: number;
    last_7d_revenue: number;
    this_month_revenue: number;
    last_28d_revenue: number;
    created_at: string;
}

const initialFormData: Partial<User> = {
    useremail: "",
    today_revenue: 0,
    yesterday_revenue: 0,
    last_7d_revenue: 0,
    this_month_revenue: 0,
    last_28d_revenue: 0,
};

export default function UserDataTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Modals
    const addModal = useModal();
    const deleteModal = useModal();
    const viewModal = useModal();

    // State
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>(initialFormData);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/users");
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            } else {
                setError(data.error || "Failed to fetch users");
            }
        } catch (err) {
            setError("An error occurred while fetching users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const searchStr = searchTerm.toLowerCase();
        return (
            user.useremail.toLowerCase().includes(searchStr)
        );
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleRowClick = (user: User) => {
        setViewUser(user);
        viewModal.openModal();
    };

    const handleViewClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setViewUser(user);
        viewModal.openModal();
    };

    const handleEditClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setSelectedUser(user);
        setFormData(user);
        setIsEditMode(true);
        addModal.openModal();
    };

    const handleDeleteClick = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setSelectedUser(user);
        deleteModal.openModal();
    };

    const handleAddClick = () => {
        setSelectedUser(null);
        setFormData(initialFormData);
        setIsEditMode(false);
        addModal.openModal();
    };

    const handleInputChange = (field: keyof User, value: any) => {
        // Parse revenue fields to numbers
        if (["today_revenue", "yesterday_revenue", "last_7d_revenue", "this_month_revenue", "last_28d_revenue"].includes(field)) {
            const numValue = value === "" ? 0 : parseFloat(value);
            setFormData((prev) => ({ ...prev, [field]: numValue }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        try {
            const url = isEditMode ? `/api/users/${selectedUser?.id}` : "/api/users";
            const method = isEditMode ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                await fetchUsers(); // Refresh table
                addModal.closeModal();
                alert(isEditMode ? "User record updated successfully!" : "User record added successfully!");
            } else {
                alert(data.error || "Failed to save");
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDelete = async () => {
        if (selectedUser) {
            try {
                const response = await fetch(`/api/users/${selectedUser.id}`, {
                    method: "DELETE",
                });

                const data = await response.json();
                if (data.success) {
                    await fetchUsers();
                    deleteModal.closeModal();
                    setSelectedUser(null);
                    alert("Record deleted successfully!");
                } else {
                    alert(data.error || "Failed to delete record");
                }
            } catch (err: any) {
                alert(`An error occurred while deleting record: ${err.message}`);
            }
        }
    };

    const formatCurrency = (value: number | string) => {
        const num = typeof value === "string" ? parseFloat(value) : value;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 3,
        }).format(num || 0);
    };

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 shadow-sm">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white/90">
                            Revenue Management
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Tracking user performance metrics from userdatatable
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Records</span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{users.length}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Current Filter</span>
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{filteredUsers.length}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all font-sans"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <Button
                            onClick={handleAddClick}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition-all active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Add Entry
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="max-w-full overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-gray-50 dark:bg-gray-800/50">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    User Email
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    Today
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    Yesterday
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    Last 7D
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    Monthly
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3.5 font-semibold text-gray-600 text-start text-xs uppercase tracking-wider dark:text-gray-400">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedUsers.map((user, index) => (
                                <TableRow
                                    key={user.id}
                                    className="cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all duration-200"
                                    onClick={() => handleRowClick(user)}
                                >
                                    <TableCell className="px-5 py-5 text-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                                                {user.useremail.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900 text-sm dark:text-white/95">
                                                {user.useremail}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-5 py-5 text-start text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(user.today_revenue)}
                                    </TableCell>
                                    <TableCell className="px-5 py-5 text-start text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(user.yesterday_revenue)}
                                    </TableCell>
                                    <TableCell className="px-5 py-5 text-start text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(user.last_7d_revenue)}
                                    </TableCell>
                                    <TableCell className="px-5 py-5 text-start text-sm text-gray-600 dark:text-gray-400">
                                        {formatCurrency(user.this_month_revenue)}
                                    </TableCell>
                                    <TableCell className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleViewClick(e, user)}
                                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                                                title="View details"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleEditClick(e, user)}
                                                className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                                                title="Edit record"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(e, user)}
                                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                                                title="Delete record"
                                            >
                                                <TrashBinIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-700 dark:text-gray-200">{startIndex + 1}</span> to <span className="font-semibold text-gray-700 dark:text-gray-200">{Math.min(endIndex, filteredUsers.length)}</span> of <span className="font-semibold text-gray-700 dark:text-gray-200">{filteredUsers.length}</span> entries
                        </p>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {filteredUsers.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No records found matching your search.</p>
                    </div>
                )}
            </div>

            {/* View User Modal */}
            <Modal
                isOpen={viewModal.isOpen}
                onClose={viewModal.closeModal}
                className="max-w-2xl p-6"
            >
                {viewUser && (
                    <div className="bg-white dark:bg-gray-900">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Revenue Details</h2>
                            <button onClick={viewModal.closeModal} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label>User Email</Label>
                                <p className="mt-1 text-lg font-medium text-gray-800 dark:text-gray-200">{viewUser.useremail}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                <Label className="text-emerald-700 dark:text-emerald-400">Today's Revenue</Label>
                                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(viewUser.today_revenue)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <Label>Yesterday's Revenue</Label>
                                <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{formatCurrency(viewUser.yesterday_revenue)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                                <Label className="text-blue-700 dark:text-blue-400">Last 7 Days</Label>
                                <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(viewUser.last_7d_revenue)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20">
                                <Label className="text-purple-700 dark:text-purple-400">Monthly Revenue</Label>
                                <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(viewUser.this_month_revenue)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                                <Label className="text-indigo-700 dark:text-indigo-400">Last 28 Days</Label>
                                <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(viewUser.last_28d_revenue)}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                <Label>Created At</Label>
                                <p className="mt-1 text-gray-800 dark:text-gray-200">
                                    {new Date(viewUser.created_at).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
                            <Button variant="outline" onClick={viewModal.closeModal}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                viewModal.closeModal();
                                handleEditClick({} as any, viewUser);
                            }}>
                                Edit Data
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Add/Edit User Modal */}
            <Modal
                isOpen={addModal.isOpen}
                onClose={addModal.closeModal}
                className="max-w-2xl p-6 lg:p-8"
            >
                <h4 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
                    {isEditMode ? "Edit Revenue Entry" : "Add Revenue Entry"}
                </h4>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                    }}
                    className="space-y-5"
                >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="useremail">User Email *</Label>
                            <Input
                                type="email"
                                value={formData.useremail || ""}
                                onChange={(e) => handleInputChange("useremail", e.target.value)}
                                placeholder="Enter user's email"
                                className="mt-2"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="today_revenue">Today's Revenue</Label>
                            <Input
                                type="number"
                                step={0.001}
                                value={formData.today_revenue || 0}
                                onChange={(e) => handleInputChange("today_revenue", e.target.value)}
                                placeholder="0.000"
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="yesterday_revenue">Yesterday's Revenue</Label>
                            <Input
                                type="number"
                                step={0.001}
                                value={formData.yesterday_revenue || 0}
                                onChange={(e) => handleInputChange("yesterday_revenue", e.target.value)}
                                placeholder="0.000"
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="last_7d_revenue">Last 7 Days Revenue</Label>
                            <Input
                                type="number"
                                step={0.001}
                                value={formData.last_7d_revenue || 0}
                                onChange={(e) => handleInputChange("last_7d_revenue", e.target.value)}
                                placeholder="0.000"
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="this_month_revenue">This Month Revenue</Label>
                            <Input
                                type="number"
                                step={0.001}
                                value={formData.this_month_revenue || 0}
                                onChange={(e) => handleInputChange("this_month_revenue", e.target.value)}
                                placeholder="0.000"
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <Label htmlFor="last_28d_revenue">Last 28 Days Revenue</Label>
                            <Input
                                type="number"
                                step={0.001}
                                value={formData.last_28d_revenue || 0}
                                onChange={(e) => handleInputChange("last_28d_revenue", e.target.value)}
                                placeholder="0.000"
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button variant="outline" onClick={addModal.closeModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEditMode ? "Update Entry" : "Add Entry"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={deleteModal.closeModal}
                className="max-w-md p-6"
            >
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/15 mb-4">
                        <TrashBinIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                        Delete Revenue Entry
                    </h4>
                    <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete entry for <strong>{selectedUser?.useremail}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" onClick={deleteModal.closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-red-600">
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
