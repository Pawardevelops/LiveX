import { Base64 } from 'js-base64';
import { TranscriptionService } from './transcriptionService';
import { pcmToWav } from '../utils/audioUtils';
import { s3Upload } from '../utils/s3upload';

const MODEL = "models/gemini-2.0-flash-exp";
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const HOST = "generativelanguage.googleapis.com";
const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;



type GeminiWSOptions = {
  instructions?: string;
};

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private onMessageCallback: ((text: string) => void) | null = null;
  private onSetupCompleteCallback: (() => void) | null = null;
  private audioContext: AudioContext | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private opts: GeminiWSOptions;
  
  // Audio queue management
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlayingResponse: boolean = false;
  private onPlayingStateChange: ((isPlaying: boolean) => void) | null = null;
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private onTranscriptionCallback: ((text: string) => void) | null = null;
  private transcriptionService: TranscriptionService;
  private accumulatedPcmData: string[] = [];
  private lastImageBase64: string | null = null;
  private indexForLabel : number | 0
  private imageLables : string[] | []
  private VehicleId: string | ""
  private stopVideoRecordingAndRedirect : () => void
  private downloadBase64Image(data: string, filename: string) {
  const link = document.createElement('a');
  link.href = 'data:image/jpeg;base64,' + data;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


  constructor(
    onMessage: (text: string) => void, 
    onSetupComplete: () => void,
    onPlayingStateChange: (isPlaying: boolean) => void,
    onAudioLevelChange: (level: number) => void,
    onTranscription: (text: string) => void,
    opts: GeminiWSOptions = {},
    imageLables:string[],
    VehicleId:string,
    stopVideoRecordingAndRedirect: () => void
  ) {
    this.onMessageCallback = onMessage;
    this.onSetupCompleteCallback = onSetupComplete;
    this.onPlayingStateChange = onPlayingStateChange;
    this.onAudioLevelChange = onAudioLevelChange;
    this.onTranscriptionCallback = onTranscription;
    this.VehicleId = VehicleId;
    this.opts = opts;
    this.imageLables = imageLables
    this.indexForLabel=0
    // Create AudioContext for playback
    this.audioContext = new AudioContext({
      sampleRate: 24000  // Match the response audio rate
    });
    this.transcriptionService = new TranscriptionService();
    this.stopVideoRecordingAndRedirect = stopVideoRecordingAndRedirect
  }

  connect() {
    if (!API_KEY) {
      console.error("[WebSocket] Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY environment variable.");
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    try {
      this.ws = new WebSocket(WS_URL);
      this.connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error("[WebSocket] Connection timed out.");
          this.ws?.close();
        }
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("[WebSocket] Error creating WebSocket:", error);
      return;
    }

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.sendInitialSetup();
    };

    this.ws.onmessage = async (event) => {
      try {
        let messageText: string;
        if (event.data instanceof Blob) {
          const arrayBuffer = await event.data.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          messageText = new TextDecoder('utf-8').decode(bytes);
        } else {
          messageText = event.data;
        }
        
        await this.handleMessage(messageText);
      } catch (error) {
        console.error("[WebSocket] Error processing message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Only attempt to reconnect if we haven't explicitly called disconnect
      if (!event.wasClean && this.isSetupComplete) {
        this.reconnectAttempts++;
        const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);
        console.log(`[WebSocket] Connection closed. Reconnecting in ${delay}ms...`);
        setTimeout(() => this.connect(), delay);
      }
    };
  }

  
private sendInitialSetup() {

  const setupMessage: any = {
    setup: {
      model: MODEL,
      generation_config: {
        response_modalities: ["AUDIO"], // or ["AUDIO", "TEXT"] for text streaming too
      },
      tools: [{
        function_declarations: [
          {
            name: "sayHelloWorld",
            description: "Logs Hello world to the console.",
            parameters: { type: "object", properties: {} }
          }
        ]
      }]
    }
  };
  if (this.opts.instructions) {
    setupMessage.setup.system_instruction = {
      parts: [{ text: this.opts.instructions }]
    };
  }
  this.ws?.send(JSON.stringify(setupMessage));
}


  requestResponse(extra?: Record<string, any>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message = {
      realtime_input: {
        text: extra ? JSON.stringify(extra) : "continue",
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  sendClientEvent(name: string, data?: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const message = {
      realtime_input: {
        text: JSON.stringify({ event: name, data }),
      },
    };

    this.ws.send(JSON.stringify(message));
  }

  sendMediaChunk(b64Data: string, mimeType: string) {
    if (!this.isConnected || !this.ws || !this.isSetupComplete) return;

    const message = {
      realtime_input: {
        media_chunks: [{
          mime_type: mimeType === "audio/pcm" ? "audio/pcm" : mimeType,
          data: b64Data
        }]
      }
    };

    if (mimeType === "image/jpeg") {
      this.lastImageBase64 = b64Data;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocket] Error sending media chunk:", error);
    }
  }

  private async playAudioResponse(base64Data: string) {
    if (!this.audioContext) return;

    try {
      // Decode base64 to bytes
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert to Int16Array (PCM format)
      const pcmData = new Int16Array(bytes.buffer);
      
      // Convert to float32 for Web Audio API
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      // Add to queue and start playing if not already playing
      this.audioQueue.push(float32Data);
      this.playNextInQueue();
    } catch (error) {
      console.error("[WebSocket] Error processing audio:", error);
    }
  }

  private async playNextInQueue() {
    if (!this.audioContext || this.isPlaying || this.audioQueue.length === 0) return;

    try {
      this.isPlaying = true;
      this.isPlayingResponse = true;
      this.onPlayingStateChange?.(true);
      const float32Data = this.audioQueue.shift()!;

      // Calculate audio level
      let sum = 0;
      for (let i = 0; i < float32Data.length; i++) {
        sum += Math.abs(float32Data[i]);
      }
      const level = Math.min((sum / float32Data.length) * 100 * 5, 100);
      this.onAudioLevelChange?.(level);

      const audioBuffer = this.audioContext.createBuffer(
        1,
        float32Data.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32Data);

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);
      
      this.currentSource.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        if (this.audioQueue.length === 0) {
          this.isPlayingResponse = false;
          this.onPlayingStateChange?.(false);
        }
        this.playNextInQueue();
      };

      this.currentSource.start();
    } catch (error) {
      console.error("[WebSocket] Error playing audio:", error);
      this.isPlaying = false;
      this.isPlayingResponse = false;
      this.onPlayingStateChange?.(false);
      this.currentSource = null;
      this.playNextInQueue();
    }
  }

  private stopCurrentAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.isPlayingResponse = false;
    this.onPlayingStateChange?.(false);
    this.audioQueue = []; // Clear queue
  }

  private async handleMessage(message: string) {
    console.log("handle")
    try {
      const messageData = JSON.parse(message);
      console.log("message",messageData)
      if (messageData.setupComplete) {
        this.isSetupComplete = true;
        this.onSetupCompleteCallback?.();
        return;
      }

          if (messageData.toolCall) {
      const toolCall = messageData.toolCall;
      toolCall.functionCalls?.forEach((fc: any) => {
        if (fc.name === "sayHelloWorld") {
          console.log("Hello world");  // <-- do your side effect
          // Always respond to the tool call:
          this.ws?.send(JSON.stringify({
            toolResponse: {
              toolUseId: toolCall.id,
              response: { result: "ok" }
            }
          }));
        }
      });
    }


      // Handle audio data
      if (messageData.serverContent?.modelTurn?.parts) {
        const parts = messageData.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData?.mimeType === "audio/pcm;rate=24000") {
            this.accumulatedPcmData.push(part.inlineData.data);
            this.playAudioResponse(part.inlineData.data);
          }
        }
      }

      // Handle turn completion separately
      if (messageData.serverContent?.turnComplete === true) {
        if (this.accumulatedPcmData.length > 0) {
          try {
            const fullPcmData = this.accumulatedPcmData.join('');
            const wavData = await pcmToWav(fullPcmData, 24000);
            
            const transcription = await this.transcriptionService.transcribeAudio(
              wavData,
              "audio/wav"
            );

            console.log("Transcription", transcription);
            console.log(typeof transcription);
            
            if(transcription.toLowerCase().includes("inspection completed")){
              this.disconnect()
              this.stopVideoRecordingAndRedirect()
             
            }
            if(["good image", "captured"].some(word => transcription.toLowerCase().includes(word))){
              s3Upload(this.lastImageBase64,process.env.NEXT_PUBLIC_AWS_S3_BUCKET,`${this.VehicleId}/${this.imageLables[this.indexForLabel]}`)
              this.indexForLabel++
            }
            this.onTranscriptionCallback?.(transcription);
            this.accumulatedPcmData = []; // Clear accumulated data
          } catch (error) {
            console.error("[WebSocket] Transcription error:", error);
          }
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  }

  disconnect() {
    this.isSetupComplete = false;
    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }
    this.isConnected = false;
    this.accumulatedPcmData = [];
  }
} 