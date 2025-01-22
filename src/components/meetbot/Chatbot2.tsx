"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mic, StopCircle, Send, Loader2 } from "lucide-react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export default function Chatbot2({
  initChatbotConnection,
  closeConnection,
  nextMessage,
  sendTextMessage,
  chatbotReady,
}: {
  initChatbotConnection: () => Promise<void>;
  closeConnection: () => void;
  nextMessage: {
    sender: string;
    transcript: string;
  };
  sendTextMessage: (text: string) => Promise<void>;
  chatbotReady: boolean;
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
  const [uploadedFile, setUploadedFile] = useState<any>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatbotRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (file: File) => {
    if (file && file.type === "application/json") {
      const fileReader = new FileReader();

      fileReader.onload = () => {
        const JSONData = fileReader.result as string;

        const data = JSON.parse(JSONData);

        const filteredData = data.map((item: any) => {
          const { speaker, message, timestamp } = item;
          return { speaker, message, timestamp };
        });

        const isValidJSON = filteredData.every(
          (item: any) =>
            item.hasOwnProperty("speaker") &&
            item.hasOwnProperty("message") &&
            item.hasOwnProperty("timestamp")
        );

        if (!isValidJSON) {
          alert(
            "JSON file must only contain the keys: speaker, message, timestamp"
          );
          return;
        }

        const uniqueParticipants = Array.from(
          new Set(data.map((item: any) => item.speaker))
        );

        if (uniqueParticipants.length > 0 && participants.length === 0) {
          setParticipants(uniqueParticipants.join(","));
        }

        setJSONContent(data);
        setJSONFile(file);
        setUploadedFile(file);
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
        const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
        const response = await axios.post(
          `${apiUrl}/context`,
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

      if (chatbotRef.current) {
        chatbotRef.current.scrollTop = chatbotRef.current.scrollHeight;
      }
    }
  }, [nextMessage]);

  return (
    <div className="h-full">
      <div className="md:h-full flex flex-col md:flex-row p-4 pb-8 text-white ">
        <div className="flex-1 m-2 border-2 h-full p-4 space-y-2 rounded-xl shadow-xl">
          <Tabs defaultValue="context" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="context">Context Message</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="h-full">
              <div className="h-full text-black p-4 px-2">
                <h2 className="text-lg font-medium mb-1">
                  Upload Context Message
                </h2>
                <p className="text-sm mb-4">
                  Add context or background information for this meeting
                </p>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="context"
                      className="block text-sm font-medium mb-1"
                    >
                      Context Message
                    </label>
                    <Textarea
                      id="context"
                      // value={contextMessage}
                      // onChange={(e) => setContextMessage(e.target.value)}
                      placeholder="Enter meeting context or background information"
                      className="min-h-[200px]"
                    />
                  </div>

                  <Button className="w-full" size="lg">
                    Upload Context
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transcript">
              <div className="space-y-4 p-4 px-2 rounded-lg text-black">
                <div>
                  <h2 className="text-lg font-medium mb-1">
                    Upload Meeting Transcript
                  </h2>
                  <p className="text-sm mb-4">
                    Provide the transcript of this meeting
                  </p>{" "}
                </div>
                <div>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      uploadContext();
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="JSONFile">Upload JSON File</Label>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${
                            isDragging
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            Drag and drop your JSON file here, or click to
                            select
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
                              e.target.files &&
                              handleFileUpload(e.target.files[0])
                            }
                            className="hidden"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      type="submit"
                      disabled={contextUploadLoading || !JSONFile}
                    >
                      {contextUploadLoading ? "Uploading..." : "Upload Context"}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 m-2 border-2 shadow-xl h-full p-4 rounded-xl ">
          <div>
            <h1 className="text-xl text-black">Chatbot</h1>
          </div>
          <div className=" flex flex-col gap-4 justify-between md:h-full h-72">
            <div
              ref={chatbotRef}
              className=" overflow-y-auto border rounded mt-2 border-gray-500 h-full text-white p-4"
            >
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
            <div className="mb-8">
              <Button
                className="w-full"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording && !chatbotReady ? (
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  <>
                    <Mic
                      className={`w-6 h-6 ${
                        isRecording ? "text-red-500" : "text-black"
                      }`}
                    />
                    {isRecording ? "Recording..." : "Start Recording"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
