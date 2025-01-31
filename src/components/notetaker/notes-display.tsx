"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, GripVertical, Pencil, ChevronLeft } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from 'react-markdown';
import { Loader } from "@/components/loader";
import { useRouter } from "next/navigation";

interface DraggableItemProps {
  id: string;
  index: number;
  text: string;
  isEditing: boolean;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, newText: string) => void;
  onDragEnd: () => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  text,
  isEditing,
  moveItem,
  updateItem,
  onDragEnd,
}) => {
  const ref = useRef<HTMLLIElement>(null);

  const [{ handlerId }, drop]: any = useDrop({
    accept: "item",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "item",
    item: () => {
      return { id, index };
    },
    end: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        onDragEnd();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`flex items-start gap-2 p-2 bg-white rounded-md transition-all ${isDragging ? "shadow-lg" : ""
        }`}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <div className="mt-1 cursor-grab">
        <GripVertical size={16} />
      </div>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => {
            updateItem(index, e.target.value);
          }}
          className="font-mono text-sm w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
          autoFocus
        />
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none flex-1">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      )}
    </li>
  );
};

export default function NotesDisplay({ noteId }: { noteId: string }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [noteDetails, setNoteDetails] = useState<any>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isUpdatingKeyPoints, setIsUpdatingKeyPoints] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const router = useRouter();
  const [duration, setDuration] = useState(0);
  const [newKeyPoint, setNewKeyPoint] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener("timeupdate", updateTime);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, []);

  const handleSave = async () => {
    setIsUpdatingKeyPoints(true);
    setIsEditing(false);
    console.log("Saved key points:", keyPoints);

    try {
      const response = await fetch(`/api/note/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_points: keyPoints,
        }),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error updating key points:", error);
    } finally {
      setIsUpdatingKeyPoints(false);
    }
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = keyPoints[dragIndex];
    setKeyPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints.splice(dragIndex, 1);
      newPoints.splice(hoverIndex, 0, dragItem);
      return newPoints;
    });
    setNeedsUpdate(true);
  };

  const updateItem = (index: number, text: string) => {
    const newPoints: any = [...keyPoints];
    newPoints[index] = text;
    setKeyPoints(newPoints.map((item: any, i: any) => (i === index ? text : item)));
  };

  const getNoteDetails = async () => {
    setIsLoadingNotes(true);
    try {
      const response = await fetch(`/api/note/${noteId}`);
      const data = await response.json();
      setNoteDetails(data);
      setKeyPoints(data?.key_points);
      setSuggestions(data?.suggestions);
      setDuration(data?.audio_duration);
    } catch (error) {
      console.error("Error fetching note details:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    getNoteDetails();
  }, []);

  const handleDragEnd = async () => {
    if (!needsUpdate) return;

    setIsUpdatingKeyPoints(true);
    try {
      const response = await fetch(`/api/note/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_points: keyPoints,
        }),
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error updating key points order:", error);
    } finally {
      setIsUpdatingKeyPoints(false);
      setNeedsUpdate(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAddKeyPoint = () => {
    if (newKeyPoint.trim()) {
      setKeyPoints([...keyPoints, newKeyPoint.trim()]);
      setNewKeyPoint("");
    }
  };

  return (
    <div className="relative h-screen">
      <DndProvider backend={HTML5Backend}>
        {(isLoadingNotes || isUpdatingKeyPoints) && <Loader fullScreen={true} />}
        <div className="h-full overflow-y-scroll">

          <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col space-y-4">
              {/* Header */}
              <div className="flex gap-4 mb-8">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => router.back()}
                  className="hover:bg-accent mt-1"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold mb-1">{noteDetails?.title}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <p className="text-sm font-mono">Notes Summarization</p>
                    <span>•</span>
                    <p className="text-sm font-mono">Generated from audio recording</p>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <CardTitle className="font-mono text-lg">
                      Key Points
                    </CardTitle>
                    {isEditing ? (
                      <Button variant="outline" onClick={handleSave}>
                        Save
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {keyPoints?.map((point: any, index: any) => (
                      <DraggableItem
                        key={point}
                        id={point}
                        index={index}
                        text={point}
                        isEditing={isEditing}
                        moveItem={moveItem}
                        updateItem={updateItem}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </ul>

                  {isEditing && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={newKeyPoint}
                        onChange={(e) => setNewKeyPoint(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddKeyPoint();
                          }
                        }}
                        placeholder="Add a new key point..."
                        className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button
                        variant="outline"
                        onClick={handleAddKeyPoint}
                        disabled={!newKeyPoint.trim()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-32">
                <Accordion type="single" collapsible>
                  <AccordionItem value="transcription">
                    <Card>
                      <CardHeader className="pb-0">
                        <AccordionTrigger>
                          <CardTitle className="font-mono text-lg">Transcription</CardTitle>
                        </AccordionTrigger>
                      </CardHeader>
                      <AccordionContent>
                        <CardContent>
                          <p>{noteDetails?.transcription}</p>
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </Accordion>

                <Accordion type="single" collapsible>
                  <AccordionItem value="suggestions">
                    <Card>
                      <CardHeader className="pb-0">
                        <AccordionTrigger>
                          <CardTitle className="font-mono text-lg">Suggestions</CardTitle>
                        </AccordionTrigger>
                      </CardHeader>
                      <AccordionContent>
                        <CardContent>
                          <ul className="space-y-3">
                            {suggestions?.map((suggestion, index) => (
                              <li key={index} className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{suggestion}</ReactMarkdown>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                </Accordion>
              </div>


            </div>
          </div>

          {/* Audio element */}
          <audio
            ref={audioRef}
            src={noteDetails?.audio_url}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Fixed Audio Player */}
          <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4">
            <div className="container mx-auto max-w-7xl">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="h-10 w-10"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSliderChange}
                    className="flex-1"
                  />
                  <span className="text-sm tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </DndProvider>
    </div>
  );
}
