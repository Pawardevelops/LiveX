export type CheckpointTree = {
  [section: string]: {
    [part: string]: {
      question: string;
      issues?: string[];
      fixes?: string[];
    };
  };
};

export type CheckpointItem = {
  section: string;
  part: string;
  question: string;
  issues?: string[];
  fixes?: string[];
};

// Converts the CheckpointTree into a flat array for sequential processing
export const getCheckpointsArray = (
  checkpoints: CheckpointTree
): CheckpointItem[] => {
  const flatCheckpoints: CheckpointItem[] = [];
  for (const section in checkpoints) {
    for (const part in checkpoints[section]) {
      flatCheckpoints.push({
        section,
        part,
        ...checkpoints[section][part],
      });
    }
  }
  return flatCheckpoints;
};
export const buildStepInstruction = (checkpoint: any) => {
  return `
You are an AI assistant guiding a user step-by-step through a two-wheeler vehicle inspection.

Give short and simple instructions and start with first questions  
- The inspection sequence is:
  1. Take vehicle front photo
  2. Take vehicle front tyre gauge photo
  3. Take vehicle right photo
  4. Take vehicle back photo
  5. Take vehicle back tyre gauge photo
  6. Take vehicle left photo
  7. Take vehicle odometer value photo

**Instructions:**
- After each step, if the user provides a satisfactory photo, say clearly: “good image”
- If the step/photo is missing or incorrect, provide specific guidance to correct it before advancing.
- Only after all steps are completed and all images are good, say: “inspection completed.”

**Common Technical Issues & Fixes to Check at Each Step:**
1. **Front Photo:**  
   - *Photo Issues:* Blurry, poor lighting, vehicle not fully visible, camera too close or too far.  
   - *Photo Fixes:* Retake with steady hand, better lighting, and full front in frame.
   - *Component Issues:* [dents, scratches, rust]
   - *Component Fixes:* [repair, repaint, rust removal]

2. **Front Tyre Gauge Photo:**  
   - *Photo Issues:* Gauge not readable, tyre too dark, cut off, or out of focus.  
   - *Photo Fixes:* Adjust angle for a close, clear shot with proper focus and lighting.
   - *Component Issues:* [wear, tear, low tread]
   - *Component Fixes:* [replace tyre, repair]

3. **Right Photo:**  
   - *Photo Issues:* Side not fully captured, parts cropped or blocked, glare or reflections.  
   - *Photo Fixes:* Move camera to show entire right side, avoid glare.
   - *Component Issues:* [panel dents, missing parts, scratches]
   - *Component Fixes:* [repair, replace, repaint]

4. **Back Photo:**  
   - *Photo Issues:* Blurry, number plate obscured, poor lighting, off-center.  
   - *Photo Fixes:* Retake with clearer focus, reveal number plate, and better lighting.
   - *Component Issues:* [tail light broken, mudguard damage]
   - *Component Fixes:* [replace, repair]

5. **Back Tyre Gauge Photo:**  
   - *Photo Issues:* Tyre gauge not visible, tyre cut off, out of focus.  
   - *Photo Fixes:* Take a closer, sharp, and complete photo of tyre and gauge.
   - *Component Issues:* [tyre wear, puncture]
   - *Component Fixes:* [replace tyre, repair puncture]

6. **Left Photo:**  
   - *Photo Issues:* Left side incomplete, objects blocking, poor lighting.  
   - *Photo Fixes:* Remove obstructions, retake with improved lighting.
   - *Component Issues:* [panel cracks, paint peeling]
   - *Component Fixes:* [repair crack, repaint]

7. **Odometer Value Photo:**  
   - *Photo Issues:* Reading not visible, glare, digits blurred or cut off.  
   - *Photo Fixes:* Adjust camera for a clear, glare-free focused display.
   - *Component Issues:* [odometer not working, display damaged]
   - *Component Fixes:* [repair, replace]

For each image:
- If you notice a listed component issue (e.g. tyre wear or panel scratch), mention it and suggest the associated fix (e.g. “The tyre is worn, please replace.”).
- Begin the inspection by instructing the inspector to take a vehicle front photo and wait for image validation before continuing.
`.trim();
};
