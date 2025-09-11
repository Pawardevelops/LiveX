// app/components/CameraPreview.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Zap, RefreshCcw, X } from "lucide-react";
import { GeminiWebSocket } from "../services/geminiWebSocket";
import { Base64 } from "js-base64";
import { s3UploadVideo } from "../utils/s3upload";
import { buildStepInstruction } from "../prompts/inspector";

const INSTRUCTIONS = buildStepInstruction(null);

interface CameraPreviewProps {
  onTranscription: (text: string) => void;
  onToggleChat?: () => void; // toggle chat sidebar/drawer
}

type FacingMode = "user" | "environment";

// Audio visualization component
const AudioVisualizer = ({
  audioLevel,
  isActive,
}: {
  audioLevel: number;
  isActive: boolean;
}) => {
  const bars = Array.from({ length: 4 }, (_, i) => {
    const delay = i * 0.1;
    const height = isActive
      ? Math.max(20, audioLevel * 0.8 + Math.random() * 20)
      : 20;

    return (
      <div
        key={i}
        className={`bg-white rounded-full transition-all duration-200 ${
          isActive ? "animate-pulse" : ""
        }`}
        style={{
          width: "3px",
          height: `${height}%`,
          animationDelay: `${delay}s`,
          opacity: isActive ? 0.8 + (audioLevel / 100) * 0.2 : 0.4,
        }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-1 h-8 w-8">{bars}</div>
  );
};
export default function CameraPreview({
  onTranscription,
  onToggleChat,
}: CameraPreviewProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0..100 input level
  const [outputAudioLevel, setOutputAudioLevel] = useState(0); // 0..100 TTS level
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [isAudioSetup, setIsAudioSetup] = useState(false);
  const setupInProgressRef = useRef(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  // Facing + torch state
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [slowMode, setSlowMode] = useState(true); // NEW: start slower
  const [autoAdvance, setAutoAdvance] = useState(false); // default off

  // Call this when user taps Next:
  const handleNext = () => {
    geminiWsRef.current?.sendClientEvent("checkpoint.next"); // optional breadcrumb
    geminiWsRef.current?.requestResponse({ reason: "user-continue" });
  };

  // Repeat the current instruction:
  const handleRepeat = () => {
    geminiWsRef.current?.sendClientEvent("checkpoint.repeat");
    geminiWsRef.current?.requestResponse({ reason: "repeat" });
  };

  // Skip if inaccessible:
  const handleSkip = () => {
    geminiWsRef.current?.sendClientEvent("checkpoint.skip");
    geminiWsRef.current?.requestResponse({ reason: "skip" });
  };

  // Inform model about slow mode anytime it toggles:
  useEffect(() => {
    geminiWsRef.current?.sendClientEvent("pace", {
      mode: slowMode ? "slow" : "normal",
    });
  }, [slowMode]);

  // --- Smooth audio level for pulse UI (0..1) ---
  const [smoothLevel, setSmoothLevel] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const raw = (isModelSpeaking ? outputAudioLevel : audioLevel) / 100; // 0..1
      setSmoothLevel((prev) => prev + (raw - prev) * 0.15); // eased
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioLevel, outputAudioLevel, isModelSpeaking]);

  const cleanupAudio = useCallback(() => {
    try {
      audioWorkletNodeRef.current?.disconnect();
      audioWorkletNodeRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } finally {
      audioContextRef.current = null;
    }
  }, []);

  const cleanupWebSocket = useCallback(() => {
    if (geminiWsRef.current) {
      geminiWsRef.current.disconnect();
      geminiWsRef.current = null;
    }
  }, []);

  // Send audio PCM to Gemini WS
  const sendAudioData = (b64Data: string) => {
    if (!geminiWsRef.current) return;
    geminiWsRef.current.sendMediaChunk(b64Data, "audio/pcm");
  };

  // --- Media control helpers ---
  const stopMediaTracksOnly = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  };
  const startVideoRecording = (videoStream: MediaStream) => {
    // 2. Create MediaRecorder
    const recordedChunks: Blob[] = [];
    mediaRecorderRef.current = new MediaRecorder(videoStream, {
      mimeType: "video/webm; codecs=vp9", // fallback to "video/webm" if needed
    });

    // 3. Capture chunks as data becomes available
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // 5. Start recording
    mediaRecorderRef.current.start();

    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });

      // Create a download link
      const url = await s3UploadVideo(
        blob,
        process.env.NEXT_PUBLIC_AWS_S3_BUCKET || "",
        new URLSearchParams(window.location.search).get("vehicleId") || "",
        "walkaround"
      );

      window.location.assign("/vehicles?v=success");
    };
  };

  const stopVideoRecordingAndRedirect = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current?.stop();
    }
    window.location.assign("/vehicles");
  };

  const getMedia = async (mode: FacingMode) => {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    startVideoRecording(videoStream);

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000, // hint
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      },
    });

    const combined = new MediaStream([
      ...videoStream.getTracks(),
      ...audioStream.getTracks(),
    ]);

    if (videoRef.current) {
      videoRef.current.srcObject = combined;
      videoRef.current.muted = true; // avoid acoustic echo
      (videoRef.current as any).playsInline = true;
    }

    setStream(combined);
    return combined;
  };

  const startMedia = async (mode: FacingMode) => {
    try {
      // Create/resume AudioContext on user gesture (iOS)
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new Ctx({ sampleRate: 16000 });
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const media = await getMedia(mode);
      setIsStreaming(true);
      setFlashOn(false); // reset torch state on fresh start
      return media;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      cleanupAudio();
      return null;
    }
  };

  const toggleCamera = async () => {
    if (isStreaming) {
      setIsStreaming(false);
      cleanupWebSocket();
      cleanupAudio();
      stopMediaTracksOnly();
      setFlashOn(false);
    } else {
      await startMedia(facing);
    }
  };

  const flipCamera = async () => {
    const nextFacing: FacingMode = facing === "user" ? "environment" : "user";
    setFacing(nextFacing);
    stopMediaTracksOnly();
    await startMedia(nextFacing);
  };

  // Torch / flash toggle
  const toggleFlash = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const caps: any =
      (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
    if (!("torch" in caps)) {
      setFlashOn((v) => !v);
      alert("Torch/flash is not supported on this device or browser.");
      return;
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !flashOn }] as any,
      });
      setFlashOn((v) => !v);
    } catch (e) {
      console.error("Failed to toggle torch:", e);
      alert("Failed to toggle flash. Your device may not allow it.");
    }
  };

  // NEW: Close handler (X button) — stops everything, then navigates back
  const handleClose = () => {
    if (isStreaming) {
      setIsStreaming(false);
      cleanupWebSocket();
      cleanupAudio();
      stopMediaTracksOnly();
      setFlashOn(false);
    }
    router.back();
  };

  const handleTranscription = useCallback(
    (text: string) => {
      const normalise = (s: string) => s.toLowerCase();
      const t = normalise(text);
      // tyer/tyre/tire variants
      if (/(front).*(tyre|tire|tyer)/.test(t)) {
        geminiWsRef.current?.sendClientEvent("user_asserts_view", {
          section: "front",
          item: "tyre",
        });
      }
      if (/(rear|back).*(tyre|tire|tyer)/.test(t)) {
        geminiWsRef.current?.sendClientEvent("user_asserts_view", {
          section: "back",
          item: "tyre",
        });
      }
      // then keep your existing message handling
      onTranscription(text);
    },
    [onTranscription]
  );

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isStreaming) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    const ws = new GeminiWebSocket(
      (text) => {
        /* optional streaming text */
      },
      () => {
        setIsWebSocketReady(true);
        setConnectionStatus("connected");
      },
      (isPlaying) => setIsModelSpeaking(isPlaying),
      (level) => {},
      handleTranscription,
      { instructions: INSTRUCTIONS },
      [
        "front_tyre",
        "front_tyre_gauge",
        "right_photo",
        "back_photo",
        "back_tyre_gauge",
        "left_photo",
        "odometer_value",
      ],
      new URLSearchParams(window.location.search).get("vehicleId") || "",
      stopVideoRecordingAndRedirect
    );
    geminiWsRef.current = ws;
    ws.connect();

    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
      cleanupWebSocket();
      setIsWebSocketReady(false);
      setConnectionStatus("disconnected");
    };
  }, [isStreaming, onTranscription, cleanupWebSocket]);

  // Start image capture only after WebSocket is ready
  useEffect(() => {
    if (!isStreaming || !isWebSocketReady) return;

    const captureAndSendImage = () => {
      if (!videoRef.current || !videoCanvasRef.current || !geminiWsRef.current)
        return;
      const canvas = videoCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = videoRef.current.videoWidth || 640;
      const h = videoRef.current.videoHeight || 360;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(videoRef.current, 0, 0, w, h);

      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      const b64Data = imageData.split(",")[1];

      geminiWsRef.current.sendMediaChunk(b64Data, "image/jpeg");
    };

    imageIntervalRef.current = setInterval(captureAndSendImage, 1800);
    return () => {
      if (imageIntervalRef.current) {
        clearInterval(imageIntervalRef.current);
        imageIntervalRef.current = null;
      }
    };
  }, [isStreaming, isWebSocketReady]);

  // Audio processing (worklet) setup
  useEffect(() => {
    if (!isStreaming || !stream || !isWebSocketReady) return;
    if (!audioContextRef.current || isAudioSetup || setupInProgressRef.current)
      return;

    let isActive = true;
    setupInProgressRef.current = true;

    const setupAudioProcessing = async () => {
      try {
        const ctx = audioContextRef.current!;
        if (ctx.state === "suspended") await ctx.resume();

        // Ensure this file exists in /public/worklets/audio-processor.js
        await ctx.audioWorklet.addModule("/worklets/audio-processor.js");
        if (!isActive) return;

        const node = new AudioWorkletNode(ctx, "audio-processor", {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          processorOptions: { sampleRate: 16000, bufferSize: 4096 },
          channelCount: 1,
          channelCountMode: "explicit",
          channelInterpretation: "speakers",
        });
        audioWorkletNodeRef.current = node;

        const source = ctx.createMediaStreamSource(stream);
        node.port.onmessage = (event) => {
          if (!isActive || isModelSpeaking) return;
          const { pcmData, level } = event.data;
          // if (typeof level === "number") setAudioLevel(level); // 0..100
          if (pcmData) {
            const pcmArray = new Uint8Array(pcmData);
            const b64Data = Base64.fromUint8Array(pcmArray);
            sendAudioData(b64Data);
          }
        };

        source.connect(node);
        setIsAudioSetup(true);

        return () => {
          source.disconnect();
          node.disconnect();
        };
      } catch (error) {
        console.error("[AudioWorklet] setup failed:", error);
        if (isActive) {
          cleanupAudio();
          setIsAudioSetup(false);
        }
      } finally {
        setupInProgressRef.current = false;
      }
    };

    setupAudioProcessing();

    return () => {
      isActive = false;
      setIsAudioSetup(false);
      setupInProgressRef.current = false;
      if (audioWorkletNodeRef.current) {
        audioWorkletNodeRef.current.disconnect();
        audioWorkletNodeRef.current = null;
      }
    };
  }, [isStreaming, stream, isWebSocketReady, isModelSpeaking, cleanupAudio]);

  // ---------- UI ----------
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Main video container */}
      <div className="relative h-full w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Top header with Live indicator and close button */}
        <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/50 to-transparent pt-2">
          <div className="flex items-center justify-between px-4 py-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="rounded-full text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white font-medium">Live</span>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="rounded-full text-white hover:bg-white/20"
            ></Button>
          </div>
        </div>

        {/* Connection Status Overlay */}
        {isStreaming && connectionStatus !== "connected" && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
              <div className="space-y-2">
                <p className="text-white text-lg font-medium">
                  {connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
                </p>
                <p className="text-white/70 text-sm">
                  Setting up your inspection session
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom control bar */}
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 to-transparent">
          <div>
            {/* Main control row */}
            <div className="flex flex-col items-center justify-between mb-4">
              <div className="flex items-center space-x-4 gap-10">
                {/* Left controls */}
                <div className="flex items-center space-x-4">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={flipCamera}
                    className="rounded-full w-12 h-12 bg-white/20 hover:bg-white/30 border-0 text-white"
                  >
                    <RefreshCcw className="h-5 w-5" />
                  </Button>
                </div>

                {/* Center - Main record button with audio visualization */}
                <div className="relative">
                  {/* Animated rings when recording */}
                  {!isStreaming && (
                    <>
                      <div
                        className="absolute inset-0 rounded-full bg-white/10 animate-ping"
                        style={{ animationDuration: "2s" }}
                      />
                      <div
                        className="absolute inset-0 rounded-full bg-white/5 animate-pulse"
                        style={{ animationDuration: "1.5s" }}
                      />
                    </>
                  )}

                  <Button
                    onClick={toggleCamera}
                    size="icon"
                    className={`relative z-10 rounded-full w-20 h-20 border-4 transition-all duration-300 ${
                      isStreaming
                        ? "bg-red-500 hover:bg-red-600 border-white"
                        : "bg-white hover:bg-gray-100 border-gray-300"
                    }`}
                  >
                    {isStreaming ? (
                      <div className="w-6 h-6 bg-white rounded-sm" />
                    ) : (
                      <div className="w-8 h-8 bg-red-500 rounded-full" />
                    )}
                  </Button>

                  {/* Audio visualizer overlay */}
                  {isStreaming && (audioLevel > 0 || isModelSpeaking) && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 flex items-center space-x-1">
                        <AudioVisualizer
                          audioLevel={
                            isModelSpeaking ? outputAudioLevel : audioLevel
                          }
                          isActive={isModelSpeaking || audioLevel > 10}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center space-x-4">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={toggleFlash}
                    className={`rounded-full w-12 h-12 border-0 text-white ${
                      flashOn
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    <Zap className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={videoCanvasRef} className="hidden" />
    </div>
  );
}
