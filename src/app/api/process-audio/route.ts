// pages/api/note-taker/notes/route.ts
import prisma from "@/lib/prisma";
import {
  fetchAudioFile,
  generateSuggestions,
  generateSummaryNotes,
  transcribeAudio,
} from "@/lib/process-audio";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { url, noteId } = body;

  if (!url) {
    return NextResponse.json(
      { error: "No s3 url was provided" },
      { status: 400 }
    );
  }

  try {
    const audioFile = await fetchAudioFile(url);
    const audioBuffer = await audioFile.arrayBuffer();

    const transcription = await transcribeAudio(audioBuffer);

    const { summaryNotes, suggestions } = await processTranscription(
      transcription
    );

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        transcription,
        key_points: summaryNotes,
        suggestions,
      },
    });

    return NextResponse.json({
      transcription,
      summaryNotes,
      suggestions,
      updatedNote,
      message: "Audio Processed",
    });
  } catch (error: any) {
    console.error("Error processing audio:", error.stack);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}

async function processTranscription(transcription: any) {
  const summaryNotes = await generateSummaryNotes(transcription);
  const suggestions = await generateSuggestions(transcription);
  return { summaryNotes, suggestions };
}
