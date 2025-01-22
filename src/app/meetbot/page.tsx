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
import { useUser } from "@clerk/nextjs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/loader";

type Project = {
  id: string;
  name: string;
  isFavorite: boolean;
};

type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  participants: string[];
  projectId: string;
};

export default function MeetBotPage() {
  const [selectedProject, setSelectedProject] = useState<any>();
  const [userSelectedProject, setUserSelectedProject] = useState<any>();
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState<Meeting | null>(null);
  const [meetingToRename, setMeetingToRename] = useState<Meeting | null>(null);
  const [meetingToMove, setMeetingToMove] = useState<Meeting | null>(null);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [newMeetingProjectId, setnewMeetingProjectIdId] = useState("");
  const [isCreateMeetingDialogOpen, setIsCreateMeetingDialogOpen] =
    useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState("");
  const [newMeetingDate, setNewMeetingDate] = useState("");
  const [newMeetingTime, setNewMeetingTime] = useState("");
  const [newMeetingParticipants, setNewMeetingParticipants] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const user = useUser();
  const pathName = usePathname();

  const router = useRouter();

  useEffect(() => {
    const path = pathName.split("/")[1];
    setSelectedProject(
      projects.find((p) => p.link === `/${path}`) || projects[0]
    );
  }, []);

  const addProject = () => {
    if (!user.user?.id) {
      return;
    }

    if (newProjectName.trim()) {
      const newProject = {
        name: newProjectName.trim(),
        ownerId: user.user.id,
      };
      setButtonLoading(true);

      fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProject),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setUserProjects([...userProjects, data]);
          setNewProjectName("");
          setIsAddProjectDialogOpen(false);
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const deleteProject = (id: string) => {
    if (deleteConfirmation === projectToDelete?.name) {
      setButtonLoading(true);
      fetch(`/api/project/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.ok) {
            setUserProjects(
              userProjects.filter((project) => project.id !== id)
            );
            setProjectToDelete(null);
            setDeleteConfirmation("");
          } else {
            console.error("Failed to delete project");
          }
        })
        .catch((error) => console.error("Error deleting project:", error))
        .finally(() => setButtonLoading(false));
    }
  };

  const renameProject = () => {
    if (projectToRename && newName.trim()) {
      setButtonLoading(true);
      fetch(`/api/project/${projectToRename.id}`, {
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
          setUserProjects(
            userProjects.map((project) =>
              project.id === data.id ? { ...project, name: data.name } : project
            )
          );
          setProjectToRename(null);
          setNewName("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const toggleFavorite = (id: string) => {
    setPageLoading(true);
    fetch(`/api/project/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isFavorite: !userProjects.find((p) => p.id === id)?.isFavorite,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setUserProjects(
            userProjects.map((project) =>
              project.id === id
                ? { ...project, isFavorite: !project.isFavorite }
                : project
            )
          );
        }
      })
      .finally(() => setPageLoading(false));
  };

  const getUserProjects = async () => {
    console.log("Getting projects");
    const userId = user.user?.id;
    if (!userId) {
      return;
    }

    setPageLoading(true);
    try {
      const response = await fetch(`/api/project?ownerId=${userId}`);
      const data = await response.json();
      setUserProjects(data);
    } catch (error) {
      console.error("Error fetching user projects:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const getProjectMeetings = async (projectId: string) => {
    setPageLoading(true);
    try {
      const response = await fetch(`/api/meeting?projectId=${projectId}`);
      const data = await response.json();
      setMeetings(data);
    } catch (error) {
      console.error("Error fetching project meetings:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const deleteMeeting = (id: string) => {
    setMeetings(meetings.filter((meeting) => meeting.id !== id));
    setMeetingToDelete(null);
  };

  const renameMeeting = () => {
    if (meetingToRename && newMeetingName.trim()) {
      setButtonLoading(true);
      fetch(`/api/meeting/${meetingToRename.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newMeetingName.trim(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMeetings(
            meetings.map((meeting) =>
              meeting.id === data.id
                ? { ...meeting, title: data.title }
                : meeting
            )
          );
          setMeetingToRename(null);
          setNewMeetingName("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const moveMeeting = () => {
    if (meetingToMove && newMeetingProjectId) {
      setButtonLoading(true);
      fetch(`/api/meeting/${meetingToMove.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: newMeetingProjectId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMeetings(
            meetings.filter((meeting) => meeting.id !== meetingToMove.id)
          );
          setMeetingToMove(null);
          setnewMeetingProjectIdId("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  const createMeeting = () => {
    if (newMeetingTitle.trim() && newMeetingDate && newMeetingTime) {
      setButtonLoading(true);
      fetch("/api/meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newMeetingTitle.trim(),
          date: newMeetingDate,
          time: newMeetingTime,
          participants: newMeetingParticipants
            .split(",")
            .map((p) => p.trim())
            .filter((p) => p),
          projectId: userSelectedProject.id,
          ownerId: user.user?.id,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          setMeetings([...meetings, data]);
          setIsCreateMeetingDialogOpen(false);
          setNewMeetingTitle("");
          setNewMeetingDate("");
          setNewMeetingTime("");
          setNewMeetingParticipants("");
        })
        .catch((err) => console.error(err))
        .finally(() => setButtonLoading(false));
    }
  };

  useEffect(() => {
    getUserProjects();
  }, [user.user]);

  useEffect(() => {
    if (userSelectedProject) {
      getProjectMeetings(userSelectedProject?.id);
    }
  }, [userSelectedProject]);

  return (
    <div className="flex h-screen bg-background">
      {pageLoading ? <Loader fullScreen={true} /> : ""}
      {/* Left Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-2">
            {/* Project Selector Dropdown */}
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
                    onClick={() => setSelectedProject(project)}
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
                placeholder="Search projects..."
                className="pl-8 mr-1 bg-white"
              />
              <Dialog
                open={isAddProjectDialogOpen}
                onOpenChange={setIsAddProjectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="ghost" className="border shadow px-2">
                    <Plus className="size-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Project</DialogTitle>
                    <DialogDescription>
                      Enter a name for your new project.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                  />
                  <DialogFooter>
                    <Button
                      onClick={addProject}
                      className="w-full"
                      disabled={!newProjectName || buttonLoading}
                    >
                      {buttonLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Add Project"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={["userProjects"]}
            >
              {/* Projects Section */}
              <AccordionItem value="userProjects">
                <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">
                  Projects
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {userProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between group px-1 py-1 rounded-md hover:bg-accent cursor-pointer"
                      >
                        <div
                          className="flex items-center flex-grow"
                          onClick={() => setUserSelectedProject(project)}
                        >
                          <FileVideo
                            className={`mr-2 h-4 w-4 ${
                              project.isFavorite ? "text-yellow-500" : ""
                            }`}
                          />
                          <span className="text-sm text-muted-foreground group-hover:text-primary">
                            {project.name}
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
                              onClick={() => toggleFavorite(project.id)}
                            >
                              {project.isFavorite
                                ? "Remove from favorites"
                                : "Add to favorites"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setProjectToRename(project);
                                setNewName(project.name);
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setProjectToDelete(project)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    {userProjects.length === 0 && (
                      <div className="text-muted-foreground">
                        No projects found.
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Favorite Projects Section */}
              <AccordionItem value="favorites">
                <AccordionTrigger className="text-sm font-semibold text-muted-foreground hover:no-underline">
                  Favorite Projects
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {userProjects
                      .filter((project) => project.isFavorite)
                      .map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center px-1 py-1 rounded-md hover:bg-accent group"
                        >
                          <FileVideo className="mr-2 h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-muted-foreground group-hover:text-primary">
                            {project.name}
                          </span>
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

      {/* Main Content */}
      {userSelectedProject && (
        <div className="flex-1 flex flex-col bg-background">
          <header className="bg-card p-4 border-b border-border flex items-center justify-between">
            <h1 className="text-xl font-semibold text-primary">
              {userSelectedProject.name} - Meetings
            </h1>
            <Button
              variant={"outline"}
              className="shadow"
              onClick={() => setIsCreateMeetingDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Meeting
            </Button>
          </header>

          <main className="flex-1 p-4 space-y-4">
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-4">
                {meetings.map((meeting) => (
                  <Card
                    key={meeting.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      router.push(`/meetbot/meeting`);
                    }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div
                          onClick={() =>
                            router.push(`/meetbot/meeting/${meeting.id}`)
                          }
                        >
                          <CardTitle>{meeting.title}</CardTitle>
                          <CardDescription className="mt-1">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{meeting.date}</span>
                              <Clock className="w-4 h-4 ml-2 mr-1" />
                              <span>{meeting.time}</span>
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2">
                            {meeting.participants
                              .slice(0, 3)
                              .map((participant, index) => (
                                <Avatar
                                  key={index}
                                  className="border-2 border-background"
                                >
                                  <AvatarFallback>
                                    {participant[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            {meeting.participants.length > 3 && (
                              <Avatar className="border-2 border-background">
                                <AvatarFallback>
                                  +{meeting.participants.length - 3}
                                </AvatarFallback>
                              </Avatar>
                            )}
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
                                  setMeetingToRename(meeting);
                                  setNewMeetingName(meeting.title);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMeetingToMove(meeting);
                                }}
                              >
                                <MoveRight className="mr-2 h-4 w-4" />
                                Move to Project
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMeetingToDelete(meeting);
                                }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Rename Project Dialog */}
      <Dialog
        open={!!projectToRename}
        onOpenChange={() => setProjectToRename(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for the project.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New project name"
          />
          <DialogFooter>
            <Button
              onClick={renameProject}
              disabled={newName === projectToRename?.name || buttonLoading}
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

      {/* Delete Project Dialog */}
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={() => setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project "{projectToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type "{projectToDelete?.name}" to confirm:
            </Label>
            <Input
              id="confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type project name to confirm"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProject(projectToDelete?.id || "")}
              disabled={
                deleteConfirmation !== projectToDelete?.name || buttonLoading
              }
            >
              {buttonLoading ? <Loader2 className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Meeting Dialogs */}
      <Dialog
        open={!!meetingToRename}
        onOpenChange={() => setMeetingToRename(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Meeting</DialogTitle>
            <DialogDescription>
              Enter a new name for the meeting.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newMeetingName}
            onChange={(e) => setNewMeetingName(e.target.value)}
            placeholder="New meeting name"
          />
          <DialogFooter>
            <Button
              onClick={renameMeeting}
              disabled={
                newMeetingName === meetingToRename?.title || buttonLoading
              }
            >
              {buttonLoading ? <Loader2 className="animate-spin" /> : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!meetingToMove}
        onOpenChange={() => setMeetingToMove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Meeting</DialogTitle>
            <DialogDescription>
              Select a project to move this meeting to.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={newMeetingProjectId}
            onValueChange={setnewMeetingProjectIdId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {userProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={moveMeeting}
              disabled={!newMeetingProjectId || buttonLoading}
            >
              {buttonLoading ? <Loader2 className="animate-spin" /> : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!meetingToDelete}
        onOpenChange={() => setMeetingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the meeting "
              {meetingToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMeetingToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMeeting(meetingToDelete?.id || "")}
              disabled={
                deleteConfirmation !== meetingToDelete?.title || buttonLoading
              }
            >
              {buttonLoading ? <Loader2 className="animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isCreateMeetingDialogOpen}
        onOpenChange={setIsCreateMeetingDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>
              Enter the details for the new meeting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newMeetingTitle}
                onChange={(e) => setNewMeetingTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={newMeetingDate}
                onChange={(e) => setNewMeetingDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={newMeetingTime}
                onChange={(e) => setNewMeetingTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="participants" className="text-right">
                Participants
              </Label>
              <Input
                id="participants"
                value={newMeetingParticipants}
                onChange={(e) => setNewMeetingParticipants(e.target.value)}
                placeholder="Enter names separated by commas"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={createMeeting}
              disabled={!newMeetingTitle || buttonLoading}
            >
              {buttonLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Meeting"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
