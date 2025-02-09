"use client";
import { ApiKeyDialog } from "@/components/meetbot/ApiKeyDialog";
import Chatbot2 from "@/components/meetbot/Chatbot2";
import { Navbar } from "@/components/meetbot/Navbar";
import { useAuth } from "@clerk/nextjs";
import { set } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function MeetingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [chatbotReady, setChatbotReady] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [searchProject, setSearchProject] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const params = useParams<{ projectId: string; meetingId: string }>();
  const accumulatorRef = useRef("");
  const router = useRouter();

  const [nextMessage, setNextMessage] = useState<{
    sender: string;
    transcript: string;
    messageId?: string;
  }>();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const fns: { [key: string]: any } = {
    getContextInvoker: async ({ query }: { query: string }) => {
      const context = await getContext(query);
      return context;
    },
  };
  const auth = useAuth();

  async function getContext(query: string) {
    const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
    let queryParamsString = `?query=${query}&meetingId=${params.meetingId}`;
    if (searchProject) {
      queryParamsString += `&projectId=${params.projectId}`;
    }
    const response = await fetch(`${apiUrl}/context${queryParamsString}`, {
      method: "GET",
    });
    const data = await response.json();
    return data.context;
  }

  async function sendFunctionOutput(result: string, callId: any) {
    if (dcRef.current) {
      const event = {
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: result,
        },
      };
      dcRef.current?.send(JSON.stringify(event));
      dcRef.current?.send(JSON.stringify({ type: "response.create" }));
    }
  }

  async function handleFunctionCall(
    functionName: string,
    args: any,
    callId: any
  ) {
    const fn = fns[functionName];

    if (fn !== undefined) {
      console.log(`Calling local function ${functionName} with ${args}`);
      const _args = JSON.parse(args);
      const result = await fn(_args);
      console.log("result", result);
      sendFunctionOutput(result, callId);
    }
  }

  function addAiTranscription(messageId: string, transcript: string) {
    setNextMessage((prevState: any) => {
      // Only append if new text is different
      const newTranscript = prevState.transcript.endsWith(transcript)
        ? prevState.transcript
        : prevState.transcript + transcript;

      return {
        sender: "AI",
        transcript: newTranscript,
        messageId,
      };
    });
  }

  let updateAiTranscriptionIntervalId: any;
  async function initChatbotConnection() {
    const apiUrl = process.env.NEXT_PUBLIC_CHATBOT_API_URL;
    const tokenResponse = await fetch(`${apiUrl}/session`);
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
      const msg = JSON.parse(e.data);
      console.log(e);
      // Handle function calls

      switch (msg.type) {
        case "response.content_part.done":
          if (updateAiTranscriptionIntervalId) {
            clearInterval(updateAiTranscriptionIntervalId);
            updateAiTranscriptionIntervalId = null;
          }
          break;

        case "response.audio_transcript.delta":
          const { delta, response_id } = msg;
          accumulatorRef.current += delta;
          if (!updateAiTranscriptionIntervalId) {
            updateAiTranscriptionIntervalId = setInterval(() => {
              setNextMessage({
                sender: "AI",
                transcript: accumulatorRef.current,
                messageId: response_id,
              });
              accumulatorRef.current = "";
            }, 100);
          }
          break;

        case "response.function_call_arguments.done":
          console.log("Calling a function");
          handleFunctionCall(msg.name, msg.arguments, msg.call_id);
          break;

        case "conversation.item.input_audio_transcription.completed":
          setNextMessage({ sender: "YOU", transcript: msg.transcript });
          break;
        default:
          break;
      }
    });

    dc.addEventListener("open", (e) => {
      console.log("Data channel is open", e);
      setChatbotReady(true);
      const event = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          tools: [
            {
              type: "function",
              name: "getContextInvoker",
              description:
                "The getContext tool retrieves related conversations stored in the Pinecone database based on a user query. It is designed to provide contextual information from past meetings. This tool can be used to fetch summaries, key points, participants, queries related to messages or meetings in general, ensuring the user has accurate and relevant insights to continue the conversation effectively. If summary or participants information is asked, then try to look for those specific keywords.",
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
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          tool_choice: "auto",
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
    await pc.setRemoteDescription(answer as any);
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
    setChatbotReady(false);
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (dcRef.current) {
      dcRef.current.close();
    }
  };

  const handleApiKeySubmit = () => {
    setIsApiKeyDialogOpen(false);
    setIsLocked(false);
  };

  const toggleProjectSearch = () => {
    console.log(searchProject);
    setSearchProject(!searchProject);
  };

  useEffect(() => {
    if (auth.isLoaded && !auth.isSignedIn) {
      router.push("/sign-in");
    }
  }, [auth]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="h-full">
      {/* <ApiKeyDialog isOpen={isApiKeyDialogOpen} onSubmit={handleApiKeySubmit} /> */}
      <Chatbot2
        initChatbotConnection={initChatbotConnection}
        closeConnection={closeConnection}
        nextMessage={nextMessage!}
        sendTextMessage={sendTextMessage}
        chatbotReady={chatbotReady}
        projectId={params.projectId}
        meetingId={params.meetingId}
        searchProject={searchProject}
        toggleProjectSearch={toggleProjectSearch}
      />
    </main>
  );
}
