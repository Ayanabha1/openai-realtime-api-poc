"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, GripVertical } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface NotesDisplayProps {
  audioUrl?: string;
  audioDuration?: number;
}

interface DraggableItemProps {
  id: string;
  index: number;
  text: string;
  isEditing: boolean;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, newText: string) => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({
  id,
  index,
  text,
  isEditing,
  moveItem,
  updateItem,
}) => {
  const ref = useRef<HTMLLIElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: "item",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <li
      ref={ref}
      className={`flex items-start gap-2 p-2 bg-white rounded-md transition-all ${
        isDragging ? "shadow-lg" : ""
      }`}
      style={{ opacity }}
      data-handler-id={handlerId}
    >
      <div className="mt-1 cursor-grab">
        <GripVertical size={16} />
      </div>
      <input type="checkbox" className="mt-1.5" />
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => updateItem(index, e.target.value)}
          className="font-mono text-sm w-full border-b border-gray-300 focus:outline-none focus:border-blue-500"
        />
      ) : (
        <span className="font-mono text-sm">{text}</span>
      )}
    </li>
  );
};

export default function NotesDisplay({
  audioUrl,
  audioDuration,
}: NotesDisplayProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bulletPoints, setBulletPoints] = useState([
    "Key point 1: Discussed project timeline and milestones",
    "Key point 2: Team responsibilities and task allocation",
    "Key point 3: Budget considerations and resource allocation",
    "Key point 4: Technical requirements and specifications",
    "Key point 5: Quality assurance and testing procedures",
  ]);
  const [isEditing, setIsEditing] = useState(false);

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log("Saved key points:", bulletPoints);
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = bulletPoints[dragIndex];
    setBulletPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints.splice(dragIndex, 1);
      newPoints.splice(hoverIndex, 0, dragItem);
      return newPoints;
    });
  };

  const updateItem = (index: number, newText: string) => {
    setBulletPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints[index] = newText;
      return newPoints;
    });
  };

  const suggestions = [
    "Consider implementing automated testing",
    "Schedule weekly progress reviews",
    "Document all technical decisions",
    "Set up regular stakeholder meetings",
    "Create detailed project documentation",
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col space-y-4">
          {/* Window control dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-mono">Meeting Notes</h1>
            <p className="text-gray-500 font-mono">
              Generated from audio recording
            </p>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg">Key Points</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bulletPoints.map((point, index) => (
                    <DraggableItem
                      key={point}
                      id={point}
                      index={index}
                      text={point}
                      isEditing={isEditing}
                      moveItem={moveItem}
                      updateItem={updateItem}
                    />
                  ))}
                </ul>
                <div className="mt-4">
                  {isEditing ? (
                    <Button onClick={handleSave} className="w-full">
                      Save
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1.5" />
                      <span className="font-mono text-sm">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Floating play button */}
          <Button
            className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg"
            onClick={() => setShowPlayer(true)}
          >
            <Play className="h-6 w-6" />
          </Button>

          {/* Audio player dialog */}
          <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-5xl font-mono tracking-wider">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {formatTime(audioDuration || 0)}
                  </div>
                </div>

                <Slider
                  value={[currentTime]}
                  min={0}
                  max={audioDuration || 0}
                  step={0.1}
                  onValueChange={handleSliderChange}
                  className="mt-4"
                />

                <div className="flex justify-center items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full w-12 h-12"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                        setCurrentTime(0);
                        setIsPlaying(false);
                      }
                    }}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="default"
                    className="rounded-full w-16 h-16"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </Button>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={() =>
                    setCurrentTime(audioRef.current?.currentTime || 0)
                  }
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DndProvider>
  );
}
