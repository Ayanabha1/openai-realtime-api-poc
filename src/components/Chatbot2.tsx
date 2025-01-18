"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Mic, StopCircle, Send } from "lucide-react";
import axios from "axios";

export default function Chatbot2({
  initChatbotConnection,
  closeConnection,
  nextMessage,
  sendTextMessage,
}: {
  initChatbotConnection: () => Promise<void>;
  closeConnection: () => void;
  nextMessage: {
    sender: string;
    transcript: string;
  };
  sendTextMessage: (text: string) => Promise<void>;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsating, setIsPulsating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [meetingName, setMeetingName] = useState("");
  const [JSONFile, setJSONFile] = useState<File | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; transcript: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [JSONContent, setJSONContent] = useState<any>([]);
  const [contextUploadLoading, setContextUploadLoading] = useState(false);
  const [participants, setParticipants] = useState<any>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (file && file.type === "application/json") {
      const fileReader = new FileReader();

      fileReader.onload = () => {
        const JSONData = fileReader.result as string;

        const data = JSON.parse(JSONData);

        const uniqueParticipants = Array.from(
          new Set(data.map((item: any) => item.speaker))
        );
        console.log(uniqueParticipants);

        if (uniqueParticipants.length > 0 && participants.length === 0) {
          setParticipants(uniqueParticipants.join(","));
        }

        setJSONContent(data);
        setJSONFile(file);
      };
      fileReader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (userInput.trim()) {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        { sender: "You", transcript: userInput },
      ]);
      sendTextMessage(userInput);
      setUserInput("");
    }
  };

  const uploadContext = async () => {
    if (JSONFile) {
      setContextUploadLoading(true);
      try {
        const allParticipants = participants.split(",");

        const response = await axios.post(
          "http://localhost:8000/context",
          {
            projectName,
            meetingName,
            data: JSONContent,
            participants: allParticipants,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log({
          projectName,
          meetingName,
          JSONContent,
        });
        const data = response.data;
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "AI",
            transcript: `Successfully uploaded context for Meeting: ${meetingName} under Project: ${projectName}`,
          },
        ]);
        setContextUploadLoading(false);
      } catch (error) {
        setContextUploadLoading(false);
        console.error("Error uploading context:", error);
      }
    }
  };

  const startRecording = async () => {
    console.log("Start Recording");
    initChatbotConnection();
    setIsRecording(true);
  };

  const stopRecording = () => {
    console.log("Stop Recording");
    closeConnection();
    setIsRecording(false);
  };

  useEffect(() => {
    if (nextMessage && JSON.stringify(nextMessage) !== "{}") {
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: nextMessage.sender,
          transcript: nextMessage.transcript,
        },
      ]);
    }
  }, [nextMessage]);

  return (
    <div className="flex dark flex-col md:flex-row h-full p-4 pb-8 bg-[#222]">
      <Card className="flex-1 m-2 bg-muted border-2 shadow-xl h-full">
        <CardHeader>
          <CardTitle className="font-semibold text-xl">
            Context Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              uploadContext();
            }}
          >
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="border border-gray-500 mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="meetingName">Meeting Name</Label>
              <Input
                id="meetingName"
                value={meetingName}
                onChange={(e) => setMeetingName(e.target.value)}
                placeholder="Enter meeting name"
                className="border border-gray-500 mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="JSONFile">Upload JSON File</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mt-2 ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Drag and drop your JSON file here, or click to select
                </p>
                {JSONFile && (
                  <p className="mt-2 text-sm text-green-500">
                    File selected: {JSONFile.name}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".JSON"
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files[0])
                  }
                  className="hidden"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="participants">Participants</Label>
              <Input
                id="participants"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Enter comma-separated participants"
                className="border border-gray-500 mt-2"
                required
              />
            </div>
            <Button
              className="w-full"
              type="submit"
              disabled={contextUploadLoading}
            >
              {contextUploadLoading ? "Uploading..." : "Upload Context"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex-1 m-2 bg-muted border-2 shadow-xl h-full p-4 rounded-xl ">
        <div>
          <h1 className="text-xl text-white">Chatbot</h1>
        </div>
        <div className=" flex flex-col gap-4 justify-between h-full">
          <div className=" overflow-y-auto border rounded mt-2 border-gray-500 h-full text-white p-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg bg-white/50 text-gray-800
`}
              >
                <span className="font-bold">{message.sender}: </span>
                {message.transcript}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="w-full relative">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message here..."
                className="w-full h-12 border-gray-500 text-white"
              />

              {/* buttons */}
              <div className="flex gap-4 absolute right-2 top-[50%] translate-y-[-50%]">
                <Button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? (
                    <StopCircle className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
