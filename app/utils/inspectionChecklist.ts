import { CheckpointTree } from '../prompts/inspector';

export const inspectionChecklist: CheckpointTree = {
  "Exterior": {
    "Front Tyre": {
      question: "Please describe the condition of the front tyre tread and sidewall.",
      issues: ["Low tread depth", "Cracks on sidewall", "Puncture"],
      fixes: ["Replace tyre", "Repair puncture"]
    },
    "Rear Tyre": {
      question: "Please describe the condition of the rear tyre tread and sidewall.",
      issues: ["Low tread depth", "Cracks on sidewall", "Puncture"],
      fixes: ["Replace tyre", "Repair puncture"]
    }
  },
  "Interior": {
    "Dashboard": {
      question: "Are there any warning lights on the dashboard?",
      issues: ["Engine light on", "Oil pressure light on", "Brake warning light on"],
      fixes: ["Diagnose with OBD scanner", "Check oil level", "Inspect brake system"]
    }
  }
};
