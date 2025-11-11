import { Difficulty, PropertyBasis, RightsProfile } from "./types";
import { RIGHTS_COST_RANGE, EVICTION_COST_RANGE } from "./constants";

function pickInRange([min, max]: [number, number], rand = Math.random()) {
  return min + (max - min) * rand;
}

export function generateRightsProfile(
  difficulty: Difficulty,
  basis: PropertyBasis,
  rand1 = Math.random(),
  rand2 = Math.random()
): RightsProfile {
  const [rMin, rMax] = RIGHTS_COST_RANGE[difficulty];
  const [eMin, eMax] = EVICTION_COST_RANGE[difficulty];
  const rightsCost = Math.round(basis.appraisedPrice * pickInRange([rMin, rMax], rand1));
  const evictionCost = Math.round(basis.appraisedPrice * pickInRange([eMin, eMax], rand2));

  const notes: string[] = [];
  if (difficulty === "easy") notes.push("권리관계 단순, 배당요구 정상");
  if (difficulty === "medium") notes.push("부분 인수 가능성, 소액 체납 가능");
  if (difficulty === "hard") notes.push("선순위/대항력 가능성, 명도 난이도↑");

  return { difficulty, rightsCost, evictionCost, notes };
}




