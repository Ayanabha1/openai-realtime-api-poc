"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  Settings,
  Plus,
  Building2,
  MoreVertical,
  Star,
  Search,
  FileVideo,
  Calendar,
  Clock,
  Edit,
  Trash,
  MoveRight,
  Loader2,
  Folder,
  StickyNote,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePathname, useRouter } from "next/navigation";
import { projects } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/loader";
import Recorder from "@/components/notetaker/recorder";
import CompactRecorder from "@/components/notetaker/compactRecorder";

type Topic = {
  id: string;
  name: string;
  isFavorite: boolean;
};

type Note = {
  id: string;
  title: string;
  date: string;
  audio_url: string;
  audio_duration: number;
  topicId: string;
  createdAt: Date;
  transcription: string;
  tags: string[];
};

export default function MeetBotPage() {
  const [selectedProject, setSelectedProject] = useState<any>();
  const [userSelectedTopic, setuserSelectedTopic] = useState<any>();
  const [topics, setUserTopics] = useState<Topic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [uncategorizedNotes, setUncategorizedNotes] = useState<Note[]>([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [topicToRename, setTopicToRename] = useState<Topic | null>(null);
  const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [noteToRename, setNoteToRename] = useState<Note | null>(null);
  const [noteToMove, setNoteToMove] = useState<Note | null>(null);
  const [newNoteName, setNewNoteName] = useState("");
  const [newNoteTopicId, setnewNoteTopicIdId] = useState("");
  const [isCreateNoteDialogOpen, setIsCreateNoteDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDate, setNewNoteDate] = useState("");
  const [newNoteTime, setNewNoteTime] = useState("");
  const [newNoteParticipants, setNewNoteParticipants] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const user = useUser();
  const auth = useAuth();
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    const path = pathName.split("/")[1];
    setSelectedProject(
      projects.find((p) => p.link === `/${path}`) || topics[0]
    );
  }, []);

  const addTopic = () => {
    if (!user.user?.id) {
      return;
    }

    if (newTopicName.trim()) {
      const newTopic = {
        name: newTopicName.trim(),
        ownerId: user.user.id,
      };
      setButtonLoading(true);

      fetch("/api/topic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTopic),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setUserTopics([...topics, data]);
          setNewTopicName("");
          setIsAddTopicDialogOpen(false);
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const deleteTopic = (id: string) => {
    if (deleteConfirmation === topicToDelete?.name) {
      setButtonLoading(true);
      fetch(`/api/topic/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.ok) {
            setUserTopics(topics.filter((topic) => topic.id !== id));
            setTopicToDelete(null);
            setDeleteConfirmation("");
          } else {
            console.error("Failed to delete topic");
          }
        })
        .catch((error) => console.error("Error deleting topic:", error))
        .finally(() => setButtonLoading(false));
    }
  };

  const renameTopic = () => {
    if (topicToRename && newName.trim()) {
      setButtonLoading(true);
      fetch(`/api/topic/${topicToRename.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setUserTopics(
            topics.map((topic) =>
              topic.id === data.id ? { ...topic, name: data.name } : topic
            )
          );
          setTopicToRename(null);
          setNewName("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const toggleFavorite = (id: string) => {
    setPageLoading(true);
    fetch(`/api/topic/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isFavorite: !topics.find((p) => p.id === id)?.isFavorite,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setUserTopics(
            topics.map((topic) =>
              topic.id === id
                ? { ...topic, isFavorite: !topic.isFavorite }
                : topic
            )
          );
        }
      })
      .finally(() => setPageLoading(false));
  };

  const getTopics = async () => {
    console.log("Getting topics");
    const userId = user.user?.id;
    if (!userId) {
      return;
    }

    setPageLoading(true);
    try {
      const response = await fetch(`/api/topic?ownerId=${userId}`);
      const data = await response.json();
      setUserTopics(data);
    } catch (error) {
      console.error("Error fetching user topics:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const getUncategorizedNotes = async () => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/note?ownerId=${user.user?.id}`);
      const data = await response.json();
      setUncategorizedNotes(data.notes);
    } catch (error) {
      console.error("Error fetching uncategorized notes:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const getNotes = async (topicId: string) => {
    setPageLoading(true);
    try {
      const response = await fetch(
        `/api/note?topicId=${topicId}&ownerId=${user.user?.id}`
      );
      const data = await response.json();
      setNotes(data?.notes);
    } catch (error) {
      console.error("Error fetching topic notes:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    setButtonLoading(true);
    try {
      const response = await fetch(`/api/note/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      fetch(`/api/note/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.ok) {
            console.log("Note deleted successfully");
          } else {
            console.error("Failed to delete note");
          }
        })
        .catch((err) => console.error("Error deleting note:", err))
        .finally(() => setButtonLoading(false));

      if (response.ok) {
        console.log("Note deleted successfully");
        setNotes(notes.filter((note) => note.id !== id));
        setUncategorizedNotes(
          uncategorizedNotes.filter((note) => note.id !== id)
        );
        setNoteToDelete(null);
      } else {
        console.error("Failed to delete note");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
    } finally {
      setButtonLoading(false);
    }
    setNotes(notes.filter((note) => note.id !== id));
    setNoteToDelete(null);
  };

  const renameNote = () => {
    if (noteToRename && newNoteName.trim()) {
      setButtonLoading(true);
      fetch(`/api/note/${noteToRename.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newNoteName.trim(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setNotes(
            notes.map((note) =>
              note.id === data.id ? { ...note, title: data.title } : note
            )
          );

          setUncategorizedNotes(
            uncategorizedNotes.map((note) =>
              note.id === data.id ? { ...note, title: data.title } : note
            )
          );
          setNoteToRename(null);
          setNewNoteName("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const moveNote = () => {
    if (noteToMove && newNoteTopicId) {
      setButtonLoading(true);
      fetch(`/api/note/${noteToMove.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId: newNoteTopicId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setUncategorizedNotes(
            notes.filter((note) => note.id !== noteToMove.id)
          );
          setNoteToMove(null);
          setnewNoteTopicIdId("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const createNote = () => {
    if (newNoteTitle.trim() && newNoteDate && newNoteTime) {
      setButtonLoading(true);
      fetch("/api/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newNoteTitle.trim(),
          date: newNoteDate,
          time: newNoteTime,
          participants: newNoteParticipants
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p),
          topicId: userSelectedTopic.id,
          ownerId: user.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setNotes([...notes, data]);
          setIsCreateNoteDialogOpen(false);
          setNewNoteTitle("");
          setNewNoteDate("");
          setNewNoteTime("");
          setNewNoteParticipants("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const getDate = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  const getTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const truncateString = (str: string, length: number = 100) => {
    if (str.length <= length) return str;
    return `${str.substring(0, length)}...`;
  };

  useEffect(() => {
    if (user?.user?.id) {
      getTopics();
      getUncategorizedNotes();
    }
  }, [user.user]);

  useEffect(() => {
    if (userSelectedTopic) {
      getNotes(userSelectedTopic?.id);
    }
  }, [userSelectedTopic]);

  useEffect(() => {
    if (auth.isLoaded && !auth.isSignedIn) {
      router.push("/sign-in");
    }
  }, [auth]);

  return (
    <div className="flex h-screen bg-background">
      {pageLoading ? <Loader fullScreen={true} /> : ""}


      {/* Main Content */}
      {userSelectedTopic ? (
        <div className="flex-1 flex flex-col bg-background">
          <header className="bg-card p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-semibold text-primary">
              {userSelectedTopic.name} - Notes
            </h1>
            <Button
              variant={"outline"}
              className="shadow"
              onClick={() => setIsCreateNoteDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          </header>

          <main className="flex-1 p-4 space-y-4">
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4 h-[calc(100%-100px)] overflow-auto">
                {notes?.map((note) => (
                  <div
                    key={note.id}
                    className={`group bg-card rounded-xl border shadow-sm p-5 hover:shadow-md transition-all cursor-pointer h-fit`}
                    onClick={() => {
                      router.push(`/notetaker/note/${note.id}`);
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-semibold text-lg mb-1">
                            {note.title}
                          </h2>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{getDate(new Date(note.date))}</span>
                            <span>•</span>
                            <span>{getTime(new Date(note.date))}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteToRename(note);
                                  setNewNoteName(note.title);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteToMove(note);
                                }}
                              >
                                <MoveRight className="mr-2 h-4 w-4" />
                                Move to Project
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteToDelete(note);
                                }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {truncateString(note.transcription, 200)}
                      </p>

                      {/* <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {note.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Edited {note.lastEdited}
                        </span>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
          <div className="mt-auto mb-14 p-4 relative">
            <CompactRecorder topicId={userSelectedTopic.id} />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <header className="bg-card p-4 border-b border-border">
            <h1 className="text-xl font-semibold text-primary">New Recording</h1>
          </header>
          <div className="flex-1">
            <Recorder />
          </div>
        </div>
      )}




    </div>
  );
}
