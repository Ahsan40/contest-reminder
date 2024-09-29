export const prerender = false;

import type { Contest } from "@/types/contest.interface";
import { PrismaClient } from "@prisma/client";
import type { APIRoute } from "astro";
import dayjs from "dayjs";

// Initialize Prisma Client
const prisma = new PrismaClient();

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const preferences = await prisma.contestPreferences.findMany();
    const pref = preferences[0] || undefined;
    const defaultInterval = 36000;

    let upcomingContests: Contest[] = [];
    let hasIntervalPassed = true;

    // clear preferences cache
    // await prisma.contestPreferences.deleteMany({});

    if (pref) {
      const now = dayjs();
      const interval = pref.contestUpdateInterval || defaultInterval;
      hasIntervalPassed =
        now.diff(pref.lastContestUpdateTime, "second") >= interval;
    } else {
      console.log(" => Preferences not found. Creating default preferences...");
      await prisma.contestPreferences.create({
        data: {
          id: 1,
          contestUpdateInterval: defaultInterval,
          lastContestUpdateTime: new Date(),
        },
      });
    }

    if (hasIntervalPassed) {
      let data;

      // Fetch the data from Codeforces API
      console.log(" => Fetching contests from Codeforces API...");

      const response = await fetch(
        "https://codeforces.com/api/contest.list?gym=false",
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
            Accept: "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(" => Error fetching contests.", errorText); // Log it for debugging
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(response.ok);

      try {
        data = await response.json();
      } catch (error) {
        throw new Error("Failed to fetch contest data. Probably an API error");
      }

      // Filter contests where phase is "BEFORE"
      upcomingContests = data.result.filter(
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

      await prisma.contestPreferences.update({
        where: { id: 1 },
        data: { lastContestUpdateTime: new Date() }, // Update to current time
      });
    } else {
      upcomingContests = await prisma.contest.findMany();
      console.log("Fetched contests from database");
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
