import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const param = await params;
    const { noteId } = param;
    if (!noteId) {
      return NextResponse.json(
        { error: "noteId is required" },
        { status: 400 }
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        Topic: true,
      },
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error: any) {
    console.error("Note fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const param = await params;
    const { noteId } = param;
    if (!noteId) {
      return NextResponse.json(
        { error: "noteId is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const note = await prisma.note.update({
      where: { id: noteId },
      data: body,
    });

    return NextResponse.json(note, { status: 200 });
  } catch (error: any) {
    console.error("Note update error:", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}
