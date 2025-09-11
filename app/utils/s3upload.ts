// s3Upload.ts

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Uploads a base64 image to S3 in the {vehicleId}/images($i) folder structure.
 * @param base64Image - The base64 string (with or without 'data:image/...' prefix)
 * @param bucket - Name of the S3 bucket
 * @param vehicleId - The vehicle ID to use as the folder name
 * @returns Promise<string> - The public S3 URL of the uploaded file
 */
export async function s3Upload(
  base64Image: any,
  bucket: any,
  vehicleId: any,

): Promise<string> {
  // Extract mime type and base64 data
  let mime = "image/png";
  let base64Data = base64Image;
  if (base64Image.startsWith("data:")) {
    const matches = base64Image.match(/^data:(.*?);base64,(.*)$/);
    if (matches) {
      mime = matches[1];
      base64Data = matches[2];
    }
  }

  const buffer = Buffer.from(base64Data, "base64");


  // Set extension based on mime type
  const fileExtension = mime.split("/")[1] || "png";
  const key = `${vehicleId}.${fileExtension}`;

  // Create S3 client
  const s3 = new S3Client({
    region:  process.env.NEXT_PUBLIC_AWS_REGION || "",
    credentials: {
      accessKeyId:process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
    },
  });


  // Prepare upload command
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mime,
    ContentEncoding: "base64",
  });

  await s3.send(command);
  console.log("uploaded!!!",key)
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}


export async function s3UploadVideo(
  videoBlob: Blob,
  bucket: string,
  vehicleId: string,
  videoName?: string
): Promise<string> {
  // Get the file extension and MIME type
  const mime = videoBlob.type || "video/mp4";
  const ext = mime.split("/")[1] || "mp4";

  // Read the blob to ArrayBuffer, then Buffer for S3
  const arrayBuffer = await videoBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use provided videoName or generate one
  const safeName = videoName ? videoName.replace(/\s+/g, '_') : Date.now().toString();
  const key = `${vehicleId}/videos/${safeName}.${ext}`;

  // Create S3 client
  const s3 = new S3Client({
    region:  process.env.NEXT_PUBLIC_AWS_REGION || "",
    credentials: {
      accessKeyId:process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "",
    },
  });

  // Prepare command
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mime
  });

  await s3.send(command);
  console.log("Video uploaded!", key);
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}
