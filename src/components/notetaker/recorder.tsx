"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bookmark, Pause, Square, Play, RotateCcw, Mic } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { WaveformVisualizer } from "./WaveformVisualizer";
import AWS from "aws-sdk";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Recorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlayer, setShowPlayer] = useState(false);
  const [audioProcessed, setAudioProcessed] = useState(false);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [audioProcessing, setAudioProcessing] = useState(false);

  const timerRef = useRef<NodeJS.Timeout>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

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

  const s3 = new AWS.S3({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  let startTime: any;
  const startRecording = async () => {
    try {
      startTime = Date.now();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setRecordedAudioBlob(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = url;
        }
        const _duration = (Date.now() - startTime) / 1000;
        setDuration(_duration);

        console.log("Duration:", _duration);
        setShowPlayer(true);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setShowPlayer(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

  const handleSliderChange = (value: number[]) => {
    const newTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const resetRecording = () => {
    setShowPlayer(false);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  };

  const uploadToS3 = async (file: File) => {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET!,
      Key: file.name,
      Body: file,
      ContentType: "audio/wav",
    };

    try {
      const data = await s3.upload(params).promise();
      return data;
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const processAudio = async () => {
    console.log("Processing audio...", recordedAudioBlob);
    setAudioProcessing(true);
    try {
      if (!user.user) {
        console.error("User not authenticated");
        return;
      }

      //Example usage
      let uploadedAudio: any = null;
      if (recordedAudioBlob) {
        const d = new Date();
        const file = new File(
          [recordedAudioBlob],
          `${user.user.id}_${d.getTime()}`,
          { type: "audio/wav" }
        );

        console.log(file);
        uploadedAudio = await uploadToS3(file).catch((err) => {
          console.error("Error uploading audio:", err);
        });
      }

      const newNoteRes = await fetch("/api/note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: uploadedAudio?.Location,
          audioDuration: duration,
          ownerId: user.user.id,
        }),
      });
      const newNote = await newNoteRes.json();

      if (!newNote) {
        console.error("Error creating new note");
        return;
      }

      // generate notes
      await fetch(`/api/process-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: uploadedAudio?.Location,
          noteId: newNote.id,
        }),
      });
      router.push(`/notetaker/note/${newNote.id}`);
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      resetRecording();
      setAudioProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-4">
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="text-lg font-medium">Record</span>
        </CardHeader>
        <CardContent className="space-y-8">
          {!showPlayer ? (
            <>
              <div className="text-center">
                <div className="text-5xl font-mono tracking-wider">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Standard Quality
                </div>
              </div>

              <WaveformVisualizer
                isRecording={isRecording}
                className="w-full h-24 border rounded-lg"
              />

              <div className="flex justify-center items-center gap-4">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <Square className="h-8 w-8" />
                      <span>Stop Recording</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-md">
                      <Mic className="h-8 w-8" />
                      <span>Start Recording</span>
                    </div>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-5xl font-mono tracking-wider">
                  {formatTime(currentTime)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {formatTime(duration)}
                </div>
              </div>

              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={0.1}
                onValueChange={handleSliderChange}
                className="mt-4"
              />

              <div className="flex justify-center items-center gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  onClick={resetRecording}
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
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                >
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>
              <Button
                variant="default"
                className="w-full"
                onClick={processAudio}
                disabled={!audioUrl || audioProcessing}
              >
                {audioProcessing ? "Processing..." : "Process Audio"}
              </Button>

              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() =>
                  setCurrentTime(audioRef.current?.currentTime || 0)
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
