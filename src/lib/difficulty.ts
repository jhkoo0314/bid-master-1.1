import { DIFFICULTY_WEIGHTS } from "./constants";
import { Difficulty } from "./types";

export function drawDifficulty(rand = Math.random()): Difficulty {
  const wEasy = DIFFICULTY_WEIGHTS.easy;
  const wMed = DIFFICULTY_WEIGHTS.medium;
  // hard는 나머지

  if (rand < wEasy) return "easy";
  if (rand < wEasy + wMed) return "medium";
  return "hard";
}




