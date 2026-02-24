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
  complianceFinding?: "compliant" | "non-compliant" | "n/a";
  insight: {
    factPattern: {
      facts: Array<{ label: string; value: string }>;
      observations: string[];
    };
    lenderJustification: string[];
    finalConclusion: string[];
  };
  comparison: {
    items: Array<{ question: string; answer: string }>;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeRuleTypeName(ruleType: unknown): string {
  const raw =
    (typeof ruleType === "string" && ruleType.trim())
      ? ruleType
      : (isRecord(ruleType) && typeof ruleType.name === "string" && ruleType.name.trim())
        ? ruleType.name
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

function normalizeComplianceFinding(value: unknown): "compliant" | "non-compliant" | "n/a" | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.toLowerCase().trim();
  if (v === "compliant") return "compliant";
  if (v === "non-compliant" || v === "noncompliant") return "non-compliant";
  if (v === "n/a") return "n/a";
  return undefined;
}

function buildCategoryFromSubSection(subSection: Record<string, unknown>): UiRuleCategory | null {
  const name =
    (typeof subSection.rule_type_name === "string" && subSection.rule_type_name.trim())
      ? subSection.rule_type_name
      : null;
  if (!name) return null;

  const ruleList = Array.isArray(subSection.rules) ? subSection.rules : [];
  const rules: UiRule[] = ruleList
    .filter(isRecord)
    .map((r) => {
      const rr = r as TestJsonRuleResultsRule;
      const status = normalizeStatus(rr.rule_conformity);
      return {
        ruleId: normalizeRuleId(rr),
        name: (typeof rr.textual_rule === "string" && rr.textual_rule.trim()) ? rr.textual_rule : "Untitled Rule",
        description: (typeof rr.rule_outcome === "string" && rr.rule_outcome.trim()) ? rr.rule_outcome : "No rule outcome provided.",
        status,
        riskScore: statusToRiskScore(status),
        subrules: [],
      };
    });

  const summary = isRecord(subSection.summary) ? (subSection.summary as Record<string, unknown>) : {};
  const factPatternSummary = typeof summary.fact_pattern_summary === "string" ? summary.fact_pattern_summary : "";
  const lenderJustification = typeof summary.lender_justification_assessment === "string"
    ? summary.lender_justification_assessment
    : typeof summary.lender_justification === "string"
      ? summary.lender_justification
      : "";
  const complianceRationale = typeof summary.compliance_rationale === "string" ? summary.compliance_rationale : "";
  const complianceFinding = normalizeComplianceFinding(summary.compliance_finding);

  const comparisons = Array.isArray(subSection.comparisons) ? subSection.comparisons : [];
  const comparisonItems = comparisons
    .filter(isRecord)
    .map((c) => ({
      question: typeof (c as Record<string, unknown>).question === "string" ? (c as Record<string, unknown>).question as string : "",
      answer: typeof (c as Record<string, unknown>).answer === "string" ? (c as Record<string, unknown>).answer as string : "",
    }));

  return {
    name,
    rules,
    complianceFinding,
    insight: {
      factPattern: {
        facts: [],
        observations: factPatternSummary ? [factPatternSummary] : [],
      },
      lenderJustification: lenderJustification ? [lenderJustification] : [],
      finalConclusion: complianceRationale ? [complianceRationale] : [],
    },
    comparison: {
      items: comparisonItems,
    },
  };
}

export function buildRuleCategoriesBySectionFromTestJson(raw: unknown): Record<string, UiRuleCategory[]> {
  if (!isRecord(raw)) return {};
  const parsed = raw as TestJsonSchema;
  const ruleResults = parsed.rule_results;
  if (!isRecord(ruleResults)) return {};

  const out: Record<string, UiRuleCategory[]> = {};

  for (const [sectionName, sectionValue] of Object.entries(ruleResults)) {
    if (!isRecord(sectionValue)) continue;
    const section = sectionValue as Record<string, unknown>;

    const ruleTypeSections = isRecord(section.rule_type_sections) ? section.rule_type_sections as Record<string, unknown> : null;

    if (ruleTypeSections && Object.keys(ruleTypeSections).length > 0) {
      const categories: UiRuleCategory[] = [];
      for (const subSectionValue of Object.values(ruleTypeSections)) {
        if (!isRecord(subSectionValue)) continue;
        const category = buildCategoryFromSubSection(subSectionValue as Record<string, unknown>);
        if (category) categories.push(category);
      }
      out[sectionName] = categories;
    } else {
      out[sectionName] = [];
    }
  }

  return out;
}

