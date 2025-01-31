"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { Loader } from "@/components/loader";
import CompactRecorder from "@/components/notetaker/compactRecorder";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Edit, Loader2, MoreVertical, MoveRight, Plus, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useUser } from "@clerk/nextjs";

type Note = {
    id: string;
    title: string;
    date: string;
    transcription: string;
    audio_url: string;
    audio_duration: number;
    topicId: string;
};

type Topic = {
    id: string;
    name: string;
    ownerId: string;
};

export default function TopicPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [topics, setTopics] = useState<Topic[]>([]);

    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [noteToRename, setNoteToRename] = useState<Note | null>(null);
    const [noteToMove, setNoteToMove] = useState<Note | null>(null);
    const [newNoteName, setNewNoteName] = useState("");
    const [newNoteTopicId, setNewNoteTopicId] = useState("");
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [topic, setTopic] = useState<Topic | null>(null);

    const router = useRouter();
    const params = useParams<{ topicId: string }>();
    const user = useUser();

    const getNotes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/note?topicId=${params.topicId}`);
            const data = await response.json();
            setNotes(data?.notes);
        } catch (error) {
            console.error("Error fetching notes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const getTopicDetails = async () => {
        try {
            console.log("Getting topic details", params.topicId);
            const response = await fetch(`/api/topic/${params.topicId}`);
            const data = await response.json();
            setTopic(data.topic);
            setNotes(data.topic.notes);
        } catch (error) {
            console.error("Error fetching topic details:", error);
        }
    };

    const getTopics = async () => {
        if (!user.user?.id) return;
        try {
            const response = await fetch(`/api/topic?ownerId=${user.user.id}`);
            const data = await response.json();
            setTopics(data);
        } catch (error) {
            console.error("Error fetching topics:", error);
        }
    };

    useEffect(() => {
        if (user.user?.id) {
            getTopics();
        }
    }, [user.user]);

    useEffect(() => {
        if (params.topicId) {
            getNotes();
            getTopicDetails();
        }
    }, [params.topicId]);

    const deleteNote = async (id: string) => {
        setButtonLoading(true);
        try {
            const response = await fetch(`/api/note/${id}`, {
                method: "DELETE",
            });
            if (response.ok) {
                setNotes(notes.filter(note => note.id !== id));
                setNoteToDelete(null);
                setDeleteConfirmation("");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        } finally {
            setButtonLoading(false);
        }
    };

    const renameNote = async () => {
        if (!noteToRename || !newNoteName.trim()) return;
        setButtonLoading(true);
        try {
            const response = await fetch(`/api/note/${noteToRename.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newNoteName.trim() }),
            });
            if (response.ok) {
                setNotes(notes.map(note =>
                    note.id === noteToRename.id
                        ? { ...note, title: newNoteName.trim() }
                        : note
                ));
                setNoteToRename(null);
                setNewNoteName("");
            }
        } catch (error) {
            console.error("Error renaming note:", error);
        } finally {
            setButtonLoading(false);
        }
    };

    const moveNote = async () => {
        if (!noteToMove || !newNoteTopicId) return;
        setButtonLoading(true);
        try {
            const response = await fetch(`/api/note/${noteToMove.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topicId: newNoteTopicId }),
            });
            if (response.ok) {
                setNotes(notes.filter(note => note.id !== noteToMove.id));
                setNoteToMove(null);
                setNewNoteTopicId("");
            }
        } catch (error) {
            console.error("Error moving note:", error);
        } finally {
            setButtonLoading(false);
        }
    };

    const getDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateString = (str: string, num: number) => {
        if (!str) return "";
        if (str.length <= num) return str;
        return str.slice(0, num) + "...";
    };

    return (
        <div className="flex flex-col h-screen relative overflow-hidden">
            {isLoading && <Loader fullScreen={true} />}
            <div className="flex-1 flex flex-col bg-background h-full">
                <header className="bg-card p-4 border-b border-border flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-primary">
                        {topic?.name} - Notes
                    </h1>

                </header>

                <main className="flex-1 p-4 space-y-4 h-full">
                    <div className="flex-1 h-full">
                        <div className="flex flex-col gap-4 h-full overflow-y-scroll pb-32">
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

                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
            <div className="absolute bottom-0 left-0 right-0">
                <CompactRecorder topicId={params.topicId} />
            </div>

            {/* Note Dialogs */}
            <Dialog open={!!noteToRename} onOpenChange={() => setNoteToRename(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Note</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the note.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newNoteName}
                        onChange={(e) => setNewNoteName(e.target.value)}
                        placeholder="New note name"
                    />
                    <DialogFooter>
                        <Button
                            onClick={renameNote}
                            disabled={newNoteName === noteToRename?.title || buttonLoading}
                        >
                            {buttonLoading ? <Loader2 className="animate-spin" /> : "Rename"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!noteToMove} onOpenChange={() => setNoteToMove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Move Note</DialogTitle>
                        <DialogDescription>
                            Select a topic to move this note to.
                        </DialogDescription>
                    </DialogHeader>
                    <Select value={newNoteTopicId} onValueChange={setNewNoteTopicId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {topics.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id}>
                                    {topic.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DialogFooter>
                        <Button
                            onClick={moveNote}
                            disabled={!newNoteTopicId || buttonLoading}
                        >
                            {buttonLoading ? <Loader2 className="animate-spin" /> : "Move"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={!!noteToDelete}
                onOpenChange={() => setNoteToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the note "{noteToDelete?.title}
                            "? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div>
                        <Input
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Enter note name to confirm deletion"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setNoteToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteNote(noteToDelete?.id || "")}
                            disabled={
                                deleteConfirmation !== noteToDelete?.title || buttonLoading
                            }
                        >
                            {buttonLoading ? <Loader2 className="animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
} 