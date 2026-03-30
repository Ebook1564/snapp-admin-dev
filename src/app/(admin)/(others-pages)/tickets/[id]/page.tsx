"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Select from "@/components/form/Select";

interface Ticket {
  id: number;
  category: string;
  description: string;
  attachment_filename: string | null;
  attachment_filetype: string | null;
  attachment_filesize: number | null;
  status: "open" | "pending" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: Ticket;
  error?: string;
}

interface UpdateTicketData {
  status?: Ticket["status"];
  description?: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Ticket | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Extract subject and priority from description (matches your table)
  const getSubjectFromDescription = (description: string): string => {
    const subjectMatch = description.match(/Subject:\s*(.+?)(?:\n|$)/i);
    return subjectMatch ? subjectMatch[1].trim() : description.substring(0, 100) + (description.length > 100 ? "..." : "");
  };

  const getPriorityFromDescription = (description: string): "low" | "medium" | "high" | "urgent" => {
    const priorityMatch = description.match(/Priority:\s*(low|medium|high|urgent)/i);
    if (priorityMatch) {
      return priorityMatch[1].toLowerCase() as "low" | "medium" | "high" | "urgent";
    }
    return "medium";
  };

  // Fetch REAL ticket data from database
  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      
      setLoading(true);
      setError("");
      
      try {
        const res = await fetch(`/api/tickets/${ticketId}`, {
          cache: 'no-store'
        });
        
        const apiResponse: ApiResponse = await res.json();
        
        if (!res.ok || !apiResponse.success) {
          throw new Error(apiResponse.error || "Ticket not found");
        }
        
        const dbTicket = apiResponse.data;
        setTicket(dbTicket);
        setFormData(dbTicket);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load ticket";
        setError(errorMessage);
        console.error("Fetch ticket error:", err);
      } finally {

        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  // Function to update ticket in database - FIXED VERSION
  const updateTicketInDatabase = async (updateData: UpdateTicketData) => {
    if (!ticketId) {
      console.error("No ticketId provided");
      setSaveMessage({ 
        type: 'error', 
        text: "No ticket ID provided" 
      });
      return false;
    }
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      console.log("Updating ticket ID:", ticketId, "with data:", updateData);
      
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      // First get the response as text
      const responseText = await response.text();
      console.log("Raw response text:", responseText);
      console.log("Response status:", response.status);

      // Check if response is empty
      if (!responseText || responseText.trim() === '') {
        console.error("Empty response from server");
        setSaveMessage({ 
          type: 'error', 
          text: "Server returned empty response" 
        });
        return false;
      }

      let apiResponse: ApiResponse;
      try {
        // Try to parse as JSON
        apiResponse = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        console.error("Raw response:", responseText);
        
        // If it's HTML, it might be a 404 page
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          setSaveMessage({ 
            type: 'error', 
            text: `API endpoint not found (404). Please check if /api/tickets/[id] route exists with PUT method.` 
          });
        } else {
          setSaveMessage({ 
            type: 'error', 
            text: "Server returned invalid JSON format" 
          });
        }
        return false;
      }

      if (!response.ok) {
        console.error("HTTP error:", response.status, apiResponse.error);
        setSaveMessage({ 
          type: 'error', 
          text: apiResponse.error || `HTTP error ${response.status}` 
        });
        return false;
      }

      if (!apiResponse.success) {
        console.error("API returned error:", apiResponse.error);
        setSaveMessage({ 
          type: 'error', 
          text: apiResponse.error || "Update failed" 
        });
        return false;
      }

      console.log("Update successful!");
      return true;
      
    } catch (err: unknown) {
      console.error("Network or fetch error:", err);
      
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
      const errorName = err instanceof Error ? err.name : "";

      // Check for network errors
      if (errorName === 'TypeError') {
        setSaveMessage({ 
          type: 'error', 
          text: "Network error. Please check if server is running." 
        });
      } else {
        setSaveMessage({ 
          type: 'error', 
          text: errorMsg
        });
      }
      return false;
    } finally {

      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!formData) return;
    
    const status = newStatus as Ticket["status"];
    console.log("Changing status to:", status);
    
    // Update local state immediately for better UX
    const updatedTicket = {
      ...formData,
      status: status,
      updated_at: new Date().toISOString(),
    };
    
    setFormData(updatedTicket);
    
