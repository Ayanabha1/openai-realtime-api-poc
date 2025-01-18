"use client";
import VoiceChatbot from "@/components/Chatbot";
import Chatbot2 from "@/components/Chatbot2";
import { Button, ButtonProps } from "@/components/ui/button";
import { useRef, useState } from "react";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [nextMessage, setNextMessage] = useState<{
    sender: string;
    transcript: string;
  }>();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const fns = {
    getContext: async ({ query }: { query: string }) => {
      const response = await fetch(
        `http://localhost:8000/context?query=${query}`,
        {
          method: "GET",
        }
      );
      const data = await response.json();
      return data.context;
    },
  };

  async function initChatbotConnection() {
    const tokenResponse = await fetch("http://localhost:8000/session");
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    pc.addTrack(ms.getTracks()[0]);

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.addEventListener("message", async (e) => {
      console.log(e);
      const msg = JSON.parse(e.data);
      // Handle function calls

      switch (msg.type) {
        case "response.content_part.done":
          const { part } = msg;
          console.log(part.transcript);
          setNextMessage({ sender: "AI", transcript: part.transcript });
          break;

        case "response.function_call_arguments.done":
          console.log("Calling a function");
          const fn = fns[msg.name];
          if (fn !== undefined) {
            console.log(
              `Calling local function ${msg.name} with ${msg.arguments}`
            );
            const args = JSON.parse(msg.arguments);
            const result = await fn(args);
            console.log("result", result);
            // Let OpenAI know that the function has been called and share it's output
            const event = {
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: msg.call_id, // call_id from the function_call message
                output: JSON.stringify(result), // result of the function
              },
            };
            dc.send(JSON.stringify(event));
            dc.send(JSON.stringify({ type: "response.create" }));
          }
          break;

        case "conversation.item.input_audio_transcription.completed":
          console.log("User Transcription:", msg);
          setNextMessage({ sender: "You", transcript: msg.transcript });
          break;
        default:
          break;
      }
    });

    dc.addEventListener("open", (e) => {
      console.log("Data channel is open", e);
      const event = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          tools: [
            {
              type: "function",
              name: "getContext",
              description:
                "The getContext tool retrieves related conversations stored in the Pinecone database based on a user query. It is designed to provide contextual information from past meetings. This tool can be used to fetch summaries, key points, participants, queries related to messages or meetings in general, ensuring the user has accurate and relevant insights to continue the conversation effectively.",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "The user query",
                  },
                },
              },
            },
          ],
          input_audio_transcription: {
            model: "whisper-1",
          },
        },
      };

      dc.send(JSON.stringify(event));
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-mini-realtime-preview";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
  }

  async function sendTextMessage(text: string) {
    if (dcRef.current === null) {
      return;
    }
    dcRef.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: { type: "text", text },
      })
    );
  }

  const closeConnection = () => {
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (dcRef.current) {
      dcRef.current.close();
    }
  };

  return (
    <main className="h-screen">
      <Chatbot2
        initChatbotConnection={initChatbotConnection}
        closeConnection={closeConnection}
        nextMessage={nextMessage}
        sendTextMessage={sendTextMessage}
      />
    </main>
  );
}
