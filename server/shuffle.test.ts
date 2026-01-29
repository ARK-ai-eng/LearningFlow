import { describe, it, expect } from "vitest";
import { fisherYatesShuffle, shuffleQuestionAnswers } from "./shuffle";

describe("fisherYatesShuffle", () => {
  it("should return an array of the same length", () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it("should contain all original elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it("should not mutate the original array", () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    fisherYatesShuffle(input);
    expect(input).toEqual(original);
  });

  it("should handle empty arrays", () => {
    const input: number[] = [];
    const result = fisherYatesShuffle(input);
    expect(result).toEqual([]);
  });

  it("should handle single-element arrays", () => {
    const input = [42];
    const result = fisherYatesShuffle(input);
    expect(result).toEqual([42]);
  });

  it("should produce different results on multiple runs (probabilistic)", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set();
    
    // Run 100 times, expect at least 50 different permutations
    for (let i = 0; i < 100; i++) {
      results.add(JSON.stringify(fisherYatesShuffle(input)));
    }
    
    expect(results.size).toBeGreaterThan(50);
  });
});

describe("shuffleQuestionAnswers", () => {
  const sampleQuestion = {
    optionA: "Answer A",
    optionB: "Answer B",
    optionC: "Answer C",
    optionD: "Answer D",
    correctAnswer: "C" as const,
  };

  it("should return all 4 options", () => {
    const result = shuffleQuestionAnswers(sampleQuestion);
    expect(result.optionA).toBeDefined();
    expect(result.optionB).toBeDefined();
    expect(result.optionC).toBeDefined();
    expect(result.optionD).toBeDefined();
  });

  it("should contain all original option texts", () => {
    const result = shuffleQuestionAnswers(sampleQuestion);
    const resultTexts = [result.optionA, result.optionB, result.optionC, result.optionD].sort();
    const originalTexts = ["Answer A", "Answer B", "Answer C", "Answer D"].sort();
    expect(resultTexts).toEqual(originalTexts);
  });

  it("should update correctAnswer to new position", () => {
    const result = shuffleQuestionAnswers(sampleQuestion);
    
    // The correct answer text should be at the position indicated by correctAnswer
    const correctText = "Answer C"; // Original correct answer
    const newPosition = result.correctAnswer; // New position (A, B, C, or D)
    const textAtNewPosition = result[`option${newPosition}` as keyof typeof result] as string;
    
    expect(textAtNewPosition).toBe(correctText);
  });

  it("should provide valid mapping", () => {
    const result = shuffleQuestionAnswers(sampleQuestion);
    
    // Mapping should contain all 4 labels
    expect(Object.keys(result.mapping)).toEqual(["A", "B", "C", "D"]);
    
    // All mapped values should be valid labels
    Object.values(result.mapping).forEach(value => {
      expect(["A", "B", "C", "D"]).toContain(value);
    });
  });

  it("should produce different shuffles on multiple runs (probabilistic)", () => {
    const results = new Set();
    
    // Run 100 times, expect at least 10 different permutations
    for (let i = 0; i < 100; i++) {
      const result = shuffleQuestionAnswers(sampleQuestion);
      results.add(JSON.stringify([result.optionA, result.optionB, result.optionC, result.optionD]));
    }
    
    expect(results.size).toBeGreaterThan(10);
  });

  it("should handle different correct answers", () => {
    const questions = [
      { ...sampleQuestion, correctAnswer: "A" as const },
      { ...sampleQuestion, correctAnswer: "B" as const },
      { ...sampleQuestion, correctAnswer: "C" as const },
      { ...sampleQuestion, correctAnswer: "D" as const },
    ];

    questions.forEach(q => {
      const result = shuffleQuestionAnswers(q);
      const correctText = q[`option${q.correctAnswer}` as keyof typeof q] as string;
      const textAtNewPosition = result[`option${result.correctAnswer}` as keyof typeof result] as string;
      expect(textAtNewPosition).toBe(correctText);
    });
  });
});
