"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Mic,
  StopCircle,
  Send,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useUser } from "@clerk/nextjs";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import TooltipComponent from "../TooltipComponent";

export default function Chatbot2({
  initChatbotConnection,
  closeConnection,
  nextMessage,
  sendTextMessage,
  chatbotReady,
  projectId,
  meetingId,
  searchProject,
  toggleProjectSearch,
}: {
  initChatbotConnection: () => Promise<void>;
  closeConnection: () => void;
  nextMessage: {
    sender: string;
    transcript: string;
    messageId?: string;
  };
  sendTextMessage: (text: string) => Promise<void>;
  chatbotReady: boolean;
  projectId: string;
  meetingId: string;
  searchProject: boolean;
  toggleProjectSearch: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsating, setIsPulsating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [meetingName, setMeetingName] = useState("");
  const [JSONFile, setJSONFile] = useState<File | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; transcript: string; messageId?: string }[]
  >([]);
  const [userInput, setUserInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [JSONContent, setJSONContent] = useState<any>([]);
  const [contextUploadLoading, setContextUploadLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>();
  const [contextMessage, setContextMessage] = useState("");
  const [meetingDetails, setMeetingDetails] = useState<any>();

  const user = useUser();

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
        { sender: "YOU", transcript: userInput },
      ]);
      sendTextMessage(userInput);
      setUserInput("");
    }
  };

  const uploadContext = async () => {
    if (contextMessage !== "") {
      setContextUploadLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
        console.log(
          meetingName,
          projectName,
          projectId,
          meetingId,
          contextMessage,
          user?.user?.id,
          meetingDetails?.participants
        );
        const response = await axios.post(
          `${apiUrl}/context`,
          {
            meetingName,
            projectName,
            projectId,
            meetingId,
            contextMessage,
            ownerId: user?.user?.id,
            participants: meetingDetails?.participants,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data;
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "AI",
            transcript: `Successfully uploaded context for Meeting: ${meetingName} under Project: ${projectName}`,
          },
        ]);
        setContextUploadLoading(false);
        setContextMessage("");
      } catch (error) {
        setContextUploadLoading(false);
        console.error("Error uploading context:", error);
      }
    }
  };

  const uploadTranscript = async () => {
    if (JSONContent.length > 0) {
      setContextUploadLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
        const response = await axios.post(
          `${apiUrl}/transcript`,
          {
            meetingName,
            projectName,
            projectId,
            meetingId,
            conversation: JSONContent,
            ownerId: user?.user?.id,
            participants: meetingDetails?.participants,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data;
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "AI",
            transcript: `Successfully uploaded transcript for Meeting: ${meetingName} under Project: ${projectName}`,
          },
        ]);
        setContextUploadLoading(false);
      } catch (error) {
        setContextUploadLoading(false);
        console.error("Error uploading transcript:", error);
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
      if (nextMessage.sender === "AI" && nextMessage.messageId) {
        const existingMessage = chatMessages.find(
          (m) => m.messageId === nextMessage.messageId
        );
        if (existingMessage) {
          setChatMessages((prevMessages) =>
            prevMessages.map((m) =>
              m.messageId === nextMessage.messageId
                ? { ...m, transcript: m.transcript + nextMessage.transcript }
                : m
            )
          );
        } else {
          setChatMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: nextMessage.sender,
              transcript: nextMessage.transcript,
              messageId: nextMessage.messageId,
            },
          ]);
        }
      } else {
        setChatMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: nextMessage.sender,
            transcript: nextMessage.transcript,
          },
        ]);
      }

      if (chatbotRef.current) {
        chatbotRef.current.scrollTop = chatbotRef.current.scrollHeight;
      }
    }
  }, [nextMessage]);

  const getMeetingDetails = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
    const response = await fetch(`/api/meeting/${meetingId}`, {
      method: "GET",
    });
    const data = await response.json();
    setMeetingDetails(data);
    setMeetingName(data?.title);
    setProjectName(data?.project?.name);
  };

  useEffect(() => {
    getMeetingDetails();
  }, []);

  return (
    <div className="h-screen pb-16">
      <div className="md:h-full flex flex-col md:flex-row p-4 pb-8 text-white">
        <div className="flex-1 m-2 border-2 h-full p-4 space-y-2 rounded-xl shadow-xl">
          <Tabs defaultValue="context" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="context">Context Message</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            <TabsContent value="context" className="h-[95%]">
              <div className="h-full text-black p-4 px-2 flex flex-col">
                <h2 className="text-lg font-medium mb-1">
                  Upload Context Message
                </h2>
                <p className="text-sm mb-4">
                  Add context or background information for this meeting
                </p>

                <form
                  className="space-y-4 h-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    uploadContext();
                  }}
                >
                  <label
                    htmlFor="context"
                    className="block text-sm font-medium mb-1"
                  >
                    Context Message
                  </label>
                  <Textarea
                    id="context"
                    value={contextMessage}
                    onChange={(e) => setContextMessage(e.target.value)}
                    placeholder="Enter meeting context or background information"
                    className="min-h-[300px] h-[88%]"
                    required
                  />

                  <Button
                    type="submit"
                    className="w-full mt-auto"
                    disabled={
                      contextUploadLoading || contextMessage.trim() === ""
                    }
                  >
                    {contextUploadLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <span>Upload Context</span>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="h-[95%]">
              <div className="space-y-4 p-4 px-2 rounded-lg text-black h-full">
                <div>
                  <h2 className="text-lg font-medium mb-1">
                    Upload Meeting Transcript
                  </h2>
                  <p className="text-sm mb-4">
                    Provide the transcript of this meeting
                  </p>{" "}
                </div>
                <div className="h-full">
                  <form
                    className="space-y-4 h-[92%] flex flex-col justify-between"
                    onSubmit={(e) => {
                      e.preventDefault();
                      uploadTranscript();
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="JSONFile">Upload JSON File</Label>
                        <div
                          className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer h-[200px] flex flex-col items-center justify-center ${
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
                      className="w-full mt-auto"
                      type="submit"
                      disabled={contextUploadLoading || !JSONFile}
                    >
                      {contextUploadLoading
                        ? "Uploading..."
                        : "Upload Transcript"}
                    </Button>
                  </form>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 m-2 border-2 shadow-xl h-full rounded-xl ">
          <div className="flex bg-gray-100 p-4 justify-between">
            <h1 className="text-xl text-black ">Chatbot</h1>
            <div className="flex items-center space-x-2">
              <TooltipComponent
                text="Please stop recording to toggle project-wide search mode"
                visible={isRecording}
              >
                <Switch
                  id="search-mode"
                  checked={searchProject}
                  onCheckedChange={toggleProjectSearch}
                  disabled={isRecording}
                />
                <Label htmlFor="search-mode" className="text-sm text-black">
                  Project Search
                </Label>
              </TooltipComponent>
            </div>
          </div>
          <div className=" flex flex-col justify-between md:h-full h-72">
            <div
              ref={chatbotRef}
              className=" overflow-y-scroll border rounded mt-6 border-gray-500 text-white h-full m-4 mb-0"
            >
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 rounded-lg bg-white/50 text-gray-800 p-2
`}
                >
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.sender === "AI" ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={
                          message.sender === "AI"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted"
                        }
                      >
                        {message.sender === "AI" ? (
                          <Bot className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.sender === "AI"
                          ? "bg-muted"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {message.transcript}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-14 w-full p-4">
              <Button
                className="w-full"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!user.isSignedIn}
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
                        isRecording ? "text-red-500" : "text-white"
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
