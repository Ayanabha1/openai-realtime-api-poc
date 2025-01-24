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

    // Create the project
    const project = await prisma.project.create({
      data: {
        name,
        ownerId,
      },
    });

    console.log("Created project:", project);

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Project creation error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
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

    const projects = await prisma.project.findMany({
      where,
      include: {
        meetings: true,
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Project fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
