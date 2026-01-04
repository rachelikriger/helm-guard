import { NORMALIZATION_RULES } from "../../../shared/normalization-rules";
import type {
  NormalizationRuleId,
  ReportNormalizationSummary,
} from "../../../shared/report-contract";

export type NormalizationTracker = {
  summary: ReportNormalizationSummary;
  increment: (ruleId: NormalizationRuleId) => void;
};

export const createNormalizationTracker = (): NormalizationTracker => {
  const summary: ReportNormalizationSummary = {
    totalSuppressed: 0,
    rules: NORMALIZATION_RULES.map(rule => ({
      rule,
      suppressedCount: 0,
    })),
  };

  const index = new Map<NormalizationRuleId, number>();
  summary.rules.forEach((result, idx) => {
    index.set(result.rule.id, idx);
  });

  const increment = (ruleId: NormalizationRuleId): void => {
    const position = index.get(ruleId);
    if (position === undefined) return;
    summary.rules[position].suppressedCount += 1;
    summary.totalSuppressed += 1;
  };

  return { summary, increment };
};
