export type RuleStatus = "pass" | "fail" | "n/a";

export interface TestJsonRuleResultsRuleTypeObject {
  name?: string;
  [key: string]: unknown;
}

export interface TestJsonRuleResultsRule {
  ruleId?: string;
  rule_id?: string;
  textual_rule?: string;
  rule_type?: string | TestJsonRuleResultsRuleTypeObject;
  rule_outcome?: string;
  rule_conformity?: string;
  [key: string]: unknown;
}

export interface TestJsonRuleResultsSummary {
  fact_pattern_summary?: string;
  lender_justification?: string;
  final_conclusion?: string;
  [key: string]: unknown;
}

export interface TestJsonRuleResultsSection {
  ruleId?: TestJsonRuleResultsRule[];
  rules?: TestJsonRuleResultsRule[];
  summary?: TestJsonRuleResultsSummary;
  [key: string]: unknown;
}

export interface TestJsonSchema {
  rule_results?: Record<string, TestJsonRuleResultsSection>;
  [key: string]: unknown;
}

export interface UiRule {
  ruleId?: string;
  name: string;
  description: string;
  status: RuleStatus;
  riskScore: 1 | 2 | 3 | 4;
  subrules: Array<{ name: string; description: string; status: RuleStatus }>;
}

export interface UiRuleCategory {
  name: string;
  rules: UiRule[];
  insight: {
    factPattern: {
      facts: Array<{ label: string; value: string }>;
      observations: string[];
    };
    lenderJustification: string[];
    finalConclusion: string[];
  };
  comparison: {
    lenderNarrative: string;
    businessRuleOutcome: string;
    appraisalData: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRuleTypeName(ruleType: unknown): string {
  const raw =
    (typeof ruleType === "string" && ruleType.trim())
      ? ruleType
      : (isRecord(ruleType) && typeof ruleType['name'] === "string" && ruleType['name'].trim())
        ? ruleType['name']
        : "";

  if (!raw) return "Unknown Rule Type";

  const hasUnderscore = raw.includes("_");
  let s = raw.trim().replace(/_/g, " ").replace(/\s+/g, " ");

  // If it's coming in like a variable name (snake_case / lowercase), normalize casing.
  if (hasUnderscore || /^[a-z0-9\s]+$/.test(s)) {
    s = s.toLowerCase();
  }

  // Capitalize the first non-space character (sentence-case).
  const i = s.search(/\S/);
  if (i === -1) return "Unknown Rule Type";
  return s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1);
}

function normalizeStatus(ruleConformity: unknown): RuleStatus {
  const v = typeof ruleConformity === "string" ? ruleConformity.toLowerCase() : "";
  if (v === "pass" || v === "passed") return "pass";
  if (v === "fail" || v === "failed") return "fail";
  return "n/a";
}

function statusToRiskScore(status: RuleStatus): 1 | 2 | 3 | 4 {
  if (status === "fail") return 4;
  return 1;
}

function normalizeRuleId(raw: TestJsonRuleResultsRule): string | undefined {
  const id = raw.ruleId ?? raw.rule_id;
  return typeof id === "string" && id.trim() ? id : undefined;
}

export function buildRuleCategoriesBySectionFromTestJson(raw: unknown): Record<string, UiRuleCategory[]> {
  if (!isRecord(raw)) return {};
  const parsed = raw as TestJsonSchema;
  const ruleResults = parsed.rule_results;
  if (!isRecord(ruleResults)) return {};

  const out: Record<string, UiRuleCategory[]> = {};

  for (const [sectionName, sectionValue] of Object.entries(ruleResults)) {
    if (!isRecord(sectionValue)) continue;
    const section = sectionValue as TestJsonRuleResultsSection;
    const ruleList = (Array.isArray(section.ruleId) ? section.ruleId : Array.isArray(section.rules) ? section.rules : []) as TestJsonRuleResultsRule[];
    const summary = isRecord(section.summary) ? (section.summary as TestJsonRuleResultsSummary) : undefined;

    const grouped: Record<string, UiRule[]> = {};
    for (const r of ruleList) {
      if (!isRecord(r)) continue;
      const rr = r as TestJsonRuleResultsRule;
      const typeName = normalizeRuleTypeName(rr.rule_type);
      const status = normalizeStatus(rr.rule_conformity);
      const uiRule: UiRule = {
        ruleId: normalizeRuleId(rr),
        name: (typeof rr.textual_rule === "string" && rr.textual_rule.trim()) ? rr.textual_rule : "Untitled Rule",
        description: (typeof rr.rule_outcome === "string" && rr.rule_outcome.trim()) ? rr.rule_outcome : "No rule outcome provided.",
        status,
        riskScore: statusToRiskScore(status),
        subrules: [],
      };
      grouped[typeName] = grouped[typeName] ?? [];
      grouped[typeName].push(uiRule);
    }

    const insightObservations = summary?.fact_pattern_summary ? [summary.fact_pattern_summary] : [];
    const lenderJustification = summary?.lender_justification ? [summary.lender_justification] : [];
    const finalConclusion = summary?.final_conclusion ? [summary.final_conclusion] : [];

    out[sectionName] = Object.entries(grouped).map(([ruleTypeName, rules]) => ({
      name: ruleTypeName,
      rules,
      insight: {
        factPattern: {
          facts: [],
          observations: insightObservations,
        },
        lenderJustification,
        finalConclusion,
      },
      comparison: {
        lenderNarrative: "Not provided in rule_results.",
        appraisalData: "Not provided in rule_results.",
        businessRuleOutcome: "See individual rule outcomes by expanding a rule.",
      },
    }));
  }

  return out;
}
