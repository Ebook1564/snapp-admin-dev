import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "@/components/tables/BasicTableOne";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Games Management | TailAdmin - Next.js Dashboard Template",
  description:
    "Manage all integrated games in the system - Add, Edit, Delete, and View game details",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Games Management" />
      <div className="space-y-6">
        <BasicTableOne />
      </div>
    </div>
  );
}
