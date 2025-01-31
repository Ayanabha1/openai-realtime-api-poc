"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { projects } from "@/lib/constants";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Search,
    Plus,
    Settings,
    Folder,
    MoreVertical,
    Edit,
    Trash,
    MoveRight,
    StickyNote,
    Loader2
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Label } from "../ui/label";
import { Loader } from "@/components/loader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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

export default function Sidebar() {
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
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const path = pathName.split("/")[1];
        setSelectedProject(
            projects.find((p) => p.link === `/${path}`) || topics[0]
        );
    }, []);

    const addTopic = async () => {
        if (!user.user?.id || !newTopicName.trim()) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/topic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newTopicName.trim(),
                    ownerId: user.user.id,
                }),
            });
            const data = await response.json();
            setUserTopics([...topics, data]);
            setNewTopicName("");
            setIsAddTopicDialogOpen(false);
        } catch (error) {
            console.error("Error adding topic:", error);
        } finally {
            setIsLoading(false);
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
        if (!user.user?.id) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/topic?ownerId=${user.user.id}`);
            const data = await response.json();
            setUserTopics(data);
        } catch (error) {
            console.error("Error fetching topics:", error);
        } finally {
            setIsLoading(false);
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
        <>
            {isLoading && <Loader fullScreen={true} />}
            <div className="w-64 border-r border-border bg-card flex flex-col">
                <ScrollArea className="flex-grow">
                    <div className="p-4 space-y-2">
                        {/* Topic Selector Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start p-2 hover:bg-accent"
                                >
                                    <Avatar className="h-8 w-8 mr-2">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {selectedProject?.name[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">
                                        {selectedProject?.name}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                {projects.map((project) => (
                                    <DropdownMenuItem
                                        key={project.name}
                                        className="p-2"
                                        onClick={() => {
                                            router.push(`${project.link}`);
                                        }}
                                    >
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {project.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{project.name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Separator className="bg-border" />
                        {/* Search Bar */}
                        <div className="relative flex items-center">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search topics..."
                                className="pl-8 mr-1 bg-white"
                            />
                            <Dialog
                                open={isAddTopicDialogOpen}
                                onOpenChange={setIsAddTopicDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="border shadow px-2">
                                        <Plus className="size-6" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Topic</DialogTitle>
                                        <DialogDescription>
                                            Enter a name for your new topic.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Input
                                        value={newTopicName}
                                        onChange={(e) => setNewTopicName(e.target.value)}
                                        placeholder="Topic name"
                                    />
                                    <DialogFooter>
                                        <Button
                                            onClick={addTopic}
                                            className="w-full"
                                            disabled={!newTopicName || buttonLoading}
                                        >
                                            {buttonLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                "Add Topic"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Accordion
                            type="multiple"
                            className="w-full"
                            defaultValue={["topics"]}
                        >
                            {/* Topics Section */}
                            <AccordionItem value="topics">
                                <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">
                                    Topics
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1">
                                        {topics.map((topic) => (
                                            <div
                                                key={topic.id}
                                                className="flex items-center justify-between group px-1 py-1 rounded-md hover:bg-accent cursor-pointer"
                                                onClick={() => router.push(`/notetaker/topic/${topic.id}`)}
                                            >
                                                <div
                                                    className="flex items-center flex-grow"
                                                    onClick={() => setuserSelectedTopic(topic)}
                                                >
                                                    <Folder
                                                        className={`mr-2 h-4 w-4 ${topic.isFavorite ? "text-yellow-500" : ""
                                                            }`}
                                                    />
                                                    <span className="text-sm text-muted-foreground group-hover:text-primary">
                                                        {topic.name}
                                                    </span>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuItem
                                                            onClick={() => toggleFavorite(topic.id)}
                                                        >
                                                            {topic.isFavorite
                                                                ? "Remove from favorites"
                                                                : "Add to favorites"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setTopicToRename(topic);
                                                                setNewName(topic.name);
                                                            }}
                                                        >
                                                            Rename
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setTopicToDelete(topic)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        ))}
                                        {topics.length === 0 && (
                                            <div className="text-muted-foreground">
                                                No topics found.
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Favorite Topics Section */}
                            <AccordionItem value="favorites">
                                <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">
                                    Favorite Topics
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1">
                                        {topics
                                            .filter((topic) => topic.isFavorite)
                                            .map((topic) => (
                                                <div
                                                    key={topic.id}
                                                    className="flex items-center px-1 py-1 rounded-md hover:bg-accent group"
                                                >
                                                    <Folder className="mr-2 h-4 w-4 text-yellow-500" />
                                                    <span className="text-sm text-muted-foreground group-hover:text-primary">
                                                        {topic.name}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                            {/* Uncategorized Notes */}
                            <AccordionItem value="uncategorized">
                                <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">
                                    Uncategorized Notes
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-1">
                                        {uncategorizedNotes?.map((note) => (
                                            <div
                                                key={note.id}
                                                className="flex items-center px-1 py-1 rounded-md hover:bg-accent group justify-between cursor-pointer w-full"
                                                onClick={() => router.push(`/notetaker/note/${note.id}`)}>
                                                <div className="flex items-center ">
                                                    <StickyNote className="mr-2 h-4 w-4" />
                                                    <span className="text-sm text-muted-foreground group-hover:text-primary">
                                                        {note.title}
                                                    </span>
                                                </div>
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
                                                            Move to Topic
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
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </ScrollArea>

                {/* Settings button at the bottom */}
                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-primary"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Rename Topic Dialog */}
            <Dialog
                open={!!topicToRename}
                onOpenChange={() => setTopicToRename(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Topic</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the topic.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New topic name"
                    />
                    <DialogFooter>
                        <Button
                            onClick={renameTopic}
                            disabled={newName === topicToRename?.name || buttonLoading}
                        >
                            {buttonLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Rename"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Topic Dialog */}
            <AlertDialog
                open={!!topicToDelete}
                onOpenChange={() => setTopicToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            topic "{topicToDelete?.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="confirmation">
                            Type "{topicToDelete?.name}" to confirm:
                        </Label>
                        <Input
                            id="confirmation"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="Type topic name to confirm"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTopicToDelete(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTopic(topicToDelete?.id || "")}
                            disabled={
                                deleteConfirmation !== topicToDelete?.name || buttonLoading
                            }
                        >
                            {buttonLoading ? <Loader2 className="animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
                    <Select value={newNoteTopicId} onValueChange={setnewNoteTopicIdId}>
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

        </>
    );
} 