import type { Metadata } from "next";
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import React from "react";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import ActiveUsersCard from "@/components/ecommerce/ActiveUsersCard";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
// import DemographicCard from "@/components/ecommerce/DemographicCard";

export const metadata: Metadata = {
  title:
    "Next.js E-commerce Dashboard | TailAdmin - Next.js Dashboard Template",
  description: "This is Next.js Home for TailAdmin Dashboard Template",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Top Row - 3 Cards Full Width */}
      <div className="col-span-12">
        <EcommerceMetrics />
      </div>

      {/* Second Row - Monthly Sales Chart (Expanded) and Active Users Card (Matching Top Cards) */}
      <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8">
          <MonthlySalesChart />
        </div>
        <div className="lg:col-span-4">
          <ActiveUsersCard />
        </div>
      </div>

      {/* <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div> */}

      <div className="col-span-12">
        {/* <StatisticsChart /> */}
      </div>

      {/* <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div> */}

      <div className="col-span-12 ">
        <RecentOrders />
      </div>
    </div>
  );
}
