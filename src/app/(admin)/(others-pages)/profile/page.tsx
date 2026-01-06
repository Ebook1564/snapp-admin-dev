"use client";

import React from "react";
import SettlementMetrics from "@/components/settlements/SettlementMetrics";
import SettlementsTable from "@/components/settlements/SettlementsTable";

export default function SettlementPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Settlement Metrics Cards */}
      <div className="col-span-12">
        <SettlementMetrics />
      </div>

      {/* Settlements Table */}
      <div className="col-span-12">
        <SettlementsTable />
      </div>
    </div>
  );
}
