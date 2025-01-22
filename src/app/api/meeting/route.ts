// app/api/meetings/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, ownerId, date, time, projectId, participants } = body;

    // Validate required fields
    if (!title || !date || !time || !projectId || !participants || !ownerId) {
      return NextResponse.json(
        {
          error:
            "Title, ownerId, date, time, projectId, or participants are required",
        },
        { status: 400 }
      );
    }

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date,
        time,
        projectId,
        ownerId,
        participants,
      },
    });

    console.log("Created meeting:", meeting);

    return NextResponse.json(meeting, { status: 201 });
  } catch (error: any) {
    console.error("Meeting creation error:", error.stack);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const meetings = await prisma.meeting.findMany({
      where: { projectId },
    });

    return NextResponse.json(meetings);
  } catch (error: any) {
    console.error("Meeting fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
