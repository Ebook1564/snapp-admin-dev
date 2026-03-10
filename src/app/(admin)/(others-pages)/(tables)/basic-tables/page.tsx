import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserDataTable from "@/components/tables/UserDataTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "User Management | TailAdmin - Next.js Dashboard Template",
  description:
    "Manage all user entries in the system - Add, Edit, Delete, and View user details",
  // other metadata
};

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="User Management" />
      <div className="space-y-6">
        <UserDataTable />
      </div>
    </div>
  );
}
