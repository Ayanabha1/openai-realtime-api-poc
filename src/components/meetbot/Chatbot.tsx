"use client";

import { Button } from "@/components/ui/button";
import React, { useState, useRef, useEffect } from "react";

export default function VoiceChatbot({
  initChatbotConnection,
  closeConnection,
}: {
  initChatbotConnection: () => Promise<void>;
  closeConnection: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPulsating, setIsPulsating] = useState(false);

  const startRecording = async () => {
    console.log("Start Recording");
    initChatbotConnection();
    setIsPulsating(true);
    setIsRecording(true);
  };

  const stopRecording = () => {
    console.log("Stop Recording");
    closeConnection();
    setIsPulsating(false);
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div
        className={`w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 mb-8 ${
          isPulsating ? "animate-pulse" : ""
        }`}
      ></div>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 text-white rounded-full transition-colors ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
    </div>
  );
}