    try {
      // Update in database
      const success = await updateTicketInDatabase({ status: status });
      
      if (success) {
        // Update the main ticket state
        setTicket(updatedTicket);
        setSaveMessage({ 
          type: 'success', 
          text: `Status updated to ${status}` 
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
        
        console.log("Status updated successfully to:", status);
      } else {
        // If update failed, revert to original ticket state
        if (ticket) {
          setFormData(ticket);
        }
      }
    } catch (error) {
      console.error("Error in handleStatusChange:", error);
      // Revert on error
      if (ticket) {
        setFormData(ticket);
      }
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!formData) return;
    
    // Since priority is stored in description, we need to update the description
    const currentDescription = formData.description;
    const priorityRegex = /Priority:\s*(low|medium|high|urgent)/i;
    
    let updatedDescription = currentDescription;
    
    if (priorityRegex.test(currentDescription)) {
      // Replace existing priority in description
      updatedDescription = currentDescription.replace(
        priorityRegex,
        `Priority: ${newPriority}`
      );
    } else {
      // Add priority to description if it doesn't exist
      updatedDescription = `${currentDescription}\nPriority: ${newPriority}`;
    }
    
    const updatedTicket = {
      ...formData,
      description: updatedDescription,
      updated_at: new Date().toISOString(),
    };
    
    setFormData(updatedTicket);
    
    try {
      // Update in database
      const success = await updateTicketInDatabase({ 
        description: updatedDescription 
      });
      
      if (success) {
        setTicket(updatedTicket);
        setSaveMessage({ 
          type: 'success', 
          text: `Priority updated to ${newPriority}` 
        });
        
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
        
        console.log("Priority updated successfully to:", newPriority);
      } else {
        if (ticket) {
          setFormData(ticket);
        }
      }
    } catch (error) {
      console.error("Error in handlePriorityChange:", error);
      if (ticket) {
        setFormData(ticket);
      }
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // Update ticket in database
      const updateData: UpdateTicketData = {};
      
      // Only send status if it changed
      if (ticket && formData.status !== ticket.status) {
        updateData.status = formData.status;
      }
      
      // Only send description if it changed
      if (ticket && formData.description !== ticket.description) {
        updateData.description = formData.description;
      }
      
      // If nothing changed, just exit edit mode
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }
      
      const success = await updateTicketInDatabase(updateData);
      
      if (success) {
        setTicket(formData);
        setIsEditing(false);
        setSaveMessage({ 
          type: 'success', 
          text: "Ticket updated successfully" 
        });
        
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
        
        console.log("Saved ticket:", formData);
      }
    } catch (err) {
      console.error("Save error:", err);
      setSaveMessage({ 
        type: 'error', 
        text: "Failed to save changes" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (ticket) {
      setFormData(ticket);
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  const getStatusBadge = (status: Ticket["status"]) => {
    const statusConfig: Record<Ticket["status"], { color: "error" | "warning" | "success" | "light"; label: string }> = {
      open: { color: "error", label: "Open" },
      pending: { color: "warning", label: "Pending" },
      resolved: { color: "success", label: "Resolved" },
      closed: { color: "success", label: "Closed" },
    };
    const config = statusConfig[status] || { color: "light" as const, label: status };
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: "low" | "medium" | "high" | "urgent") => {
    const priorityConfig: Record<"low" | "medium" | "high" | "urgent", { color: "error" | "warning" | "info" | "light"; label: string }> = {
      urgent: { color: "error", label: "Urgent" },
      high: { color: "warning", label: "High" },
      medium: { color: "info", label: "Medium" },
      low: { color: "light", label: "Low" },
    };
    const config = priorityConfig[priority] || { color: "info" as const, label: "Medium" };
    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const statusOptions = [
    { value: "open", label: "Open" },
    { value: "pending", label: "Pending" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ];

  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || "Ticket not found"}</p>
          <Button onClick={() => router.back()} className="inline-flex items-center gap-2">
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const subject = getSubjectFromDescription(ticket.description);
  const priority = getPriorityFromDescription(ticket.description);

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className={`rounded-lg p-4 border ${
          saveMessage.type === 'success' 
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === 'success' ? '✅' : '❌'}
            <span className={
              saveMessage.type === 'success' 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }>
              {saveMessage.text}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-white/[0.03] transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Ticket Details
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ticket ID: #{ticket.id.toString().padStart(4, "0")}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2"
          >
            ✏️ Edit Ticket
          </Button>
        )}
      </div>

      {/* Subject Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
              {subject}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(priority)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {ticket.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Information Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content - Issue Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-red-50 rounded-lg dark:bg-red-500/15">
                <span className="text-red-600 text-lg dark:text-red-400">⚠️</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Issue Description
              </h2>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5 border border-gray-200 dark:border-gray-700 min-h-[200px]">
              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                {ticket.description}
              </pre>
            </div>
          </div>
        </div>

        {/* Sidebar - Ticket Information */}
        <div className="space-y-6">
          {/* Status and Priority Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
              Ticket Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Status
                </label>
                {isEditing ? (
                  <Select
                    options={statusOptions}
                    value={formData?.status || ticket.status}
                    onChange={handleStatusChange}
                    className="text-sm"
                  />
                ) : (
                  <div className="mt-2">{getStatusBadge(ticket.status)}</div>
                )}
                {isSaving && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Saving...
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Priority
                </label>
                {isEditing ? (
                  <Select
                    options={priorityOptions}
                    value={getPriorityFromDescription(formData?.description || ticket.description)}
                    onChange={handlePriorityChange}
                    className="text-sm"
                  />
                ) : (
                  <div className="mt-2">{getPriorityBadge(getPriorityFromDescription(ticket.description))}</div>
                )}
                {isSaving && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Saving...
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Category
                </label>
                <div className="mt-2 px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200">
                  {ticket.category}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg dark:bg-gray-800">
                <span className="text-gray-600 text-lg dark:text-gray-400">📅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Timeline
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Created At</label>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {formatDate(ticket.created_at)}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Last Updated</label>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {formatDate(ticket.updated_at)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="w-full sm:w-auto"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}