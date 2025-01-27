import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Optional: UPDATE method to update a topic
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const body = await req.json();
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const { name, ownerId, isFavorite } = body;

    // Validate required fields
    if ((!name && isFavorite === undefined) || isFavorite === null) {
      return NextResponse.json(
        { error: "name and isFavorite are required" },
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
      where: { id: projectId },
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
    const { projectId } = params;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Delete the topic
    await prisma.topic.delete({
      where: { id: projectId },
    });

    console.log(`Deleted topic with id: ${projectId}`);

    return NextResponse.json({ message: "Topic deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Topic delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
