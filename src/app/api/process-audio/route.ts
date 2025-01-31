// pages/api/note-taker/notes/route.ts
import { NextResponse } from "next/server";
import {
  fetchAudioFile,
  transcribeAudio,
  processTranscription,
} from "@/lib/process-audio";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { url, noteId } = await req.json();

    // Fetch audio file as blob
    const audioBlob = await fetchAudioFile(url);

    // Get transcription
    const transcription = await transcribeAudio(audioBlob);

    // Process transcription
    const { summaryNotes, suggestions } = await processTranscription(transcription);

    // Update database
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        transcription,
        key_points: summaryNotes,
        suggestions,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Error processing audio:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
