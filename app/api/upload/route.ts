import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Your original prompt
const vehicleInspectionPrompt = `**You are an AI-powered vehicle inspection expert specializing in two-wheelers.** Your task is to process vehicle images through a multi-step pipeline to identify and highlight damages and quality defects.

**Input:** An image of a two-wheeler vehicle (motorcycle, scooter, etc.) accompanied by a text label.

**Processing Pipeline:**

**Step 1: Vehicle Segmentation and Background Removal**
* Precisely identify and segment the two-wheeler vehicle from its background.
* Generate a clean version of the image where the vehicle is isolated. All subsequent analysis will be performed on this cleaned image.

**Step 2: Damage and Vehicle Quality Detection**
* Thoroughly inspect the isolated vehicle for any and all visible defects, including but not limited to:
    * **Major Damage:** Dents, deep scratches, cracks, broken parts.
    * **Minor Damage:** Light scratches, scuffs, paint chips.
    * **Quality Issues:** Rust spots, corrosion, faded paint.
* For each defect you identify, determine its precise location on the vehicle.

**Step 3: Bounding Box Generation**
* For every single defect identified in Step 2, create a bounding box that tightly encloses the affected area.

**Step 4: Final Output Generation**
* Do not generate an image. Instead, you MUST provide a JSON object as your response. Do not include any text, markdown, or explanations outside of the JSON object.
* The JSON object must contain a key named "defects", which is an array.
* Each object in the "defects" array must represent a single issue found on the vehicle.
* Each defect object must contain:
    1.  A "description" (e.g., 'Scratch on front fender', 'Dent on fuel tank').
    2.  A "boundingBox" object with the pixel coordinates: "x", "y", "width", and "height".
    3.  A "Type" field. **You MUST populate this field with the exact text label I provide with each image. For example, if the input label is "Side View Right", the "Type" field must be "Side View Right".**

**Example JSON Output:**
{
  "defects": [
    {
      "description": "Dent on fuel tank",
      "boundingBox": { "x": 450, "y": 300, "width": 80, "height": 65 },
      "Type": "front_tyre"
    },
    {
      "description": "Rust on exhaust pipe",
      "boundingBox": { "x": 700, "y": 550, "width": 120, "height": 40 },
      "Type": "right_photo"
    }
  ]
}`;

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
    s3BaseUrl + "front_tyre_gauge.png",
    s3BaseUrl + "right_photo.png",
    s3BaseUrl + "back_photo.png",
    s3BaseUrl + "back_tyre_gauge.png",
    s3BaseUrl + "left_photo.png",
    s3BaseUrl + "odometer_value.png",
  ];

  const labels = [
    "front_tyre",
    "front_tyre_gauge",
    "right_photo",
    "back_photo",
    "back_tyre_gauge",
    "left_photo",
    "odometer_value",
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
      partsWithLabel.push({ text: `Type: ${labels[i]}` });
      partsWithLabel.push(part);
    });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent([
      vehicleInspectionPrompt,
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
