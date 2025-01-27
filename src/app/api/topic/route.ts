// app/api/projects/route.ts
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerId } = body;

    console.log(name, ownerId);
    // Validate required fields
    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Name or ownerId are required" },
        { status: 400 }
      );
    }

    // Create the topic
    const topic = await prisma.topic.create({
      data: {
        name,
        ownerId,
      },
    });

    console.log("Created topic:", topic);

    return NextResponse.json(topic, { status: 201 });
  } catch (error: any) {
    console.error("Topic creation error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}

// Optional: GET method to fetch projects
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerId = searchParams.get("ownerId");

    const where = ownerId ? { ownerId } : {};

    const projects = await prisma.topic.findMany({
      where,
      include: {
        notes: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Topic fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
