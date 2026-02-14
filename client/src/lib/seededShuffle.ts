/**
 * Seeded Random Number Generator (LCG - Linear Congruential Generator)
 * Generates deterministic pseudo-random numbers based on a seed
 */
function seededRandom(seed: number) {
  let state = seed;
  return function() {
    // LCG parameters (same as Java's java.util.Random)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Fisher-Yates Shuffle with deterministic seed
 * @param array - Array to shuffle
 * @param seed - Seed for deterministic shuffling (e.g., questionId + userId)
 * @returns Shuffled array
 */
export function seededShuffleArray<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = seededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Generate seed from questionId and userId
 * @param questionId - Question ID
 * @param userId - User ID
 * @returns Seed number
 */
export function generateSeed(questionId: number, userId: number): number {
  return questionId * 1000000 + userId;
}
