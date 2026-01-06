"use client";

import React, { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { CopyIcon, LockIcon, TrashBinIcon, EyeIcon, EyeCloseIcon, CheckCircleIcon } from "@/icons";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";

interface SavedPassword {
  id: number;
  email: string;
  password: string;
  created_at: string;
}

export default function PasswordGeneratorPage() {
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [passwordLength, setPasswordLength] = useState<number>(16);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Save password form
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [savedPasswords, setSavedPasswords] = useState<SavedPassword[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const ITEMS_PER_PAGE = 10;

  // Generate password function
  const generatePassword = useCallback(() => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let charset = "";
    if (includeUppercase) charset += uppercase;
    if (includeLowercase) charset += lowercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (charset.length === 0) {
      alert("Please select at least one character type!");
      return;
    }

    let password = "";
    for (let i = 0; i < passwordLength; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setGeneratedPassword(password);
    setPassword(password); // Auto-fill the save form
  }, [passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  // Generate on mount and when options change
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  // Copy to clipboard
  const copyToClipboard = (text: string, id?: number) => {
    navigator.clipboard.writeText(text).then(() => {
      if (id !== undefined) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  // Fetch saved passwords
  const fetchSavedPasswords = async () => {
    try {
      const response = await fetch("/api/passwords");
      if (response.ok) {
        const data = await response.json();
        setSavedPasswords(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching passwords:", error);
    }
  };

  useEffect(() => {
    fetchSavedPasswords();
  }, []);

  // Check if email already exists (client-side check)
  const checkEmailExistsClientSide = (checkEmail: string): boolean => {
    return savedPasswords.some(password => password.email.toLowerCase() === checkEmail.toLowerCase());
  };

  // Save password with email uniqueness check
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMessage("");
    
    if (!email || !password) {
      setErrorMessage("Please enter both email and password!");
      return;
    }

    // Client-side email check (immediate feedback)
    if (checkEmailExistsClientSide(email)) {
      setErrorMessage("This email address already exists! Please use a different email.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/passwords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setSavedPasswords([data.data, ...savedPasswords]);
        setEmail("");
        setPassword("");
        setErrorMessage(""); // Clear success message
        setCurrentPage(1); // Reset to first page after adding new password
        alert("Password saved successfully!");
      } else {
        const error = await response.json();
        const errorMsg = error.error || "Failed to save password";
        
        // Handle specific error messages from backend
        if (errorMsg.toLowerCase().includes('does not exist in the user database')) {
          setErrorMessage("This email does not exist in the user database. Only registered users can have passwords saved.");
        } else if (errorMsg.toLowerCase().includes('already has a saved password')) {
          setErrorMessage("This email already has a saved password. Please use a different email or update the existing one.");
        } else if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('exist')) {
          setErrorMessage("This email address already exists in the database! Please use a different email.");
        } else {
          setErrorMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error("Error saving password:", error);
      setErrorMessage("Failed to save password. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete password
  const handleDeletePassword = async (id: number) => {
    if (!confirm("Are you sure you want to delete this password?")) {
      return;
    }

    try {
      const response = await fetch(`/api/passwords/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedPasswords = savedPasswords.filter((p) => p.id !== id);
        setSavedPasswords(updatedPasswords);
        // If current page becomes empty, go to previous page
        const totalPages = Math.ceil(updatedPasswords.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        alert("Password deleted successfully!");
      } else {
        alert("Failed to delete password");
      }
    } catch (error) {
      console.error("Error deleting password:", error);
      alert("Failed to delete password. Please try again.");
    }
  };

  const toggleShowPassword = (id: number) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(savedPasswords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPasswords = savedPasswords.slice(startIndex, endIndex);

  // Get page range text (e.g., "1-10", "11-20")
  const getPageRangeText = (page: number) => {
    const rangeStart = (page - 1) * ITEMS_PER_PAGE + 1;
    const rangeEnd = Math.min(page * ITEMS_PER_PAGE, savedPasswords.length);
    return `${rangeStart}-${rangeEnd}`;
  };

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Password Generator Section */}
      <div className="col-span-12 lg:col-span-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <LockIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Password Generator
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generate secure passwords instantly
              </p>
            </div>
          </div>

          {/* Generated Password Display */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated Password
            </label>
            <div className="relative flex items-center gap-2">
              <Input
                type="text"
                value={generatedPassword}
                readOnly
                className="pr-12 font-mono text-sm"
                placeholder="Your password will appear here"
              />
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Copy password"
              >
                {copied ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password Options */}
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password Length: {passwordLength}
              </label>
              <input
                type="range"
                min="8"
                max="64"
                value={passwordLength}
                onChange={(e) => setPasswordLength(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Include Characters
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Uppercase Letters (A-Z)
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Lowercase Letters (a-z)
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Numbers (0-9)
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Symbols (!@#$%^&*)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generatePassword}
            className="w-full"
            startIcon={<LockIcon className="h-4 w-4" />}
          >
            Generate New Password
          </Button>
        </div>
      </div>

      {/* Save Password Form */}
      <div className="col-span-12 lg:col-span-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Save Password
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Store your email and password securely
            </p>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage(""); // Clear error when user types
                }}
                placeholder="user@example.com"
                required
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                ⓘ Only emails registered in the user database can be saved
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <Input
                type="text"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(""); // Clear error when user types
                }}
                placeholder="Enter or generate password"
                required
              />
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              startIcon={<CheckCircleIcon className="h-4 w-4" />}
            >
              {loading ? "Saving..." : "Save Password"}
            </Button>
          </form>
        </div>
      </div>

      {/* Saved Passwords Table */}
      <div className="col-span-12">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Saved Passwords
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {savedPasswords.length} password{savedPasswords.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>

          {savedPasswords.length === 0 ? (
            <div className="py-12 text-center">
              <LockIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                No passwords saved yet. Generate and save your first password!
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader className="text-gray-800 dark:text-white/90">Email</TableCell>
                      <TableCell isHeader className="text-gray-800 dark:text-white/90">Password</TableCell>
                      <TableCell isHeader className="text-gray-800 dark:text-white/90">Created At</TableCell>
                      <TableCell isHeader className="text-right text-gray-800 dark:text-white/90">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPasswords.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-3">
                        <div className="font-medium text-gray-800 dark:text-white/90">
                          {item.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">
                            {showPasswords[item.id]
                              ? item.password
                              : "•".repeat(Math.min(item.password.length, 20))}
                          </span>
                          <button
                            onClick={() => toggleShowPassword(item.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title={showPasswords[item.id] ? "Hide password" : "Show password"}
                          >
                            {showPasswords[item.id] ? (
                              <EyeCloseIcon className="h-4 w-4 text-gray-800 dark:text-white/90 " />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-gray-800 dark:text-white/90" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => copyToClipboard(item.password, item.id)}
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                            title="Copy password"
                          >
                            {copiedId === item.id ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <CopyIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePassword(item.id)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete password"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-semibold">{startIndex + 1}</span>–<span className="font-semibold">{Math.min(endIndex, savedPasswords.length)}</span> of{' '}
                    <span className="font-semibold">{savedPasswords.length}</span> password{savedPasswords.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="mr-2.5 flex items-center h-10 justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-sm transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const isActive = currentPage === page;
                        const rangeText = getPageRangeText(page);
                        
                        if (isActive) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className="flex h-10 items-center justify-center rounded-lg bg-blue-500 text-white px-4 text-sm font-medium shadow-sm transition-colors hover:bg-blue-600"
                            >
                              {rangeText}
                            </button>
                          );
                        } else {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className="text-gray-700 dark:text-gray-400 text-sm font-medium hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer px-2"
                            >
                              {rangeText}
                            </button>
                          );
                        }
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-sm text-sm hover:bg-gray-50 h-10 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
