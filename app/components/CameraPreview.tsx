// app/components/CameraPreview.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Video, VideoOff, Zap, RefreshCcw, MessageSquareText, X } from "lucide-react";
import { GeminiWebSocket } from '../services/geminiWebSocket';
import { Base64 } from 'js-base64';

import { buildInspectorInstructions, CheckpointTree } from "../prompts/inspector";

// Example checkpoints (replace with your real data)
// ----------------- YOUR (packed) CHECKPOINTS -----------------

const CHECKPOINTS: CheckpointTree = {
  front: {
    tyre: {
      question: "Show the front tyre tread and sidewall, close-up, then a wide shot.",
      issues: [
        "tyre is worn out (tread below wear markers)",
        "uneven/feathered wear",
        "sidewall cuts or bulges",
        "embedded nails or objects",
        "low pressure",
        "no issues"
      ],
      fixes: [
        "replace front tyre",
        "balance and align front wheel",
        "remove debris and patch/replace as needed",
        "inflate to recommended PSI",
        "check fork alignment if wear is uneven",
        "no fixes required"
      ]
    },
    rim_spokes: {
      question: "Rotate the front wheel and show the rim edge and spokes (if spoked).",
      issues: [
        "bent rim",
        "loose or missing spokes",
        "cracks near spoke nipples",
        "corrosion on rim/spokes",
        "no issues"
      ],
      fixes: [
        "true or replace rim",
        "tighten/replace spokes and re-true wheel",
        "repair cracks or replace wheel",
        "clean and protect with anti-corrosion spray",
        "no fixes required"
      ]
    },
    axle_bearing: {
      question: "Rock the front wheel side-to-side and spin it; show for play or roughness.",
      issues: [
        "excessive lateral play",
        "gritty/rough rotation noise",
        "leaking or missing seals",
        "no issues"
      ],
      fixes: [
        "replace front wheel bearings",
        "install new seals",
        "re-grease and torque to spec",
        "no fixes required"
      ]
    },
    brakes_disc_caliper: {
      question: "Show front brake disc thickness and caliper pads; squeeze lever for feel.",
      issues: [
        "pads worn below minimum",
        "disc scoring or warping",
        "caliper binding",
        "brake fluid leak",
        "spongy lever",
        "no issues"
      ],
      fixes: [
        "replace pads; clean and grease pins",
        "resurface/replace disc",
        "service caliper (clean, new seals)",
        "fix leak and bleed system",
        "bleed brakes; replace fluid",
        "no fixes required"
      ]
    },
    forks_suspension: {
      question: "Show fork tubes for leaks/pitting; compress front suspension a few times.",
      issues: [
        "fork oil seal leak",
        "pitted/chipped stanchions",
        "excessive dive or rebound",
        "uneven fork alignment",
        "no issues"
      ],
      fixes: [
        "replace fork seals and oil",
        "refinish/replace stanchions",
        "set correct oil weight/springs",
        "realign front end and torque to spec",
        "no fixes required"
      ]
    },
    headlight: {
      question: "Turn on low and high beam; show beam alignment on a wall.",
      issues: [
        "bulb not working",
        "flicker/poor connection",
        "beam misaligned",
        "lens hazy or cracked",
        "no issues"
      ],
      fixes: [
        "replace bulb or connector",
        "repair wiring/ground",
        "adjust headlight alignment screws",
        "polish or replace lens",
        "no fixes required"
      ]
    },
    indicators_front: {
      question: "Activate left and right front indicators and hazards; show both sides.",
      issues: [
        "indicator not flashing",
        "hyper-flash (incorrect rate)",
        "damaged lens",
        "loose stalk/mount",
        "no issues"
      ],
      fixes: [
        "replace bulb/LED module",
        "fit correct relay/resistors",
        "replace lens assembly",
        "tighten or replace mount",
        "no fixes required"
      ]
    },
    horn: {
      question: "Press the horn; hold for two seconds.",
      issues: [
        "horn weak or silent",
        "intermittent horn",
        "wiring/ground issue",
        "no issues"
      ],
      fixes: [
        "adjust horn screw or replace horn",
        "clean switch contacts",
        "repair wiring/ground and fuse",
        "no fixes required"
      ]
    },
    controls_handlebar: {
      question: "Show throttle free play, front brake lever travel, and switchgear operation.",
      issues: [
        "excessive throttle free play",
        "sticky throttle return",
        "damaged switches",
        "loose lever or perch",
        "no issues"
      ],
      fixes: [
        "adjust throttle cables",
        "lubricate/replace throttle cables",
        "repair/replace switches",
        "tighten or replace lever assembly",
        "no fixes required"
      ]
    },
    front_mudguard: {
      question: "Show front mudguard/fender mounting points and clearance.",
      issues: [
        "cracked/broken mounts",
        "rubbing on tyre",
        "loose bolts",
        "no issues"
      ],
      fixes: [
        "replace/repair mudguard",
        "realign for clearance",
        "tighten/replace fasteners",
        "no fixes required"
      ]
    }
  },

  back: {
    tyre: {
      question: "Show rear tyre tread/sidewall; rotate to check embedded objects.",
      issues: [
        "tyre worn flat in center",
        "sidewall damage",
        "puncture/embedded object",
        "under-inflation",
        "no issues"
      ],
      fixes: [
        "replace tyre",
        "patch/plug if applicable; otherwise replace",
        "inflate to spec",
        "check alignment and load settings",
        "no fixes required"
      ]
    },
    rim_spokes: {
      question: "Spin rear wheel; show rim runout and spoke condition (if spoked).",
      issues: [
        "rim out of true",
        "loose/missing spokes",
        "cracks/corrosion",
        "no issues"
      ],
      fixes: [
        "true or replace rim",
        "retension/replace spokes",
        "repair cracks or replace wheel",
        "no fixes required"
      ]
    },
    axle_bearing: {
      question: "Rock the rear wheel side-to-side; listen while spinning for roughness.",
      issues: [
        "bearing play",
        "rough/gritty feel",
        "seal leakage",
        "no issues"
      ],
      fixes: [
        "replace rear wheel bearings",
        "install new seals",
        "grease and torque axle nut",
        "no fixes required"
      ]
    },
    brakes_rear: {
      question: "Show rear brake pads/shoes and disc/drum; press pedal for travel.",
      issues: [
        "pads/shoes worn out",
        "disc scoring/warping",
        "dragging brake",
        "soft pedal",
        "no issues"
      ],
      fixes: [
        "replace pads/shoes",
        "resurface/replace disc",
        "service caliper/wheel cylinder",
        "bleed system; replace fluid",
        "no fixes required"
      ]
    },
    chain_sprocket: {
      question: "Show chain slack at mid-span; show front and rear sprocket teeth close-up.",
      issues: [
        "excessive chain slack",
        "tight spots/rust",
        "hooked or sharp sprocket teeth",
        "dry/dirty chain",
        "no issues"
      ],
      fixes: [
        "adjust chain slack to spec",
        "clean and lube chain",
        "replace chain and sprockets as a set",
        "check alignment and cush drive",
        "no fixes required"
      ]
    },
    swingarm_shocks: {
      question: "Show swingarm for play/cracks; show rear shocks for leaks and preload.",
      issues: [
        "swingarm bearing play",
        "shock oil leak",
        "weak damping",
        "broken preload adjuster",
        "no issues"
      ],
      fixes: [
        "replace swingarm bearings",
        "rebuild/replace shocks",
        "set preload and damping to spec",
        "replace adjuster hardware",
        "no fixes required"
      ]
    },
    tail_brake_light: {
      question: "Press the brakes; show tail and brake light brightness and response.",
      issues: [
        "brake light not working",
        "dim output",
        "late activation",
        "cracked lens",
        "no issues"
      ],
      fixes: [
        "replace bulb/LED unit",
        "clean connectors/ground",
        "adjust brake light switch",
        "replace lens/assembly",
        "no fixes required"
      ]
    },
    indicators_rear: {
      question: "Activate rear indicators and hazards; show both sides working.",
      issues: [
        "bulb/LED failure",
        "hyper-flash",
        "damaged housing",
        "loose mount",
        "no issues"
      ],
      fixes: [
        "replace bulb/LED",
        "fit proper relay/resistors",
        "replace housing",
        "tighten or replace bracket",
        "no fixes required"
      ]
    },
    number_plate_mount: {
      question: "Show number plate bracket, light, and fasteners.",
      issues: [
        "loose/missing bolts",
        "plate light not working",
        "cracked bracket",
        "no issues"
      ],
      fixes: [
        "tighten/replace hardware",
        "replace lamp/bulb",
        "replace bracket",
        "no fixes required"
      ]
    }
  },

  right_side: {
    exhaust_system: {
      question: "Show exhaust header to muffler joints, hangers, and heat shields (right side).",
      issues: [
        "leak at joints (soot marks)",
        "loose/broken hanger",
        "heat shield rattle",
        "dent or corrosion",
        "no issues"
      ],
      fixes: [
        "replace gaskets/clamps",
        "tighten/replace hanger",
        "tighten/replace shield hardware",
        "repair/replace section",
        "no fixes required"
      ]
    },
    brake_pedal_freeplay: {
      question: "Show rear brake pedal free play and return; press and release slowly.",
      issues: [
        "no free play (dragging)",
        "excessive travel",
        "sticky return",
        "worn pedal bush",
        "no issues"
      ],
      fixes: [
        "adjust pedal free play to spec",
        "bleed/service rear brake",
        "lubricate/replace return spring",
        "replace pedal bushings",
        "no fixes required"
      ]
    },
    engine_casing_right: {
      question: "Show right engine covers (clutch/ignition) for leaks or cracks.",
      issues: [
        "oil seep/leak",
        "cracked cover",
        "missing bolts",
        "damaged gasket",
        "no issues"
      ],
      fixes: [
        "replace gasket/seal",
        "replace/repair cover",
        "install missing hardware with threadlocker",
        "torque to spec",
        "no fixes required"
      ]
    },
    throttle_cable: {
      question: "Twist throttle and release; show free play at grip and smooth return.",
      issues: [
        "excessive free play",
        "sticking throttle",
        "frayed cable",
        "dry cable housing",
        "no issues"
      ],
      fixes: [
        "adjust free play",
        "lubricate/replace cable",
        "inspect/replace throttle tube",
        "route correctly; check bar end",
        "no fixes required"
      ]
    },
    radiator_coolant_reservoir: {
      question: "If liquid-cooled, show radiator fins and coolant reservoir level/condition.",
      issues: [
        "low coolant level",
        "leaks at hoses",
        "bent/blocked fins",
        "old/dirty coolant",
        "no issues"
      ],
      fixes: [
        "top-up to mark with correct coolant",
        "replace clamps/hoses",
        "straighten/clean fins",
        "flush and refill",
        "no fixes required"
      ]
    },
    body_panels_right: {
      question: "Show right fairings/panels and mounting points.",
      issues: [
        "cracked panel",
        "missing/loose clips",
        "mismatched paint",
        "rubbing marks",
        "no issues"
      ],
      fixes: [
        "repair/replace panel",
        "fit new clips/fasteners",
        "touch-up or repaint",
        "realign panel gaps",
        "no fixes required"
      ]
    },
    mirror_right: {
      question: "Show right mirror housing and mount; adjust to show movement.",
      issues: [
        "loose mount",
        "cracked mirror",
        "vibration blur",
        "no issues"
      ],
      fixes: [
        "tighten/replace mount",
        "replace mirror",
        "add anti-vibration washer",
        "no fixes required"
      ]
    },
    footpeg_bracket_right: {
      question: "Show rider/pillion right footpegs and brackets; fold and release.",
      issues: [
        "loose bracket",
        "stiff hinge",
        "rubber worn",
        "no issues"
      ],
      fixes: [
        "tighten/replace hardware",
        "clean and lube hinge",
        "replace rubber/peg",
        "no fixes required"
      ]
    },
    wiring_right: {
      question: "Show visible wiring/loom on right side for chafing or exposed wires.",
      issues: [
        "chafed insulation",
        "loose connectors",
        "aftermarket splices",
        "no issues"
      ],
      fixes: [
        "insulate with heat-shrink/tape",
        "secure connectors",
        "proper solder/connector repair",
        "no fixes required"
      ]
    }
  },

  left_side: {
    gear_shifter: {
      question: "Show gear shifter linkage; move through gears with engine off.",
      issues: [
        "excessive play",
        "bent lever",
        "stiff linkage",
        "loose pinch bolt",
        "no issues"
      ],
      fixes: [
        "tighten/replace linkage joints",
        "straighten/replace lever",
        "clean and lube pivots",
        "torque pinch bolt",
        "no fixes required"
      ]
    },
    clutch_lever_freeplay: {
      question: "Show clutch lever free play; pull and release to check smoothness.",
      issues: [
        "no free play (slip risk)",
        "excess free play (drag)",
        "frayed cable",
        "stiff lever",
        "no issues"
      ],
      fixes: [
        "adjust free play to spec",
        "replace/lube cable",
        "service lever pivot",
        "check clutch actuation",
        "no fixes required"
      ]
    },
    engine_casing_left: {
      question: "Show left engine covers (stator/front sprocket) for leaks and damage.",
      issues: [
        "oil leak at sprocket seal",
        "dirty/loose front sprocket",
        "cracked cover",
        "missing bolts",
        "no issues"
      ],
      fixes: [
        "replace sprocket seal",
        "clean and torque sprocket; replace lock tab",
        "repair/replace cover",
        "install/torque bolts",
        "no fixes required"
      ]
    },
    chain_guard_alignment: {
      question: "Show chain guard and alignment marks on swingarm.",
      issues: [
        "chain rubbing guard",
        "misaligned axle",
        "missing guard fasteners",
        "no issues"
      ],
      fixes: [
        "realign rear axle to marks",
        "adjust chain line",
        "tighten/replace fasteners",
        "no fixes required"
      ]
    },
    battery_compartment: {
      question: "Open left cover (if applicable) and show battery terminals and hold-down.",
      issues: [
        "loose terminals",
        "corrosion on posts",
        "battery not secured",
        "low voltage symptoms",
        "no issues"
      ],
      fixes: [
        "tighten terminals",
        "clean and apply dielectric grease",
        "secure battery strap",
        "charge/test or replace battery",
        "no fixes required"
      ]
    },
    side_stand_switch: {
      question: "Show side stand, switch wiring, and spring; deploy and retract.",
      issues: [
        "weak/broken spring",
        "faulty side-stand switch",
        "loose pivot",
        "stand scraping ground",
        "no issues"
      ],
      fixes: [
        "replace spring",
        "test/replace switch; repair wiring",
        "grease/tighten pivot bolt",
        "adjust or replace stand",
        "no fixes required"
      ]
    },
    body_panels_left: {
      question: "Show left fairings/panels and gaps at joins.",
      issues: [
        "cracks/scratches",
        "loose/missing clips",
        "panel misalignment",
        "no issues"
      ],
      fixes: [
        "repair/replace panel",
        "fit new clips",
        "realign and tighten",
        "no fixes required"
      ]
    },
    mirror_left: {
      question: "Show left mirror housing and mount; check for play.",
      issues: [
        "loose mount",
        "cracked glass",
        "wobbles at speed",
        "no issues"
      ],
      fixes: [
        "tighten/replace mount",
        "replace mirror",
        "fit anti-vibration hardware",
        "no fixes required"
      ]
    },
    wiring_left: {
      question: "Show visible wiring/loom on left side near battery/ECU area.",
      issues: [
        "exposed wires",
        "loose connectors",
        "poor aftermarket joins",
        "no issues"
      ],
      fixes: [
        "insulate/heat-shrink",
        "seat and secure connectors",
        "redo joins with proper crimps",
        "no fixes required"
      ]
    },
    fuel_pet_cock: {
      question: "If applicable, show fuel tap/petcock and hoses for leaks or cracks.",
      issues: [
        "fuel seep/leak",
        "cracked hose",
        "stiff or stuck tap",
        "no issues"
      ],
      fixes: [
        "replace tap gasket or unit",
        "replace fuel hose and clamps",
        "service/lubricate tap",
        "no fixes required"
      ]
    }
  }
};

const INSTRUCTIONS = buildInspectorInstructions(CHECKPOINTS);


interface CameraPreviewProps {
  onTranscription: (text: string) => void;
  onToggleChat?: () => void; // toggle chat sidebar/drawer
}

type FacingMode = "user" | "environment";

export default function CameraPreview({ onTranscription, onToggleChat }: CameraPreviewProps) {
  const router = useRouter();

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

  const getMedia = async (mode: FacingMode) => {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

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
      { instructions: INSTRUCTIONS }                 // <-- NEW
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
