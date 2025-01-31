import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Optional: UPDATE method to update a topic
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const body = await req.json();
    const { topicId } = params;

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    const { name, ownerId, isFavorite } = body;

    // Validate required fields
    if ((!name && isFavorite === undefined) || isFavorite === null) {
      return NextResponse.json(
        { error: "name or isFavorite are required" },
        { status: 400 }
      );
    }

    const updatedData: any = {};
    if (name) updatedData.name = name;
    if (ownerId) updatedData.ownerId = ownerId;
    if (isFavorite !== undefined || isFavorite !== null)
      updatedData.isFavorite = isFavorite;

    // Update the topic
    const topic = await prisma.topic.update({
      where: { id: topicId },
      data: updatedData,
    });

    console.log("Updated topic:", topic);

    return NextResponse.json(topic, { status: 200 });
  } catch (error: any) {
    console.error("Topic update error:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

// Optional: DELETE method to delete a topic
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const { topicId } = params;

    // Validate required fields
    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // Delete the topic
    await prisma.topic.delete({
      where: { id: topicId },
    });

    console.log(`Deleted topic with id: ${topicId}`);

    return NextResponse.json({ message: "Topic deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Topic delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}

// GET method to retrieve a single topic
export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const { topicId } = params;

    // Validate required fields
    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // Get the topic
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        notes: true,
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    console.log("Retrieved topic:", topic);

    return NextResponse.json({ topic }, { status: 200 });
  } catch (error: any) {
    console.error("Topic retrieval error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve topic" },
      { status: 500 }
    );
  }
}
