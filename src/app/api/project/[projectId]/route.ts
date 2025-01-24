import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Optional: UPDATE method to update a project
export async function PATCH(req: Request, { params }: { params: any }) {
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

    // Update the project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: updatedData,
    });

    console.log("Updated project:", project);

    return NextResponse.json(project, { status: 200 });
  } catch (error: any) {
    console.error("Project update error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// Optional: DELETE method to delete a project
export async function DELETE(req: Request, { params }: { params: any }) {
  try {
    const { projectId } = params;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Delete the project
    await prisma.project.delete({
      where: { id: projectId },
    });

    console.log(`Deleted project with id: ${projectId}`);

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("Project delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
