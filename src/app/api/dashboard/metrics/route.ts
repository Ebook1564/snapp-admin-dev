// src/app/api/dashboard/metrics/route.ts
import { NextResponse } from "next/server";
import pool from "../../../../lib/db";

export async function GET() {
  try {
    // Get today's date range (start and end of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get current month date range
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. Today Login - Count users who logged in today
    // For now, we'll count all users as a placeholder until login tracking is implemented
    // You can add a login_date column to usertable later
    let todayLoginCount = 0;
    try {
      // Check if usertable has a login_date or last_login column
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'usertable' 
        AND column_name IN ('login_date', 'last_login', 'lastlogindate')
        LIMIT 1
      `;
      const columnCheck = await pool.query(checkColumnQuery);
      
      if (columnCheck.rows.length > 0) {
        const columnName = columnCheck.rows[0].column_name;
        const todayLoginQuery = `
          SELECT COUNT(DISTINCT id) as count
          FROM usertable
          WHERE DATE(${columnName}) = CURRENT_DATE
        `;
        const todayResult = await pool.query(todayLoginQuery);
        todayLoginCount = parseInt(todayResult.rows[0]?.count || '0', 10);
      } else {
        // If no login tracking column exists, count all users as placeholder
        const allUsersQuery = `SELECT COUNT(*) as count FROM usertable`;
        const allUsersResult = await pool.query(allUsersQuery);
        todayLoginCount = parseInt(allUsersResult.rows[0]?.count || '0', 10);
      }
    } catch (error) {
      console.error("Error fetching today login count:", error);
      // Fallback to counting all users
      const allUsersQuery = `SELECT COUNT(*) as count FROM usertable`;
      const allUsersResult = await pool.query(allUsersQuery);
      todayLoginCount = parseInt(allUsersResult.rows[0]?.count || '0', 10);
    }

    // 2. Total Login - Count all users in usertable
    const totalLoginQuery = `SELECT COUNT(*) as count FROM usertable`;
    const totalLoginResult = await pool.query(totalLoginQuery);
    const totalLoginCount = parseInt(totalLoginResult.rows[0]?.count || '0', 10);

    // 3. Monthly Revenue - Sum of completed settlements for current month
    let monthlyRevenue = 0;
    try {
      // Check if settlements table exists
      const settlementsQuery = `
        SELECT SUM(amount) as total
        FROM settlements
        WHERE status = 'completed'
        AND created_at >= $1
        AND created_at <= $2
      `;
      const revenueResult = await pool.query(settlementsQuery, [
        currentMonthStart.toISOString(),
        currentMonthEnd.toISOString()
      ]);
      monthlyRevenue = parseFloat(revenueResult.rows[0]?.total || '0');
    } catch (error) {
      // If settlements table doesn't exist or has different structure, use placeholder
      console.error("Error fetching monthly revenue:", error);
      monthlyRevenue = 0;
    }

    // 4. Active Users - Same as Today Login
    const activeUsersCount = todayLoginCount;

    return NextResponse.json(
      {
        success: true,
        data: {
          todayLogin: todayLoginCount,
          totalLogin: totalLoginCount,
          monthlyRevenue: monthlyRevenue,
          activeUsers: activeUsersCount,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard metrics";
    console.error("API /api/dashboard/metrics GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }

}


