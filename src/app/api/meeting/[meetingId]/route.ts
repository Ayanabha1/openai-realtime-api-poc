import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PATCH method to update a meeting
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const body = await req.json();
    const { meetingId } = params;
    if (!meetingId) {
      return NextResponse.json(
        { error: "meetingId is required" },
        { status: 400 }
      );
    }

    const { title, date, time, participants, projectId } = body;

    // Validate required fields
    if (!title && !date && !time && !participants && !projectId) {
      return NextResponse.json(
        {
          error:
            "At least one field (title, date, time, participants, projectId) is required",
        },
        { status: 400 }
      );
    }

    const updatedData: any = {};
    if (title) updatedData.title = title;
    if (date) updatedData.date = date;
    if (time) updatedData.time = time;
    if (participants) updatedData.participants = participants;
    if (projectId) updatedData.projectId = projectId;

    // Update the meeting
    const meeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updatedData,
    });

    console.log("Updated meeting:", meeting);

    return NextResponse.json(meeting, { status: 200 });
  } catch (error: any) {
    console.error("Meeting update error:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const param = await params;
    const { meetingId } = param;
    if (!meetingId) {
      return NextResponse.json(
        { error: "meetingId is required" },
        { status: 400 }
      );
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        project: true,
      },
    });

    return NextResponse.json(meeting, { status: 200 });
  } catch (error: any) {
    console.error("Meeting update error:", error);
    return NextResponse.json(
      { error: "Failed to update meeting" },
      { status: 500 }
    );
  }
}
