import { randomInt } from "node:crypto";
import type {
  DrawExecutionResult,
  DrawMatchResult,
  DrawMode,
  DrawParticipantInput,
  DrawTierOutcome,
  MatchTier,
} from "@/lib/types";
import { calculatePrizePoolDistribution } from "@/lib/services/prize-pool.service";

const DRAW_MIN = 1;
const DRAW_MAX = 45;
const DRAW_SIZE = 5;

export interface RunDrawInput {
  participants: DrawParticipantInput[];
  prizePoolAmount: number;
  jackpotRollover?: number;
  mode?: DrawMode;
  isSimulation?: boolean;
  randomNumbers?: number[];
}

function validateDrawNumbers(numbers: number[]) {
  if (numbers.length !== DRAW_SIZE) {
    throw new Error(`Draw must contain exactly ${DRAW_SIZE} numbers.`);
  }

  const unique = new Set(numbers);
  if (unique.size !== DRAW_SIZE) {
    throw new Error("Draw numbers must be unique.");
  }

  const invalidNumber = numbers.find(
    (number) => number < DRAW_MIN || number > DRAW_MAX,
  );

  if (invalidNumber !== undefined) {
    throw new Error(`Draw number ${invalidNumber} is outside the 1-45 range.`);
  }
}

export function generateRandomDrawNumbers() {
  const pool = Array.from({ length: DRAW_MAX }, (_, index) => index + 1);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, DRAW_SIZE).sort((a, b) => a - b);
}

function generateWeightedDrawNumbers(participants: DrawParticipantInput[]) {
  const frequency = new Map<number, number>();

  for (const participant of participants) {
    for (const score of participant.scores) {
      frequency.set(score, (frequency.get(score) ?? 0) + 1);
    }
  }

  const candidates = Array.from({ length: DRAW_MAX }, (_, index) => index + 1);
  const mostFrequent = [...candidates]
    .sort((a, b) => {
      const frequencyGap = (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0);
      if (frequencyGap !== 0) {
        return frequencyGap;
      }
      return a - b;
    })
    .slice(0, 3);

  const leastFrequent = [...candidates]
    .sort((a, b) => {
      const frequencyGap = (frequency.get(a) ?? 0) - (frequency.get(b) ?? 0);
      if (frequencyGap !== 0) {
        return frequencyGap;
      }
      return a - b;
    })
    .filter((value) => !mostFrequent.includes(value))
    .slice(0, 2);

  return [...mostFrequent, ...leastFrequent].sort((a, b) => a - b);
}

export function getTierFromMatchCount(matchCount: number): MatchTier | null {
  if (matchCount === 5) {
    return "match5";
  }
  if (matchCount === 4) {
    return "match4";
  }
  if (matchCount === 3) {
    return "match3";
  }
  return null;
}

export function matchParticipantScores(
  participant: DrawParticipantInput,
  drawNumbers: number[],
): DrawMatchResult {
  const drawSet = new Set(drawNumbers);
  const matchedNumbers: number[] = [];

  for (const score of participant.scores) {
    if (drawSet.has(score) && !matchedNumbers.includes(score)) {
      matchedNumbers.push(score);
    }
  }

  matchedNumbers.sort((a, b) => a - b);
  const matchCount = matchedNumbers.length;

  return {
    userId: participant.userId,
    userName: participant.userName,
    matchedNumbers,
    matchCount,
    tier: getTierFromMatchCount(matchCount),
  };
}

function buildTierOutcome(
  tier: MatchTier,
  winners: DrawMatchResult[],
  poolAmount: number,
): DrawTierOutcome {
  const payoutPerWinner = winners.length > 0 ? poolAmount / winners.length : 0;
  const rolloverAmount = tier === "match5" && winners.length === 0 ? poolAmount : 0;

  return {
    tier,
    winners,
    poolAmount,
    payoutPerWinner,
    rolloverAmount,
  };
}

export function runDraw({
  participants,
  prizePoolAmount,
  jackpotRollover = 0,
  mode = "random",
  isSimulation = false,
  randomNumbers,
}: RunDrawInput): DrawExecutionResult {
  if (prizePoolAmount < 0) {
    throw new Error("Prize pool amount cannot be negative.");
  }

  const numbers = randomNumbers
    ? [...randomNumbers].sort((a, b) => a - b)
    : mode === "weighted"
      ? generateWeightedDrawNumbers(participants)
      : generateRandomDrawNumbers();

  validateDrawNumbers(numbers);

  const results = participants.map((participant) =>
    matchParticipantScores(participant, numbers),
  );

  const match5Winners = results.filter((result) => result.tier === "match5");
  const match4Winners = results.filter((result) => result.tier === "match4");
  const match3Winners = results.filter((result) => result.tier === "match3");

  const prizePool = calculatePrizePoolDistribution({
    totalRevenue: prizePoolAmount,
    previousJackpotRollover: jackpotRollover,
    winnerCounts: {
      match5: match5Winners.length,
      match4: match4Winners.length,
      match3: match3Winners.length,
    },
  });

  const tierOutcomes: Record<MatchTier, DrawTierOutcome> = {
    match5: buildTierOutcome(
      "match5",
      match5Winners,
      prizePool.splits.match5.poolAmount,
    ),
    match4: buildTierOutcome(
      "match4",
      match4Winners,
      prizePool.splits.match4.poolAmount,
    ),
    match3: buildTierOutcome(
      "match3",
      match3Winners,
      prizePool.splits.match3.poolAmount,
    ),
  };

  return {
    numbers,
    mode,
    isSimulation,
    previousJackpotRollover: jackpotRollover,
    nextJackpotRollover: prizePool.nextJackpotRollover,
    results,
    tierOutcomes,
  };
}

export function simulateDraw(input: Omit<RunDrawInput, "isSimulation">) {
  return runDraw({
    ...input,
    isSimulation: true,
  });
}
