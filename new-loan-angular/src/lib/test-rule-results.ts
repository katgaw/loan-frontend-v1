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
  lender_justification_assessment?: string;
  final_conclusion?: string;
  compliance_rationale?: string;
  compliance_finding?: string;
  calibration?: Array<{
    property_name?: string;
    commitment_date?: string;
    issue_type?: string;
    relevance_explanation?: string;
    compliance_rationale?: string;
  }>;
  [key: string]: unknown;
}

export interface TestJsonRuleDetail {
  rule_id?: string;
  description?: string;
  result?: string;
  [key: string]: unknown;
}

export interface TestJsonRuleResultsSection {
  ruleId?: TestJsonRuleResultsRule[];
  rules?: TestJsonRuleResultsRule[];
  rule_details?: TestJsonRuleDetail[];
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
    
    // Check for new nested structure: rule_type_sections
    const ruleTypeSections = section['rule_type_sections'];
    if (isRecord(ruleTypeSections)) {
      // New structure: rule_results.Income & Expenses.rule_type_sections.{other_income, other_expenses}
      const categories: UiRuleCategory[] = [];
      
      for (const [ruleTypeKey, ruleTypeValue] of Object.entries(ruleTypeSections)) {
        if (!isRecord(ruleTypeValue)) continue;
        const ruleTypeSection = ruleTypeValue as TestJsonRuleResultsSection;
        
        // Get summary from this rule_type_section
        const summary = isRecord(ruleTypeSection.summary) 
          ? (ruleTypeSection.summary as TestJsonRuleResultsSummary) 
          : undefined;
        
        // Get rule type name - prefer rule_type_name, fallback to rule_type_id, then normalize the key
        const ruleTypeName = typeof ruleTypeSection['rule_type_name'] === 'string' && ruleTypeSection['rule_type_name'].trim()
          ? ruleTypeSection['rule_type_name']
          : typeof ruleTypeSection['rule_type_id'] === 'string' && ruleTypeSection['rule_type_id'].trim()
            ? normalizeRuleTypeName(ruleTypeSection['rule_type_id'])
            : normalizeRuleTypeName(ruleTypeKey);
        
        const rules: UiRule[] = [];

        // Prefer rule_details as the source for rules (rule_id, description, result)
        const ruleDetailsList = Array.isArray(ruleTypeSection['rule_details']) ? ruleTypeSection['rule_details'] as TestJsonRuleDetail[] : [];
        
        if (ruleDetailsList.length > 0) {
          for (const rd of ruleDetailsList) {
            if (!isRecord(rd)) continue;
            const status = normalizeStatus(rd.result);
            const uiRule: UiRule = {
              ruleId: typeof rd.rule_id === 'string' && rd.rule_id.trim() ? rd.rule_id : undefined,
              name: (typeof rd.description === 'string' && rd.description.trim()) ? rd.description : 'Untitled Rule',
              description: (typeof rd.description === 'string' && rd.description.trim()) ? rd.description : 'No rule outcome provided.',
              status,
              riskScore: statusToRiskScore(status),
              subrules: [],
            };
            rules.push(uiRule);
          }
        } else {
          // Fallback to rules[] / ruleId[] for backward compatibility
          const ruleList = (Array.isArray(ruleTypeSection.ruleId) 
            ? ruleTypeSection.ruleId 
            : Array.isArray(ruleTypeSection.rules) 
              ? ruleTypeSection.rules 
              : []) as TestJsonRuleResultsRule[];

          for (const r of ruleList) {
            if (!isRecord(r)) continue;
            const rr = r as TestJsonRuleResultsRule;
            const status = normalizeStatus(rr.rule_conformity);
            const uiRule: UiRule = {
              ruleId: normalizeRuleId(rr),
              name: (typeof rr.textual_rule === "string" && rr.textual_rule.trim()) ? rr.textual_rule : "Untitled Rule",
              description: (typeof rr.rule_outcome === "string" && rr.rule_outcome.trim()) ? rr.rule_outcome : "No rule outcome provided.",
              status,
              riskScore: statusToRiskScore(status),
              subrules: [],
            };
            rules.push(uiRule);
          }
        }
        
        const insightObservations = summary?.fact_pattern_summary ? [summary.fact_pattern_summary] : [];
        const lenderJustification = summary?.lender_justification_assessment 
          ? [summary.lender_justification_assessment] 
          : summary?.lender_justification 
            ? [summary.lender_justification] 
            : [];
        const finalConclusion = summary?.compliance_rationale 
          ? [summary.compliance_rationale] 
          : summary?.final_conclusion 
            ? [summary.final_conclusion] 
            : [];
        
        // Extract comparisons Q&A from the rule_type_section
        const rawComparisons = Array.isArray(ruleTypeSection['comparisons']) ? ruleTypeSection['comparisons'] : [];
        const comparisonItems: Array<{ question: string; answer: string }> = [];
        for (const c of rawComparisons) {
          if (isRecord(c) && typeof c['question'] === 'string' && typeof c['answer'] === 'string') {
            comparisonItems.push({ question: c['question'], answer: c['answer'] });
          }
        }

        categories.push({
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
            items: comparisonItems,
          },
        });
      }
      
      out[sectionName] = categories;
    } else {
      // Old structure: rule_results.Income & Expense.rules[] (backward compatibility)
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
      const lenderJustification = summary?.lender_justification_assessment 
        ? [summary.lender_justification_assessment] 
        : summary?.lender_justification 
          ? [summary.lender_justification] 
          : [];
      const finalConclusion = summary?.compliance_rationale 
        ? [summary.compliance_rationale] 
        : summary?.final_conclusion 
          ? [summary.final_conclusion] 
          : [];

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
          items: [],
        },
      }));
    }
  }

  return out;
}
