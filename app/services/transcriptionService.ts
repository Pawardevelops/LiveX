import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const MODEL_NAME = "models/gemini-2.0-flash-exp";

export class TranscriptionService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async transcribeAudio(
    audioBase64: string,
    mimeType: string = "audio/wav"
  ): Promise<string> {
    try {
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: audioBase64,
          },
        },
        {
          text: "Please transcribe the spoken language in this audio accurately. Ignore any background noise or non-speech sounds.",
        },
      ]);

      const txt = result.response.text();
      const prev = localStorage.getItem("transcription") || "";

      const updated = prev ? `${prev}\n${txt}` : txt;

      localStorage.setItem("transcription", updated);

      return txt;
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  }
}
