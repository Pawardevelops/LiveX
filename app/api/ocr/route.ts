import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Your original prompt
const vehicleInspectionPrompt = `You are an assistant that analyzes vehicle inspection transcripts. 
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

remember the vehicleId is 
`;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

// NEW HELPER: Fetches a URL and converts it to a Gemini Part
async function urlToGenerativePart(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from ${url}. Status: ${response.status}`
      );
    }
    const mimeType = response.headers.get("content-type");
    if (!mimeType) {
      throw new Error(`Could not determine MIME type for URL: ${url}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  } catch (error) {
    console.error(`Error processing URL ${url}:`, error);
    // Depending on your use case, you might want to return null or re-throw
    throw error;
  }
}

export const GET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const vehicleId = searchParams.get("vehicleId");

  if (!vehicleId) {
    return NextResponse.json(
      { success: false, error: "vehicleId query parameter is required" },
      { status: 400 }
    );
  }

  // Construct the full S3 URLs for your images
  const s3BaseUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.amazonaws.com/${vehicleId}/`;
  const imageUrls = [
    s3BaseUrl + "front_tyre.png",
    s3BaseUrl + "right_photo.png",
    s3BaseUrl + "odometer_value.png",
  ];

  const labels = [
    "Find the registration number of two wheeler",
    "This is Right two wheeler image",
    "Find the odo meter value",
  ];
  const partsWithLabel = [];
  try {
    // We no longer need formData since we are not uploading files
    // const formData = await req.formData();

    // Convert all image URLs to Gemini parts
    const parts = await Promise.all(
      imageUrls.map((url) => urlToGenerativePart(url))
    );

    parts.forEach((part, i) => {
      partsWithLabel.push({ text: labels[i] });
      partsWithLabel.push(part);
    });

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash-exp",
    });

    const result = await model.generateContent([
      vehicleInspectionPrompt + vehicleId,
      ...partsWithLabel,
    ]);

    return NextResponse.json({
      success: true,
      analysis: result.response.text(),
    });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
};
