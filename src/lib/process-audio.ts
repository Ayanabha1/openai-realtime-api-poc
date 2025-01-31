import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { createReadStream, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

async function fetchAudioFile(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch audio file: ${response.status}`);
  }
  return response.blob();
}

async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert Blob to File
    const file = new File([audioBlob], `${uuidv4()}.wav`, {
      type: "audio/wav",
    });

    const response = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: file,
    });

    return response.text;
  } catch (err) {
    console.error("Transcription failed", err);
    throw err;
  }
}

async function generateSummaryNotes(transcription: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Help me summarize the following transcription. Give me the keypoints in bullet points",
      },
      {
        role: "user",
        content: `Summarize the following transcription:\n${transcription}`,
      },
    ],
    max_tokens: 1000,
  });

  const summaryText = response.choices[0].message.content;
  let summaryNotes = summaryText!.split("\n").filter((s) => s.trim() !== "");
  summaryNotes = summaryNotes.map((s) => {
    if (s[0] === "- ") {
      return s.slice(2);
    }
    return s;
  });
  return summaryNotes;
}

async function generateSuggestions(transcription: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Help me generate a few suggestions based on the following transcription. Give me the suggestions in bullet points",
      },
      {
        role: "user",
        content: `Generate few suggestions based on the following transcript:\n\n${transcription}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.5,
  });
  const suggestionsText = response.choices[0].message.content;

  const suggestions = suggestionsText
    ?.split("\n")
    .filter((s) => s.trim() !== "");
  return suggestions!;
}

async function processTranscription(transcription: string): Promise<{
  summaryNotes: string[];
  suggestions: string[];
}> {
  const summaryNotes = await generateSummaryNotes(transcription);
  const suggestions = await generateSuggestions(transcription);
  return { summaryNotes, suggestions };
}

export {
  fetchAudioFile,
  transcribeAudio,
  processTranscription,
  generateSummaryNotes,
  generateSuggestions,
};
