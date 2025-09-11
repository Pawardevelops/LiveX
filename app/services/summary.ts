import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);
const MODEL_NAME = "models/gemini-2.0-flash-exp";

export class DetailService {
  private model;
  constructor() {
    this.model = genAI.getGenerativeModel({ model: MODEL_NAME });
  }

  async summary(id: any): Promise<string> {
    try {
      const transcription = localStorage.getItem("transcription") || ``;

      if (!transcription.trim()) {
        return "No transcription available to summarize.";
      }

      const result = await this.model.generateContent([
        { text: transcription },
        {
          text: `You are an assistant that analyzes vehicle inspection transcripts. 
Your task is to produce ONLY a valid JSON object in the following structure:

{
  "details": {
    "vehicle": {
      "vehicleId": "<vehicle-id>",
      "make": "<make>",
      "model": "<model>",
      "year": <year>,
      "color": "<color>"
    },
    "inspection": {
      "inspectionStartTime": "<ISO timestamp>",
      "inspectionEndTime": "<ISO timestamp or null>",
      "status": "<pending | completed>",
      "summary": "<70 to 100 words detailed summary of the inspection transcript>"
    }
  },
  "condition": {
    "vehicleCondition": {
      "front": "<good | bad>",
      "back": "<good | bad>",
      "right": "<good | bad>",
      "lights": "<good | bad>",
      "odometer": "<good | bad>",
      "extras": {
        "<issueName>": "<description>",
        "<issueName>": "<description>"
      },
      "recommendation": [
        "<recommendation 1>",
        "<recommendation 2>"
      ]
    },
    "inspectionCondition": {
      "inspectionCompleted": <true | false>
    }
  }
}

### Rules:
1. Always output ONLY JSON, never explanations. 
2. Inspection status:
   - If the transcript contains "inspection completed" or a similar phrase, set status = "completed" and inspectionCompleted = true.
   - Otherwise, set status = "pending" and inspectionCompleted = false.
3. Summarize the transcript into 70-100 words for "summary".
4. Normalize all vehicle condition values to either "good" or "bad". Treat "ok" or "working" as "good".
5. Put any other identified issues into "extras" as key-value pairs.
6. In "recommendation", provide actionable suggestions about the bike condition.
7. Use proper JSON (no trailing commas, no comments).

remember the vehicleId is ${id}
`,
        },
      ]);

      const txt = result.response.text();
      localStorage.removeItem(`transcription`);
      localStorage.setItem(`T_${id}`, txt);
      return txt;
    } catch (error) {
      console.error("Summary generation error:", error);
      throw error;
    }
  }
}
