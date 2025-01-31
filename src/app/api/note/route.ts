// app/api/meetings/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioUrl, audioDuration, ownerId, topicId } = body;

    // Validate required fields
    if (!audioUrl && !audioDuration && !ownerId) {
      return NextResponse.json(
        {
          error: "audioUrl, audioDuration and ownerId are required",
        },
        { status: 400 }
      );
    }

    const notesCount =
      (await prisma.note.count({
        where: {
          ownerId,
        },
      })) || 0 + 1;

    // Create the meeting
    const note = await prisma.note.create({
      data: {
        title: "New Note " + notesCount,
        audio_url: audioUrl,
        audio_duration: audioDuration,
        ownerId: ownerId,
        date: new Date(),
        topicId: topicId || null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error("Meeting creation error:", error.stack);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    const ownerId = searchParams.get("ownerId");

    if (!ownerId) {
      return NextResponse.json(
        { error: "OwnerId is required" },
        { status: 400 }
      );
    }

    if (!topicId) {
      // return uncategorized notes

      const notes = await prisma.note.findMany({
        where: { ownerId, topicId: null },
      });
      return NextResponse.json(
        { notes, message: "Notes fetched successfully" },
        { status: 200 }
      );
    }

    const notes = await prisma.note.findMany({
      where: { topicId, ownerId },
    });

    return NextResponse.json(
      { notes, message: "Notes fetched successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Notes fetch error:", error.stack);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
