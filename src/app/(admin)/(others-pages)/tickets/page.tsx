"use client";

import React from "react";
import TicketMetrics from "@/components/tickets/TicketMetrics";
import TicketsTable from "@/components/tickets/TicketsTable";

export default function TicketsPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Ticket Metrics Cards */}
      <div className="col-span-12">
        <TicketMetrics />
      </div>

      {/* Tickets Table */}
      <div className="col-span-12">
        <TicketsTable />
      </div>
    </div>
  );
}

