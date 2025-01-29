"use client";
import { ApiKeyDialog } from "@/components/meetbot/ApiKeyDialog";
import Chatbot2 from "@/components/meetbot/Chatbot2";
import { Navbar } from "@/components/meetbot/Navbar";
import NotesDisplay from "@/components/notetaker/notes-display";
import { useAuth } from "@clerk/nextjs";
import { set } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MeetingPage() {
  const params = useParams<{ noteId: string }>();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="h-full">
      {/* <ApiKeyDialog isOpen={isApiKeyDialogOpen} onSubmit={handleApiKeySubmit} /> */}
      <NotesDisplay noteId={params.noteId} />
    </main>
  );
}
