/**
 * Fisher-Yates Shuffle Algorithm
 * 
 * Shuffles an array in-place using the Fisher-Yates (Knuth) algorithm.
 * Time complexity: O(n)
 * Space complexity: O(1)
 * 
 * @param array - The array to shuffle
 * @returns The shuffled array (same reference, mutated)
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap elements at i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Shuffle question answers (A, B, C, D)
 * 
 * Takes a question with options A-D and returns a shuffled version
 * with a mapping from original positions to new positions.
 * 
 * @param question - Question object with optionA, optionB, optionC, optionD
 * @returns Shuffled question with mapping
 */
export function shuffleQuestionAnswers(question: {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: "A" | "B" | "C" | "D";
}) {
  // Create array of options with their original labels
  const options = [
    { label: "A" as const, text: question.optionA },
    { label: "B" as const, text: question.optionB },
    { label: "C" as const, text: question.optionC },
    { label: "D" as const, text: question.optionD },
  ];

  // Shuffle the options
  const shuffled = fisherYatesShuffle(options);

  // Find where the correct answer ended up
  const correctIndex = shuffled.findIndex(opt => opt.label === question.correctAnswer);
  const newCorrectAnswer = ["A", "B", "C", "D"][correctIndex] as "A" | "B" | "C" | "D";

  // Return shuffled question
  return {
    optionA: shuffled[0].text,
    optionB: shuffled[1].text,
    optionC: shuffled[2].text,
    optionD: shuffled[3].text,
    correctAnswer: newCorrectAnswer,
    // Mapping from original to new positions (for debugging/testing)
    mapping: {
      A: ["A", "B", "C", "D"][shuffled.findIndex(opt => opt.label === "A")] as "A" | "B" | "C" | "D",
      B: ["A", "B", "C", "D"][shuffled.findIndex(opt => opt.label === "B")] as "A" | "B" | "C" | "D",
      C: ["A", "B", "C", "D"][shuffled.findIndex(opt => opt.label === "C")] as "A" | "B" | "C" | "D",
      D: ["A", "B", "C", "D"][shuffled.findIndex(opt => opt.label === "D")] as "A" | "B" | "C" | "D",
    },
  };
}
