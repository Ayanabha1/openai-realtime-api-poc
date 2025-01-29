"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, GripVertical, Pencil } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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
        <span className="font-mono text-sm">{text}</span>
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
  const [keyPoints, setKeyPoints] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newKeyPoints, setNewKeyPoints] = useState([]);

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
    setIsEditing(false);
    console.log("Saved key points:", keyPoints);

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
  };

  const moveItem = async (dragIndex: number, hoverIndex: number) => {
    const dragItem = keyPoints[dragIndex];
    let newOrientation = keyPoints;
    setKeyPoints((prevPoints) => {
      const newPoints = [...prevPoints];
      newPoints.splice(dragIndex, 1);
      newPoints.splice(hoverIndex, 0, dragItem);
      newOrientation = newPoints;
      return newPoints;
    });

    const response = await fetch(`/api/note/${noteId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key_points: newOrientation,
      }),
    });
    const data = await response.json();
    console.log(data);
  };

  const updateItem = (index: number, text: string) => {
    const newPoints = [...keyPoints];
    newPoints[index] = text;
    setKeyPoints(newPoints.map((item, i) => (i === index ? text : item)));
  };

  const getNoteDetails = async () => {
    const response = await fetch(`/api/note/${noteId}`);
    const data = await response.json();
    setNoteDetails(data);
    setKeyPoints(data?.key_points);
    setSuggestions(data?.suggestions);
  };

  useEffect(() => {
    getNoteDetails();
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-mono">Notes Summarization</h1>
            <p className="text-gray-500 font-mono">
              Generated from audio recording
            </p>
          </div>

          {/* Main content */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-lg">Transcription</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{noteDetails?.transcription}</p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-lg">Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {suggestions?.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
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

          {/* Audio player */}
        </div>
      </div>
    </DndProvider>
  );
}
