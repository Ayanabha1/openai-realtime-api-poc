"use client";

import { useRef, useEffect } from "react";

interface WaveformVisualizerProps {
  isRecording: boolean;
  className?: string;
}

export function WaveformVisualizer({
  isRecording,
  className,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(null);
  const dataArrayRef = useRef<Uint8Array>(null);
  const analyserRef = useRef<AnalyserNode>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;

    const setupAudioAnalysis = async () => {
      if (!isRecording) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioContext = new AudioContext();
        analyserRef.current = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        dataArrayRef.current = new Uint8Array(
          analyserRef.current.frequencyBinCount
        );

        animate();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    const animate = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current)
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const draw = () => {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        analyserRef.current!.getByteTimeDomainData(dataArrayRef.current!);

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "black";
        ctx.beginPath();

        const sliceWidth = WIDTH / dataArrayRef.current!.length;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current!.length; i++) {
          const v = dataArrayRef.current![i] / 128.0;
          const y = (v * HEIGHT) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    if (isRecording) {
      setupAudioAnalysis();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isRecording]);

  return (
    <canvas ref={canvasRef} className={className} width={600} height={100} />
  );
}
