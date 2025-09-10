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
export const getCheckpointsArray = (checkpoints: CheckpointTree): CheckpointItem[] => {
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

// Builds the instruction for the AI for a single step
export const buildStepInstruction = (checkpoint: any) => {
  const issuesAndFixes = checkpoint.issues && checkpoint.fixes
    ? `\nIssues to look for: ${checkpoint.issues.join(', ')}\nSuggested fixes: ${checkpoint.fixes.join(', ')}`
    : '';

  return `
You are an AI assistant guiding a user through a two wheller vehicle inspection.
Let the user do the inspection. Only guide if you find anything missing and incorrent only. 
Do the inspection in following sequence 
Take vehicle front video -> Take vehicle front tyre guage video -> Take vehicle right video -> take vehicle back video -> Take vehicle back tyre guage vedio
-> take vehicle left vedio -> take vehicle odometer value vedio
Say the inspector to start the inspection with vehicle front photo wait until it get finished. 
`.trim();
};