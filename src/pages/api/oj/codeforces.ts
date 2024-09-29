export const prerender = false;

import { PrismaClient } from "@prisma/client";
import type { APIRoute } from "astro";

// Initialize Prisma Client
const prisma = new PrismaClient();

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Fetch the data from Codeforces API
    const response = await fetch(
      "https://codeforces.com/api/contest.list?gym=false"
    );
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error("Failed to fetch contest data.");
    }

    // Filter contests where phase is "BEFORE"
    const upcomingContests = data.result.filter(
      (contest: any) => contest.phase === "BEFORE"
    );

    // Delete all existing contest data in the database
    await prisma.contest.deleteMany({});

    // Insert all upcoming contests in one go
    if (upcomingContests.length > 0) {
      await prisma.contest.createMany({
        data: upcomingContests,
      });
    }

    // Return the filtered contests
    return new Response(JSON.stringify(upcomingContests), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching contests:", error);
    return new Response(
      JSON.stringify({ message: "Error fetching contests", error }),
      { status: 500 }
    );
  }
};
