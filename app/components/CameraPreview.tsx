// app/components/CameraPreview.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Video, VideoOff, Zap, RefreshCcw, MessageSquareText, X } from "lucide-react";
import { GeminiWebSocket } from '../services/geminiWebSocket';
import { Base64 } from 'js-base64';
import { s3UploadVideo } from '../utils/s3upload';

import { buildStepInstruction, CheckpointTree } from "../prompts/inspector";



const INSTRUCTIONS = buildStepInstruction(null);


interface CameraPreviewProps {
  onTranscription: (text: string) => void;
  onToggleChat?: () => void; // toggle chat sidebar/drawer
}

type FacingMode = "user" | "environment";

export default function CameraPreview({ onTranscription, onToggleChat }: CameraPreviewProps) {
  const router = useRouter();
  const [count,setCount]= useState(0)

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);          // 0..100 input level
  const [outputAudioLevel, setOutputAudioLevel] = useState(0); // 0..100 TTS level
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);

  const geminiWsRef = useRef<GeminiWebSocket | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null)

  const [isAudioSetup, setIsAudioSetup] = useState(false);
  const setupInProgressRef = useRef(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Facing + torch state
  const [facing, setFacing] = useState<FacingMode>("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [slowMode, setSlowMode] = useState(true);      // NEW: start slower
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
    geminiWsRef.current?.sendClientEvent("pace", { mode: slowMode ? "slow" : "normal" });
  }, [slowMode]);

  // --- Smooth audio level for pulse UI (0..1) ---
  const [smoothLevel, setSmoothLevel] = useState(0);
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const raw = (isModelSpeaking ? outputAudioLevel : audioLevel) / 100; // 0..1
      setSmoothLevel(prev => prev + (raw - prev) * 0.15); // eased
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
      stream.getTracks().forEach(track => track.stop());
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
      const url = await s3UploadVideo(blob, process.env.NEXT_PUBLIC_AWS_S3_BUCKET || "", (new URLSearchParams(window.location.search).get("vehicleId") || ""), "walkaround");

      window.location.assign("/vehicles?v=success")
    };

  };

  const stopVideoRecordingAndRedirect = () => {
    if(mediaRecorderRef.current){
       mediaRecorderRef.current?.stop();
    }
  }

  const getMedia = async (mode: FacingMode) => {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    startVideoRecording(videoStream)

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
      videoRef.current.muted = true;      // avoid acoustic echo
      (videoRef.current as any).playsInline = true;
    }

    setStream(combined);
    return combined;
  };

  const startMedia = async (mode: FacingMode) => {
    try {
      // Create/resume AudioContext on user gesture (iOS)
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        audioContextRef.current = new Ctx({ sampleRate: 16000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const media = await getMedia(mode);
      setIsStreaming(true);
      setFlashOn(false); // reset torch state on fresh start
      return media;
    } catch (err) {
      console.error('Error accessing media devices:', err);
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

    const caps: any = (videoTrack.getCapabilities && videoTrack.getCapabilities()) || {};
    if (!("torch" in caps)) {
      setFlashOn(v => !v);
      alert("Torch/flash is not supported on this device or browser.");
      return;
    }

    try {
      await videoTrack.applyConstraints({ advanced: [{ torch: !flashOn }] as any });
      setFlashOn(v => !v);
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


  const handleTranscription = useCallback((text: string) => {
    const normalise = (s: string) => s.toLowerCase();
    const t = normalise(text);
    // tyer/tyre/tire variants
    if (/(front).*(tyre|tire|tyer)/.test(t)) {
      geminiWsRef.current?.sendClientEvent("user_asserts_view", { section: "front", item: "tyre" });
    }
    if (/(rear|back).*(tyre|tire|tyer)/.test(t)) {
      geminiWsRef.current?.sendClientEvent("user_asserts_view", { section: "back", item: "tyre" });
    }
    // then keep your existing message handling
    onTranscription(text);
  }, [onTranscription]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isStreaming) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    const ws = new GeminiWebSocket(
      (text) => { /* optional streaming text */ },
      () => {
        setIsWebSocketReady(true);
        setConnectionStatus('connected');
      },
      (isPlaying) => setIsModelSpeaking(isPlaying),
      (level) => setOutputAudioLevel(level),
      handleTranscription,
      { instructions: INSTRUCTIONS },
      ["front_tyer","front_tyre_gauge","right_photo","back_photo","back_tyre_gauge","left_photo","odometer_value"],
      (new URLSearchParams(window.location.search).get("vehicleId") || ""),
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
      setConnectionStatus('disconnected');
    };
  }, [isStreaming, onTranscription, cleanupWebSocket]);

  // Start image capture only after WebSocket is ready
  useEffect(() => {
    if (!isStreaming || !isWebSocketReady) return;

    const captureAndSendImage = () => {
      if (!videoRef.current || !videoCanvasRef.current || !geminiWsRef.current) return;
      const canvas = videoCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = videoRef.current.videoWidth || 640;
      const h = videoRef.current.videoHeight || 360;
      canvas.width = w;
      canvas.height = h;

      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const b64Data = imageData.split(',')[1];

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
    if (!audioContextRef.current || isAudioSetup || setupInProgressRef.current) return;

    let isActive = true;
    setupInProgressRef.current = true;

    const setupAudioProcessing = async () => {
      try {
        const ctx = audioContextRef.current!;
        if (ctx.state === 'suspended') await ctx.resume();

        // Ensure this file exists in /public/worklets/audio-processor.js
        await ctx.audioWorklet.addModule('/worklets/audio-processor.js');
        if (!isActive) return;

        const node = new AudioWorkletNode(ctx, 'audio-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          processorOptions: { sampleRate: 16000, bufferSize: 4096 },
          channelCount: 1,
          channelCountMode: 'explicit',
          channelInterpretation: 'speakers',
        });
        audioWorkletNodeRef.current = node;

        const source = ctx.createMediaStreamSource(stream);
        node.port.onmessage = (event) => {
          if (!isActive || isModelSpeaking) return;
          const { pcmData, level } = event.data;
          if (typeof level === 'number') setAudioLevel(level); // 0..100
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
    <div className="relative h-full w-full">
      {/* Close (X) button */}
      <div className="absolute top-3 left-3 z-20">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleClose}
          className="rounded-full bg-white/80 hover:bg-white shadow-sm"
          title="Close"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-800" />
        </Button>
      </div>

      {/* Video container (full camera screen) */}
      <div className="relative h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full aspect-video bg-black  overflow-hidden object-cover h-full"
        />

        {/* Connection Status Overlay */}
        {isStreaming && connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto" />
              <p className="text-white font-medium">
                {connectionStatus === 'connecting' ? 'Connecting to Gemini...' : 'Disconnected'}
              </p>
              <p className="text-white/70 text-sm">
                Please wait while we establish a secure connection
              </p>
            </div>
          </div>
        )}

        {/* Top-right overlay controls: flip, flash, text */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={flipCamera}
            className="rounded-full bg-white/80 hover:bg-white shadow-sm"
            title="Flip camera"
          >
            <RefreshCcw className="h-5 w-5 text-gray-800" />
          </Button>

          <Button
            size="icon"
            variant="secondary"
            onClick={toggleFlash}
            className={`rounded-full shadow-sm ${flashOn ? 'bg-yellow-400 hover:bg-yellow-500' : 'bg-white/80 hover:bg-white'}`}
            title="Toggle flash"
          >
            <Zap className={`h-5 w-5 ${flashOn ? 'text-black' : 'text-gray-800'}`} />
          </Button>

          {onToggleChat && (
            <Button
              size="icon"
              variant="secondary"
              onClick={onToggleChat}
              className="rounded-full bg-white/80 hover:bg-white shadow-sm"
              title="Show text chat"
            >
              <MessageSquareText className="h-5 w-5 text-gray-800" />
            </Button>
          )}
        </div>

        {/* Center toggle button with PULSE overlay (floats above video) */}
        {/* Bottom control dock (pulse + actions) */}
<div className="absolute inset-x-0 bottom-4 px-4 z-20">
  <div className="mx-auto w-full max-w-2xl rounded-full bg-black/35 border border-white/10 shadow-xl backdrop-blur-md">
    <div className="flex items-center justify-between px-3 py-2">
      
      {/* Left: Repeat / Skip */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRepeat}
          className="h-10 rounded-full bg-white/85 hover:bg-white text-gray-900"
          title="Repeat the last instruction"
        >
          <span className="hidden xs:inline">Repeat</span>
          <span className="xs:hidden">↻</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleSkip}
          className="h-10 rounded-full bg-white/85 hover:bg-white text-gray-900"
          title="Skip this checkpoint"
        >
          <span className="hidden xs:inline">Skip</span>
          <span className="xs:hidden">⤼</span>
        </Button>
      </div>

      {/* Center: Start/Stop with pulse */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {isStreaming && (
          <>
            <div
              className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/25 blur-md transition-transform duration-150"
              style={{ transform: `scale(${1 + smoothLevel * 0.9})` }}
            />
            <div
              className="pointer-events-none absolute inset-0 m-2 rounded-full bg-blue-500/35 blur-md transition-transform duration-150"
              style={{ transform: `scale(${1 + smoothLevel * 0.6})` }}
            />
            <div
              className="pointer-events-none absolute inset-0 m-4 rounded-full bg-blue-500/70 shadow-[0_0_30px_rgba(59,130,246,0.60)] transition-transform duration-150"
              style={{ transform: `scale(${1 + smoothLevel * 0.3})` }}
            />
          </>
        )}

        <Button
          onClick={toggleCamera}
          size="icon"
          className={`relative z-10 rounded-full w-16 h-16 backdrop-blur-sm transition-colors
            ${isStreaming
              ? 'bg-red-500/90 hover:bg-red-500 text-white'
              : 'bg-emerald-500/90 hover:bg-emerald-500 text-white'
            }`}
          title={isStreaming ? "Stop" : "Start"}
          aria-label={isStreaming ? "Stop camera" : "Start camera"}
        >
          {isStreaming ? <VideoOff className="h-7 w-7" /> : <Video className="h-7 w-7" />}
        </Button>
      </div>

      {/* Right: Slow toggle / Next */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setSlowMode(v => !v)}
          aria-pressed={slowMode}
          className={`h-10 rounded-full text-gray-900 ${
            slowMode
              ? 'bg-amber-300 hover:bg-amber-400'
              : 'bg-white/85 hover:bg-white'
          }`}
          title="Toggle slow, step-by-step coaching"
        >
          <span
            className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${
              slowMode ? 'bg-emerald-700' : 'bg-gray-400'
            }`}
          />
          <span className="hidden xs:inline">Slow</span>
          <span className="xs:hidden">S</span>
        </Button>

        <Button
          size="sm"
          onClick={handleNext}
          className="h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5"
          title="Proceed to next checkpoint"
        >
          <span className="hidden xs:inline">Next</span>
          <span className="xs:hidden">→</span>
        </Button>
      </div>

    </div>
  </div>
</div>



      </div>

      <canvas ref={videoCanvasRef} className="hidden" />
    </div>
  );
}
