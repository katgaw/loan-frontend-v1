"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildRuleCategoriesBySectionFromTestJson, type UiRuleCategory } from "@/lib/test-rule-results";
import {
  parsePropertyAddressFromLoanSummaryStatement,
  type ParsedPropertyAddress,
} from "@/lib/address";
import { loansData, type Loan as LoanListLoan } from "@/lib/loan-data";
import {
  Download,
  Printer,
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Shield,
  ClipboardCheck,
  Lightbulb,
  X,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  FileDown,
  GitCompare,
  Save,
  CircleCheckBig,
  CircleDot,
  CircleX,
  Flag,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface LoanDetailPageProps {
  loanId?: string;
  onNavigateToRedFlagReview?: () => void;
}

type RuleStatus = "pass" | "fail" | "n/a";

interface Subrule {
  name: string;
  description: string;
  status: RuleStatus;
}

interface Rule {
  ruleId?: string;
  name: string;
  description: string;
  status: RuleStatus;
  riskScore: 1 | 2 | 3 | 4;
  subrules: Subrule[];
}

interface RiskInsight {
  factPattern: {
    facts: { label: string; value: string }[];
    observations: string[];
  };
  lenderJustification: string[];
  finalConclusion: string[];
}

interface ComparisonData {
  lenderNarrative: string;
  businessRuleOutcome: string;
  appraisalData: string;
}

interface RuleComment {
  ruleName: string;
  categoryName: string;
  comment: string;
  timestamp: string;
}

interface RuleCategory {
  name: string;
  rules: Rule[];
  insight: RiskInsight;
  comparison: ComparisonData;
}

type LoanSummaryScores = {
  riskScore: 1 | 2 | 3 | 4;
  compliance: { passed: number; total: number };
};

function pickLoanSummaryStatement(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const factsLookup = (data as Record<string, unknown>)["facts_lookup"];
  if (!factsLookup || typeof factsLookup !== "object") return null;
  const factLoanSummary031 = (factsLookup as Record<string, unknown>)["fact_loan_summary_031"];
  if (!factLoanSummary031 || typeof factLoanSummary031 !== "object") return null;
  const statement = (factLoanSummary031 as Record<string, unknown>)["statement"];
  return typeof statement === "string" ? statement : null;
}

function pickLoanSummaryScores(data: unknown): LoanSummaryScores | null {
  if (!data || typeof data !== "object") return null;
  const loanSummary = (data as Record<string, unknown>)["loan_summary"];
  if (!loanSummary || typeof loanSummary !== "object") return null;

  const rawRisk = (loanSummary as Record<string, unknown>)["risk_score"];
  const risk = typeof rawRisk === "string" ? Number.parseInt(rawRisk, 10) : rawRisk;
  if (typeof risk !== "number" || !Number.isFinite(risk)) return null;
  if (risk !== 1 && risk !== 2 && risk !== 3 && risk !== 4) return null;

  const rawCompliance = (loanSummary as Record<string, unknown>)["compliance_score"];
  if (typeof rawCompliance !== "string") return null;
  const parts = rawCompliance.split("/").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const passed = Number.parseInt(parts[0] ?? "", 10);
  const total = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(passed) || !Number.isFinite(total) || total <= 0) return null;

  return { riskScore: risk, compliance: { passed, total } };
}

// Loan details data
const loanDetails = {
  propertyName: "Sunshine Apartments",
  financingType: "Permanent Financing",
  loanNumber: "LN-2024-00892",
  loanAmount: 45500000,
  propertyType: "Multifamily",
  acquisitionDate: "2023-08-15",
  lenderName: "First National Bank",
  propertyAddress: "1250 Sunshine Boulevard, Phoenix, AZ 85004",
  currentUPB: 44200000,
  productType: "Fixed Rate",
  commitmentDate: "2033-08-15",
  borrower: "Sunshine Holdings LLC",
  riskScore: 3,
  complianceScore: 62,
  units: 248,
  occupancy: 87.5,
  dscr: 1.08,
  ltv: 72.4,
  noi: 3850000,
  debtYield: 8.7,
};

// Summary narrative content
const summaryNarrative = {
  overview: `Sunshine Apartments is a 248-unit Class B multifamily property located in the North Central submarket of Phoenix, Arizona. The property was acquired in August 2023 with permanent financing from First National Bank. The Phoenix multifamily market has experienced softening fundamentals due to elevated supply deliveries, with vacancy rates increasing 180 basis points year-over-year in the submarket.`,
  
  riskAssessment: `This loan exhibits concerning debt service coverage ratios, with the current DSCR of 1.08x falling below the 1.20x covenant threshold. The property's NOI has declined 12% from underwriting projections due to higher-than-anticipated concessions and increased operating expenses. Additionally, the loan is exposed to market risk as the Phoenix MSA has seen significant multifamily supply additions, putting pressure on rental rates and occupancy levels.`,
  
  keyRiskAreas: [
    "DSCR Below Threshold: Current DSCR of 1.08x falls below the 1.20x covenant threshold - potential breach",
    "Net Rental Income Decline: NRI is 15% below underwritten levels due to elevated concessions",
    "Insurance Underwriting: Insurance expense assumption below T12 historical and required trending",
    "Operating Expense Variance: Expenses exceeding budget by 8.2% primarily due to insurance and utilities",
    "Rent Growth Below Target: Assumptions of 3.5% not materializing - actual growth at 1.2%",
  ],
  
  aiRecommendations: [
    "Require updated rent roll with tenant credit verification within 30 days",
    "Request quarterly NOI reporting until DSCR stabilizes above 1.20x",
    "Obtain updated property inspection report to assess physical condition",
    "Review sponsor's capital reserve adequacy for potential shortfalls",
    "Consider enhanced monitoring frequency from annual to semi-annual",
  ],
  
  strengths: [
    "Strong sponsor with $2.1B multifamily portfolio experience",
    "Property in B+ location with good employment access",
    "Recent $1.8M capital improvements completed",
    "Fixed-rate debt provides interest rate protection",
    "Adequate liquidity reserve of 6 months debt service",
  ],
  
  weaknesses: [
    "High tenant turnover rate of 58% annually",
    "Sponsor limited experience with distressed assets",
    "Concentrated tenant base with 22% government vouchers",
    "Deferred maintenance identified in common areas",
    "Property management transition occurring in Q2",
  ],
};

// Rule analysis data with insights
const incomeExpenseRules: RuleCategory[] = [
  {
    name: "Net Rental Income",
    rules: [
      {
        name: "NRI is less than or equal to historical amounts",
        description: "The underwritten Net Rental Income is validated against multiple historical periods to ensure conservative underwriting assumptions.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW NRI vs T12/T6", description: "The UW NRI is less than or equal to T12 or T6 NRI", status: "pass" },
          { name: "UW NRI vs T3/T1", description: "The UW NRI is less than or equal to T3 or T1 NRI", status: "pass" },
          { name: "UW NRI vs Highest T3 Month", description: "The UW NRI is less than or equal to the Highest 1-month NRI of T3 Historical (Annual)", status: "pass" },
        ],
      },
      {
        name: "NRI is trending up overall",
        description: "Net Rental Income demonstrates positive trending across historical periods, indicating stable to improving property performance.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "T3 vs T6 Trend", description: "NRI is trending up between T3 and T6", status: "pass" },
          { name: "T6 vs T12 Trend", description: "NRI is trending up between T6 and T12", status: "pass" },
        ],
      },
      {
        name: "If NRI trend is declining, NRI meets the minimum requirements",
        description: "These rules evaluate acceptable decline thresholds when NRI shows a declining trend. Not applicable when NRI is trending upward.",
        status: "n/a",
        riskScore: 1,
        subrules: [
          { name: "T6 to T3 Decline Check", description: "If NRI trend is declining between T6 and T3, the decline is less than 2%", status: "n/a" },
          { name: "T12 to T6 Decline Check", description: "If NRI trend is declining between T12 and T6, the decline is less than 2%", status: "n/a" },
          { name: "Historical Floor Check", description: "If NRI trend is declining, the NRI must be less than the lowest historical value (less 2%)", status: "n/a" },
          { name: "Minimum Requirements Met", description: "If NRI trend is declining, NRI meets the minimum requirements", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Underwritten NRI", value: "$3,850,000" },
          { label: "T12 NRI", value: "$4,420,000" },
          { label: "T6 NRI (Annualized)", value: "$4,180,000" },
        ],
        observations: [
          "UW NRI is 12.9% below T12 historical performance",
          "UW NRI is 7.9% below annualized T6 performance",
          "Appraisal supports NRI of $4,100,000 suggesting potential upside",
        ],
      },
      lenderJustification: [
        "Conservative underwriting approach accounts for market softening",
        "Elevated concessions expected to continue in near term",
        "New supply deliveries in submarket pressuring rental rates",
        "Assumes 3% rent growth below historical 5% trend",
      ],
      finalConclusion: [
        "NRI assumption is appropriately conservative given market conditions",
        "Gap from historical provides cushion for downside scenarios",
        "Recommend monitoring actual vs projected performance quarterly",
        "No adjustment required at this time - assumption is defensible",
      ],
    },
    comparison: {
      lenderNarrative: "Lender states underwritten NRI of $1,500,000 is based on current rent roll with 3% annual growth assumption. T12 actual NRI was $1,520,000 with stable occupancy of 92%.",
      businessRuleOutcome: "Business rules confirm UW NRI of $1,500,000 is conservative - below T12 ($1,520,000), T6 annualized ($1,540,000), and T3 annualized ($1,560,000). All historical comparison tests pass.",
      appraisalData: "Appraisal indicates market NRI for comparable properties ranges from $1,450,000 to $1,620,000. Subject property NRI of $1,500,000 falls within the 35th percentile of market range."
    }
  },
  {
    name: "Market Rent",
    rules: [
      {
        name: "Gross Potential Rent meets the minimum underwriting requirements",
        description: "Validates that underwritten rents are within acceptable ranges compared to market rent comparables from appraisal and DUS Insight data.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "UW Rent vs Max Appraisal - Studio", description: "UW Rent is under maximum rent comp according to Appraisal - Studio", status: "n/a" },
          { name: "UW Rent vs Max Appraisal - 1 Bedroom", description: "UW Rent is under maximum rent comp according to Appraisal - 1 Bedroom", status: "fail" },
          { name: "UW Rent vs Max Appraisal - 2 Bedroom", description: "UW Rent is under maximum rent comp according to Appraisal - 2 Bedroom", status: "fail" },
          { name: "UW Rent vs Max Appraisal - 3 Bedroom", description: "UW Rent is under maximum rent comp according to Appraisal - 3 Bedroom", status: "pass" },
          { name: "UW Rent per SF vs Appraisal - Studio", description: "UW Rent is under maximum rent comp per SF according to Appraisal - Studio", status: "n/a" },
          { name: "UW Rent per SF vs Appraisal - 1 Bedroom", description: "UW Rent is under maximum rent comp per SF according to Appraisal - 1 Bedroom", status: "fail" },
          { name: "UW Rent per SF vs Appraisal - 2 Bedroom", description: "UW Rent is under maximum rent comp per SF according to Appraisal - 2 Bedroom", status: "pass" },
          { name: "UW Rent per SF vs Appraisal - 3 Bedroom", description: "UW Rent is under maximum rent comp per SF according to Appraisal - 3 Bedroom", status: "pass" },
          { name: "UW Rent vs DUS Insight - Average", description: "UW Rent is under maximum rent per Unit comp according to DUS Insight - Average", status: "n/a" },
          { name: "GPR Minimum Requirements", description: "Gross Potential Rent meets the minimum underwriting requirements", status: "fail" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW 1BR Rent", value: "$1,450" },
          { label: "Max Appraisal 1BR", value: "$1,380" },
          { label: "UW 2BR Rent", value: "$1,750" },
        ],
        observations: [
          "1BR units underwritten 5.1% above maximum appraisal comps",
          "2BR units underwritten 4.2% above maximum appraisal comps",
          "Only 3BR units meet conservative underwriting threshold",
        ],
      },
      lenderJustification: [
        "UW rents based on current in-place rents with minor adjustments",
        "Recent lease renewals support higher rent assumptions",
        "Property amenities justify premium over comparable properties",
        "Strong leasing velocity demonstrates market acceptance of rents",
      ],
      finalConclusion: [
        "1BR and 2BR rent assumptions exceed appraisal maximum",
        "Recommend adjusting 1BR and 2BR rents to align with market data",
        "Current assumptions create risk if market softens further",
        "Request lender provide additional rent comp support",
      ],
    },
    comparison: {
      lenderNarrative: "Lender states UW rents are based on current in-place rents with minor adjustments for recent lease renewals. 1BR at $1,450, 2BR at $1,750, 3BR at $2,100 per month.",
      businessRuleOutcome: "Business rules identify 1BR and 2BR rents exceeding appraisal maximum comparables. 1BR UW rent of $1,450 exceeds max comp of $1,380 by 5.1%. 2BR UW rent of $1,750 exceeds max comp of $1,680 by 4.2%.",
      appraisalData: "Appraisal rent comparables show: 1BR max $1,380/month, 2BR max $1,680/month, 3BR max $2,250/month. Subject property 1BR and 2BR rents are above market ceiling."
    }
  },
  {
    name: "Other Income",
    rules: [
      {
        name: "Other Income meets the minimum underwriting requirements",
        description: "Validates that underwritten other income is conservative relative to appraisal estimates and historical performance.",
        status: "fail",
        riskScore: 2,
        subrules: [
          { name: "UW vs Appraisal Estimate", description: "Other Income is less than or equal to the maximum appraisal estimate", status: "pass" },
          { name: "UW vs T12 Historical", description: "Other Income is less than or equal to the historical T12 Income", status: "fail" },
          { name: "UW per Unit vs Insight", description: "UW Other Income per Unit is less than or equal to the Insight estimate - Other Income", status: "n/a" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW Other Income", value: "$185,000" },
          { label: "Appraisal Estimate", value: "$195,000" },
          { label: "T12 Other Income", value: "$172,000" },
        ],
        observations: [
          "UW exceeds T12 historical by 7.6% ($13,000)",
          "Within appraisal maximum estimate of $195,000",
          "Primary sources: Parking, Laundry, Application Fees",
        ],
      },
      lenderJustification: [
        "New parking fee structure implemented Q2 adds $8,000 annually",
        "Laundry contract renegotiation increases revenue 5%",
        "Application and admin fees trending higher with turnover",
        "Projection reflects stabilized operations not historical",
      ],
      finalConclusion: [
        "Assumption is aggressive relative to demonstrated performance",
        "Within appraisal range but at 80th percentile",
        "Recommend reducing to T12 historical of $172,000",
        "Creates downside risk if new revenue streams underperform",
      ],
    },
    comparison: {
      lenderNarrative: "Lender projects Other Income of $185,000 based on new parking fee structure and laundry contract renegotiation expected to increase revenue.",
      businessRuleOutcome: "Business rules flag Other Income as exceeding T12 historical of $172,000 by 7.6%. While within appraisal maximum of $195,000, the assumption is aggressive relative to demonstrated performance.",
      appraisalData: "Appraisal estimates Other Income range of $165,000 to $195,000 based on comparable properties. Subject UW of $185,000 is at the 80th percentile of the range."
    }
  },
  {
    name: "Commercial Income",
    rules: [
      {
        name: "Commercial Income meets the minimum requirements",
        description: "Validates commercial income components when applicable. Not applicable for properties without commercial space.",
        status: "n/a",
        riskScore: 1,
        subrules: [
          { name: "UW vs Gross Commercial", description: "UW Commercial Income is less than 90% of Gross Commercial Income", status: "n/a" },
          { name: "Commercial vs EGI - 20%", description: "UW Commercial Income is less than or equal to 20% of Effective Gross Income", status: "n/a" },
          { name: "Gross Commercial vs EGI - 35%", description: "Gross Commercial Income is less than or equal to 35% of Effective Gross Income", status: "n/a" },
          { name: "Commercial SF vs Total SF", description: "Commercial Area Square Footage is less than or equal to 35% of Total Square Footage", status: "n/a" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "Commercial Income", value: "$0" },
          { label: "Commercial SF", value: "0 SF" },
          { label: "Property Type", value: "100% Multifamily" },
        ],
        observations: [
          "Property contains no commercial or retail space",
          "All 248 units are residential multifamily",
          "No commercial tenant exposure or lease risk",
        ],
      },
      lenderJustification: [
        "Property is 100% residential multifamily",
        "No ground floor retail or commercial space",
        "Zoning permits residential use only",
        "Commercial income rules not applicable",
      ],
      finalConclusion: [
        "All commercial income tests correctly marked N/A",
        "No commercial tenant concentration risk",
        "Property type confirmed as residential multifamily",
        "No further review required for this category",
      ],
    },
    comparison: {
      lenderNarrative: "Lender confirms property is 100% residential multifamily with no commercial component or retail space.",
      businessRuleOutcome: "Business rules correctly identify N/A status for all commercial income tests as property contains no commercial square footage.",
      appraisalData: "Appraisal confirms subject is a 248-unit residential multifamily property with 0 SF of commercial space. No commercial income is applicable."
    }
  },
  {
    name: "Occupancy",
    rules: [
      {
        name: "Both Economic and Physical Occupancy for each of the last 3 months meets the minimum requirements",
        description: "Validates that both economic and physical occupancy levels meet minimum thresholds across recent periods.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Economic Occupancy - Month 1", description: "Economic Occupancy of latest 1 month was a minimum of 70%", status: "pass" },
          { name: "Physical Occupancy - Month 1", description: "Physical Occupancy of latest 1 month was minimum of 85%", status: "pass" },
          { name: "Economic Occupancy - Month 2", description: "Economic Occupancy of latest 2 month was a minimum of 70%", status: "pass" },
          { name: "Physical Occupancy - Month 2", description: "Physical Occupancy of latest 2 month was minimum of 85%", status: "pass" },
          { name: "Economic Occupancy - Month 3", description: "Economic Occupancy of latest 3 month was a minimum of 70%", status: "pass" },
          { name: "Physical Occupancy - Month 3", description: "Physical Occupancy of latest 3 month was minimum of 85%", status: "pass" },
        ],
      },
      {
        name: "The economic vacancy must be greater than or equal to both 5% of GPR and the GPR - T3 NRI",
        description: "Validates that underwritten economic vacancy is appropriately conservative.",
        status: "pass",
        riskScore: 1,
        subrules: [],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "Current Physical Occ.", value: "92.3%" },
          { label: "Current Economic Occ.", value: "88.7%" },
          { label: "UW Vacancy", value: "7.0%" },
        ],
        observations: [
          "Physical occupancy exceeds 85% minimum for all 3 months",
          "Economic occupancy exceeds 70% minimum for all 3 months",
          "UW vacancy of 7% provides cushion above 5% GPR minimum",
        ],
      },
      lenderJustification: [
        "Property has maintained stable occupancy above 90%",
        "Concessions have normalized from peak levels",
        "Lease-up velocity supports stabilized occupancy assumption",
        "Market vacancy of 7.2% supports UW assumptions",
      ],
      finalConclusion: [
        "All occupancy thresholds met - no concerns identified",
        "UW vacancy assumption appropriately conservative",
        "Physical and economic occupancy trending stable",
        "No adjustment required - assumptions are defensible",
      ],
    },
    comparison: {
      lenderNarrative: "Lender reports current physical occupancy of 92.3% and economic occupancy of 88.7% based on most recent rent roll dated within 30 days.",
      businessRuleOutcome: "Business rules confirm all occupancy thresholds met: Physical occupancy above 85% minimum (92.3%) and economic occupancy above 70% minimum (88.7%) for all trailing 3 months.",
      appraisalData: "Appraisal notes submarket vacancy of 7.2% with subject property outperforming market. Stabilized occupancy assumption of 93% is supported by historical performance."
    }
  },
  {
    name: "Operating Expense",
    rules: [
      {
        name: "Operating Expense meets the minimum underwriting requirements",
        description: "Validates that underwritten operating expenses are appropriately conservative compared to appraisal, historical, and market data.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs Appraisal Minimum", description: "The Operating Expense is greater than minimum Appraisal comp", status: "pass" },
          { name: "UW vs T12 Historical", description: "The Operating Expense is higher than or equal to the T12 historical expense", status: "pass" },
          { name: "UW per Unit vs Insight Min", description: "UW Operating Expense per Unit is greater than or equal to the minimum Insight estimate - Other Income", status: "n/a" },
          { name: "UW per Unit vs Insight Max", description: "UW Operating Expense per Unit is less than or equal to the maximum Insight estimate - Other Income", status: "n/a" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW Operating Expense", value: "$2,180,000" },
          { label: "T12 Operating Expense", value: "$2,120,000" },
          { label: "Appraisal Minimum", value: "$2,050,000" },
        ],
        observations: [
          "UW exceeds appraisal minimum by $130,000 (6.3%)",
          "UW exceeds T12 historical by $60,000 (2.8%)",
          "Expense ratio of 42.3% within normal range",
        ],
      },
      lenderJustification: [
        "3% inflation adjustment applied to controllable expenses",
        "Property management fee at market rate of 3.5%",
        "R&M reserve increased for aging building systems",
        "Payroll trending with local wage growth assumptions",
      ],
      finalConclusion: [
        "Operating expense assumptions are appropriately conservative",
        "Buffer above historical provides cushion for cost increases",
        "All expense line items within reasonable ranges",
        "No adjustment required - assumptions are defensible",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites total operating expenses at $2,180,000 ($8,790/unit) based on T12 actuals with 3% inflation adjustment for controllable expenses.",
      businessRuleOutcome: "Business rules confirm UW OpEx of $2,180,000 exceeds appraisal minimum of $2,050,000 and T12 historical of $2,120,000. All operating expense tests pass.",
      appraisalData: "Appraisal operating expense comparables range from $8,200 to $9,400 per unit. Subject UW of $8,790/unit is at the 55th percentile, considered reasonable."
    }
  },
  {
    name: "Insurance",
    rules: [
      {
        name: "Insurance expense is greater than historical amount trended up",
        description: "Validates that insurance expense assumptions account for market hardening and policy renewal timing.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "UW vs Quoted Amount", description: "Insurance expense is greater than or equal to the quoted amount", status: "n/a" },
          { name: "Expiry within 6 Months", description: "If current insurance expires in 6 months or less, insurance expense is 10% more than prior calendar year", status: "n/a" },
          { name: "Expiry after 6 Months", description: "If current insurance expires after 6 months, insurance expense is 5% more than prior calendar year", status: "fail" },
          { name: "UW vs T12 Insurance", description: "UW Insurance is greater than or equal to T12 Insurance", status: "fail" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW Insurance", value: "$245,000" },
          { label: "T12 Insurance", value: "$268,000" },
          { label: "Prior Year + 5% Required", value: "$281,400" },
        ],
        observations: [
          "UW is 8.6% below T12 historical insurance expense",
          "UW is 12.9% below required 5% trending amount",
          "Policy expires in 8 months requiring renewal assumption",
        ],
      },
      lenderJustification: [
        "Current policy premium used as baseline assumption",
        "Broker indicates renewal may be at similar levels",
        "Property has favorable loss history",
        "Shopping coverage across multiple carriers",
      ],
      finalConclusion: [
        "Insurance assumption creates significant downside risk",
        "Market hardening suggests 15-25% increases common",
        "Recommend increasing UW to at least $281,400",
        "Failure to meet trending requirement is a concern",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites insurance at $245,000 based on current policy premium with assumption that renewal will be at similar levels.",
      businessRuleOutcome: "Business rules identify insurance UW of $245,000 as below T12 historical ($268,000) and required 5% trend ($281,400). Insurance policy expires in 8 months requiring trending adjustment.",
      appraisalData: "Appraisal notes significant insurance market hardening in Phoenix metro with 15-25% annual increases common. Current UW appears to underestimate renewal costs."
    }
  },
  {
    name: "General and Administrative",
    rules: [
      {
        name: "General and Administrative Expense meets minimum underwriting requirements",
        description: "Validates that G&A expense assumptions are appropriately conservative relative to appraisal and historical benchmarks.",
        status: "fail",
        riskScore: 2,
        subrules: [
          { name: "UW vs Appraisal Minimum", description: "General and Administrative is higher than or equal to the minimum appraisal estimate", status: "pass" },
          { name: "UW vs T12 Historical", description: "General and Administrative is higher than or equal to the T12 historical expense", status: "fail" },
          { name: "UW per Unit vs Insight", description: "UW General and Administrative per Unit is greater than or equal to the Insight estimate - General and Administrative", status: "n/a" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW G&A Expense", value: "$85,000" },
          { label: "T12 G&A Expense", value: "$92,000" },
          { label: "Appraisal Minimum", value: "$78,000" },
        ],
        observations: [
          "UW is 7.6% below T12 historical expense",
          "UW exceeds appraisal minimum by $7,000",
          "Components include Legal, Audit, and Admin expenses",
        ],
      },
      lenderJustification: [
        "Normalized for one-time legal costs in T12 period",
        "Audit fees renegotiated at lower rate",
        "Admin costs reduced through operational efficiencies",
        "Projection reflects stabilized expense levels",
      ],
      finalConclusion: [
        "G&A below T12 historical creates potential shortfall risk",
        "Recommend adjusting to at least match T12 of $92,000",
        "One-time cost normalization requires documentation",
        "Monitor actual vs projected G&A quarterly",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites G&A at $85,000 based on normalized expenses excluding one-time legal costs incurred in T12 period.",
      businessRuleOutcome: "Business rules flag G&A UW of $85,000 as below T12 historical of $92,000 by 7.6%. While above appraisal minimum of $78,000, the reduction from historical requires justification.",
      appraisalData: "Appraisal G&A comparables range from $300 to $400 per unit. Subject UW of $343/unit is within range but below property's demonstrated historical expense level."
    }
  },
  {
    name: "Repair and Maintenance",
    rules: [
      {
        name: "Repair and Maintenance expense meets the minimum underwriting Criteria",
        description: "Validates that R&M expense assumptions are appropriately conservative compared to appraisal estimates and historical performance.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs Appraisal Minimum", description: "Repair and Maintenance is higher than or equal to the minimum appraisal estimate", status: "pass" },
          { name: "UW vs T12 Historical", description: "Repair and Maintenance is higher than or equal to the T12 Repair and Maintenance", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Repair and Maintenance per Unit is greater than or equal to the Insight estimate - Repair and Maintenance", status: "n/a" },
        ],
      },
    ],
    insight: {
      factPattern: {
        facts: [
          { label: "UW R&M Expense", value: "$458,000" },
          { label: "T12 R&M Expense", value: "$445,000" },
          { label: "Property Age", value: "12 years" },
        ],
        observations: [
          "UW exceeds T12 historical by 2.9%",
          "UW exceeds appraisal minimum of $420,000",
          "Aging building systems require higher maintenance",
        ],
      },
      lenderJustification: [
        "Property age warrants higher R&M allocation",
        "HVAC systems approaching replacement cycle",
        "Increased turnover driving higher make-ready costs",
        "Preventive maintenance program expanded",
      ],
      finalConclusion: [
        "R&M assumptions are appropriately conservative",
        "Buffer accounts for aging building systems",
        "No adjustment required - assumption is defensible",
        "Monitor actual vs projected R&M quarterly",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites R&M at $458,000 ($1,847/unit) reflecting property age of 12 years and anticipated HVAC and roofing repairs in the near term.",
      businessRuleOutcome: "Business rules confirm R&M UW of $458,000 exceeds both appraisal minimum ($420,000) and T12 historical ($445,000). All R&M tests pass.",
      appraisalData: "Appraisal R&M comparables for similar vintage properties range from $1,600 to $2,100 per unit. Subject UW of $1,847/unit is appropriately conservative at 55th percentile."
    }
  },
  {
    name: "Payroll",
    rules: [
      {
        name: "Payroll expense meets the minimum underwriting requirements",
        description: "Validates that payroll expense assumptions are appropriately conservative compared to appraisal estimates and historical performance.",
        status: "fail",
        riskScore: 2,
        subrules: [
          { name: "UW vs Appraisal Minimum", description: "Payroll is higher than or equal to the minimum expense comp from the appraisal estimate", status: "fail" },
          { name: "UW vs T12 Historical", description: "UW Payroll is greater than or equal to T12 Payroll", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Payroll per Unit is greater than or equal to the Insight estimate - Payroll", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Payroll Expense", value: "$385,000" },
          { label: "Appraisal Minimum", value: "$410,000" },
          { label: "Staff Count", value: "6 FTEs" },
        ],
        observations: [
          "UW is 6.1% below appraisal minimum estimate",
          "UW exceeds T12 historical of $372,000 by 3.5%",
          "May not account for wage inflation adequately",
        ],
      },
      lenderJustification: [
        "Current staffing levels are efficient",
        "No planned headcount increases",
        "Wage increases budgeted at 3% annually",
        "Benefits costs stable with current provider",
      ],
      finalConclusion: [
        "Payroll below appraisal minimum is a concern",
        "Market labor conditions suggest higher costs",
        "Recommend stress testing at appraisal levels",
        "Monitor actual payroll vs projection closely",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites payroll at $385,000 based on current staffing of 6 FTEs with 2% wage increase assumption.",
      businessRuleOutcome: "Business rules flag payroll UW of $385,000 as below appraisal minimum of $410,000 by 6.1%. While above T12 historical, market wage data suggests higher costs.",
      appraisalData: "Appraisal payroll comparables show range of $1,500 to $1,800 per unit in Phoenix market. Subject UW of $1,552/unit is at lower end, not reflecting current labor market tightness."
    }
  },
  {
    name: "Utilities/Trash",
    rules: [
      {
        name: "Utilities/Trash/W/S meets the minimum underwriting requirements",
        description: "Validates that combined utilities, trash, and water/sewer expenses meet minimum underwriting thresholds.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Total vs Appraisal Minimum", description: "Utilities + Trash + Water & Sewer total is higher than or equal to the minimum appraisal estimate(s)", status: "pass" },
          { name: "Total vs T12 Historical", description: "Utilities + Trash + Water & Sewer is higher than T12 historical expenses", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Utilities", value: "$312,000" },
          { label: "T12 Utilities", value: "$298,000" },
          { label: "Appraisal Minimum", value: "$285,000" },
        ],
        observations: [
          "UW exceeds T12 historical by 4.7%",
          "UW exceeds appraisal minimum by 9.5%",
          "Components: Electric, Gas, Water/Sewer, Trash",
        ],
      },
      lenderJustification: [
        "Utility rate increases projected at 4-5% annually",
        "Master-metered property has limited RUBS potential",
        "Energy efficiency upgrades not yet implemented",
        "Buffer accounts for usage fluctuations",
      ],
      finalConclusion: [
        "Utilities assumptions appropriately conservative",
        "Buffer accounts for projected rate increases",
        "No adjustment required - assumption is defensible",
        "Consider energy audit for cost reduction opportunities",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites combined utilities at $312,000 based on T12 actuals plus 5% for anticipated rate increases.",
      businessRuleOutcome: "Business rules confirm combined utilities UW of $312,000 exceeds appraisal minimum ($295,000) and T12 historical ($298,000). All utility tests pass.",
      appraisalData: "Appraisal utility comparables show $1,150 to $1,350 per unit range. Subject UW of $1,258/unit is appropriately positioned at market midpoint."
    }
  },
  {
    name: "Utilities",
    rules: [
      {
        name: "Utilities expense meets the minimum underwriting requirements",
        description: "Validates that general utilities expense assumptions meet minimum requirements.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs T12 Historical", description: "UW Utilities is greater than or equal to T12 Utilities", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Utilities per Unit is greater than or equal to the Insight estimate - Utilities", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Utilities/Trash", value: "$168,000" },
          { label: "T12 Utilities/Trash", value: "$162,000" },
          { label: "Metering", value: "Master metered" },
        ],
        observations: [
          "UW exceeds T12 historical by 3.7%",
          "Rate increases averaging 3.2% year-over-year",
          "Master metering limits tenant reimbursement",
        ],
      },
      lenderJustification: [
        "Rate increase projection aligned with utility filings",
        "Usage patterns consistent with historical",
        "No planned RUBS implementation",
        "Conservation measures maintain flat usage",
      ],
      finalConclusion: [
        "Utilities assumption appropriately conservative",
        "Buffer accounts for projected rate increases",
        "No adjustment required - assumption is defensible",
        "Consider RUBS feasibility for cost recovery",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites utilities at $168,000 based on master-metered common area consumption with 4% rate increase assumption.",
      businessRuleOutcome: "Business rules confirm utilities UW of $168,000 exceeds T12 historical of $162,000. Test passes with 3.7% cushion above historical.",
      appraisalData: "Appraisal notes APS rate increases of 2.5% approved for service area. UW assumption adequately captures projected increases."
    }
  },
  {
    name: "Electricity",
    rules: [
      {
        name: "Electricity Expense meets the underwriting requirements",
        description: "Validates that electricity expense assumptions meet minimum requirements.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs T12 Historical", description: "UW Electricity is greater than or equal to T12 Electricity", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Electricity per Unit is greater than or equal to the Insight estimate - Electricity", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Electricity", value: "$95,000" },
          { label: "T12 Electricity", value: "$91,000" },
          { label: "Provider", value: "APS" },
        ],
        observations: [
          "UW exceeds T12 historical by 4.4%",
          "APS rate increases averaging 4.1% annually",
          "Common area lighting is primary expense driver",
        ],
      },
      lenderJustification: [
        "Rate increase aligned with APS approved filings",
        "LED lighting upgrades completed in common areas",
        "HVAC efficiency improvements reduce consumption",
        "Summer peak usage factored into projections",
      ],
      finalConclusion: [
        "Electricity assumption appropriately conservative",
        "Buffer accounts for projected rate increases",
        "No adjustment required - assumption is defensible",
        "LED upgrades should help contain costs",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites electricity at $95,000 based on 285,000 kWh common area consumption at projected rates.",
      businessRuleOutcome: "Business rules confirm electricity UW of $95,000 exceeds T12 historical of $91,000. Test passes with 4.4% cushion.",
      appraisalData: "Appraisal electricity comparables for common area range from $350 to $420 per unit. Subject UW of $383/unit is within market range."
    }
  },
  {
    name: "Gas",
    rules: [
      {
        name: "Gas expense meets the minimum underwriting requirements",
        description: "Validates that gas expense assumptions meet minimum requirements.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs T12 Historical", description: "UW Gas is greater than or equal to T12 Gas", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Gas per Unit is greater than or equal to the Insight estimate - Gas", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Gas", value: "$73,000" },
          { label: "T12 Gas", value: "$71,000" },
          { label: "Provider", value: "Southwest Gas" },
        ],
        observations: [
          "UW exceeds T12 historical by 2.8%",
          "Rate increases averaging 2.5% annually",
          "Central boiler system for domestic hot water",
        ],
      },
      lenderJustification: [
        "Commodity price fluctuations factored in",
        "Mild Phoenix winters limit heating demand",
        "Boiler efficiency maintained with regular service",
        "Usage patterns consistent year over year",
      ],
      finalConclusion: [
        "Gas assumption appropriately conservative",
        "Buffer accounts for commodity price changes",
        "No adjustment required - assumption is defensible",
        "Limited exposure due to Phoenix climate",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites gas at $73,000 for heating and hot water systems served by Southwest Gas.",
      businessRuleOutcome: "Business rules confirm gas UW of $73,000 exceeds T12 historical of $71,000. Test passes with 2.8% cushion.",
      appraisalData: "Appraisal gas expense comparables range from $250 to $350 per unit. Subject UW of $294/unit is appropriately conservative."
    }
  },
  {
    name: "Water and Sewer",
    rules: [
      {
        name: "Water and Sewer meets the minimum underwriting requirements",
        description: "Validates that water and sewer expense assumptions meet minimum requirements.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "UW vs T12 Historical", description: "UW Water and Sewer is greater than or equal to T12 Water and Sewer", status: "pass" },
          { name: "UW per Unit vs Insight", description: "UW Water & Sewer per Unit is greater than or equal to the Insight estimate - Water & Sewer", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Water/Sewer", value: "$112,000" },
          { label: "T12 Water/Sewer", value: "$108,000" },
          { label: "Provider", value: "City of Phoenix" },
        ],
        observations: [
          "UW exceeds T12 historical by 3.7%",
          "Municipal rate increases averaging 3.5% annually",
          "Desert climate increases water consumption",
        ],
      },
      lenderJustification: [
        "City rate increases factored into projection",
        "Low-flow fixtures installed during renovation",
        "Irrigation system upgraded for efficiency",
        "Pool usage is primary variable component",
      ],
      finalConclusion: [
        "Water/Sewer assumption appropriately conservative",
        "Buffer accounts for municipal rate increases",
        "No adjustment required - assumption is defensible",
        "Monitor for drought surcharges in desert climate",
      ],
    },
    comparison: {
      lenderNarrative: "Lender underwrites water/sewer at $112,000 reflecting partial RUBS recovery and City of Phoenix rate schedule.",
      businessRuleOutcome: "Business rules confirm water/sewer UW of $112,000 exceeds T12 historical of $108,000. Test passes with 3.7% cushion.",
      appraisalData: "Appraisal water/sewer comparables range from $400 to $500 per unit. Subject UW of $452/unit is within market range."
    }
  },
  {
    name: "Trash",
    rules: [
      {
        name: "Trash Expense meets the minimum underwriting requirements",
        description: "Validates that trash expense assumptions meet minimum requirements. Not applicable when trash is included in other expense categories.",
        status: "n/a",
        riskScore: 1,
        subrules: [
          { name: "UW vs T12 Historical", description: "UW Trash is greater than or equal to T12 Trash", status: "n/a" },
          { name: "UW per Unit vs Insight", description: "UW Trash per Unit is greater than or equal to the Insight estimate - Trash", status: "n/a" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Trash", value: "Included in Utilities" },
          { label: "Combined Category", value: "Utilities/Trash" },
          { label: "Service Frequency", value: "3x weekly" },
        ],
        observations: [
          "Trash expense combined with utilities category",
          "Service by Republic Services with recycling",
          "Individual line item validation not applicable",
        ],
      },
      lenderJustification: [
        "Combined reporting standard for this property",
        "Service contract includes recycling program",
        "3x weekly pickup adequate for property size",
        "Contract rate locked through 2026",
      ],
      finalConclusion: [
        "Trash expense appropriately included in combined category",
        "Individual validation not applicable",
        "No adjustment required - reporting method acceptable",
        "Monitor for contract renewal rate changes",
      ],
    },
    comparison: {
      lenderNarrative: "Lender notes trash expense is included in combined utilities category and is not separately tracked.",
      businessRuleOutcome: "Business rules correctly identify N/A status as trash is bundled with utilities. No separate validation required.",
      appraisalData: "Appraisal confirms Republic Services contract includes trash collection as part of overall utility package."
    }
  },
];

const managementFeeRules: RuleCategory[] = [
  {
    name: "Management Fee",
    rules: [
      {
        name: "Management Fee Percentage",
        description: "Management fee is within the acceptable range of 3-5% of EGI.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Fee Percentage", description: "Management fee is 4.0% of EGI", status: "pass" },
          { name: "Annual Fee Amount", description: "Annual fee amount is $168,000", status: "pass" },
          { name: "Contract Term", description: "Contract term is 2 years", status: "pass" },
          { name: "Termination Notice", description: "Termination notice is 30 days", status: "pass" },
          { name: "Performance Bonus", description: "No performance bonus", status: "pass" },
          { name: "Market Range Check", description: "Management fee is within the 3-5% market range", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Management Fee", value: "3.5% of EGI" },
          { label: "Annual Amount", value: "$180,250" },
          { label: "Manager", value: "ABC Property Management" },
        ],
        observations: [
          "Fee within market range of 3-5% of EGI",
          "Month-to-month with 30-day termination notice",
          "Manager transition planned for Q2 2026",
        ],
      },
      lenderJustification: [
        "Fee structure is market standard",
        "Performance-based incentives in negotiation",
        "30-day termination provides flexibility",
        "New manager selection process underway",
      ],
      finalConclusion: [
        "Management fee within acceptable parameters",
        "Consider performance incentives for alignment",
        "Transition timing creates operational risk",
        "Request new manager selection update",
      ],
    },
    comparison: {
      lenderNarrative: "Lender notes management fee of 4.0% of EGI is consistent with market norms for Class B multifamily in Phoenix metro.",
      businessRuleOutcome: "Business rules confirm management fee of 4.0% is within acceptable 3-5% range. Contract terms are standard with 30-day termination notice.",
      appraisalData: "Appraisal management fee comparables range from 3.0% to 5.0% of EGI. Subject fee of 4.0% is at market midpoint."
    }
  },
];

const realEstateTaxesRules: RuleCategory[] = [
  {
    name: "Real Estate Taxes",
    rules: [
      {
        name: "Tax Assessment Accuracy",
        description: "Tax assessment reflects current market value within acceptable range.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Assessment Level", description: "$58.2M assessment within 15% of property value", status: "pass" },
          { name: "Mill Rate Analysis", description: "Current mill rate consistent with jurisdiction", status: "pass" },
          { name: "Reassessment Risk", description: "No imminent reassessment expected", status: "pass" },
        ],
      },
      {
        name: "Tax Appeal Status",
        description: "No pending tax appeals that could materially impact projections.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Appeal Status", description: "No pending tax appeals filed", status: "pass" },
          { name: "Historical Appeals", description: "No material appeal history", status: "pass" },
          { name: "Projection Impact", description: "Tax projections are stable and reliable", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "UW Taxes", value: "$698,400" },
          { label: "Current Assessment", value: "$58,200,000" },
          { label: "Tax per Unit", value: "$2,816" },
        ],
        observations: [
          "Effective tax rate of 1.2% is market standard",
          "Assessment reflects current market value",
          "No pending appeals or assessment challenges",
        ],
      },
      lenderJustification: [
        "Assessment based on January 2025 valuation",
        "Tax rate stable in Maricopa County",
        "No anticipated millage increases",
        "Property not subject to special assessments",
      ],
      finalConclusion: [
        "Tax position is stable and appropriately budgeted",
        "Tax burden consistent with Phoenix metro averages",
        "Monitor for reassessment if values decline further",
        "No adjustment required - assumption is defensible",
      ],
    },
    comparison: {
      lenderNarrative: "Lender reports real estate taxes of $698,400 annually based on current Maricopa County assessment of $58.2M at 1.20% effective tax rate.",
      businessRuleOutcome: "Business rules confirm tax assessment of $58.2M is within 15% of current market value of $61.0M. No pending appeals or reassessment risks identified.",
      appraisalData: "Appraisal confirms current tax assessment is appropriate. Tax burden of $2,816 per unit is consistent with Phoenix metro Class B multifamily averages of $2,600-$3,000 per unit."
    }
  },
];

const valuationRules: RuleCategory[] = [
  {
    name: "Leverage Ratios",
    rules: [
      {
        name: "LTV Stress Test",
        description: "LTV under 10% value decline scenario would breach covenant.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "Stressed LTV", description: "80.4% stressed LTV exceeds 75% covenant maximum", status: "fail" },
          { name: "Value Decline Sensitivity", description: "Only 3.5% additional decline triggers breach", status: "fail" },
          { name: "Market Volatility", description: "Phoenix market showing 5-8% value decline potential", status: "fail" },
        ],
      },
      {
        name: "LTV Ratio Compliance",
        description: "Loan-to-Value ratio is within covenant threshold but trending higher due to value decline.",
        status: "pass",
        riskScore: 2,
        subrules: [
          { name: "Current LTV", description: "72.4% LTV is below 75% covenant threshold", status: "pass" },
          { name: "Cushion Analysis", description: "2.6% cushion to covenant breach", status: "pass" },
          { name: "Trend Direction", description: "LTV trending higher due to value decline", status: "fail" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Current LTV", value: "72.4%" },
          { label: "Maximum Allowed", value: "75.0%" },
          { label: "Current Value", value: "$61.0M" },
        ],
        observations: [
          "Only 2.6% cushion to covenant maximum",
          "Value has declined 10.9% since acquisition",
          "~$1.6M value decline tolerance before breach",
        ],
      },
      lenderJustification: [
        "Property value reflects current market conditions",
        "Cap rate expansion is market-wide phenomenon",
        "NOI improvement will support value recovery",
        "Phoenix market expected to stabilize in 2026",
      ],
      finalConclusion: [
        "LTV compliant but minimal cushion is concerning",
        "Vulnerable to further market deterioration",
        "Stress testing reveals limited headroom",
        "Monitor value quarterly for covenant compliance",
      ],
    },
    comparison: {
      lenderNarrative: "Lender reports current LTV of 72.4% based on original appraised value of $68.5M with UPB of $44.2M. Loan remains within covenant compliance.",
      businessRuleOutcome: "Business rules confirm current LTV of 72.4% is below 75% covenant threshold but stress test at 10% value decline would breach at 80.4% LTV.",
      appraisalData: "Appraisal as-is value of $61.0M reflects 10.9% decline from original. Phoenix MSA multifamily values have compressed 8-12% from peak."
    }
  },
  {
    name: "Debt Service Coverage",
    rules: [
      {
        name: "DSCR Minimum Threshold",
        description: "Current DSCR falls below minimum covenant threshold of 1.20x, indicating potential cash flow stress.",
        status: "fail",
        riskScore: 4,
        subrules: [
          { name: "Current DSCR Level", description: "1.08x DSCR is below 1.20x covenant minimum", status: "fail" },
          { name: "Shortfall Amount", description: "0.12x shortfall requires $428K additional NOI", status: "fail" },
          { name: "Cure Timeline", description: "No clear path to covenant compliance within 6 months", status: "fail" },
        ],
      },
      {
        name: "DSCR Trend Analysis",
        description: "DSCR has declined for three consecutive quarters, indicating deteriorating performance.",
        status: "fail",
        riskScore: 4,
        subrules: [
          { name: "Year-over-Year Change", description: "DSCR declined 15% compared to prior year", status: "fail" },
          { name: "Quarterly Trend", description: "Three consecutive quarters of decline", status: "fail" },
          { name: "Projection Outlook", description: "No improvement expected in next two quarters", status: "fail" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Current DSCR", value: "1.08x" },
          { label: "Covenant Minimum", value: "1.20x" },
          { label: "Required NOI for 1.20x", value: "$4,278,000" },
        ],
        observations: [
          "DSCR is 0.12x below covenant minimum",
          "NOI shortfall of approximately $428,000",
          "Declining trend: Q1 1.15x, Q2 1.12x, Current 1.08x",
        ],
      },
      lenderJustification: [
        "Elevated concessions are temporary market condition",
        "Expense reductions underway to improve NOI",
        "New property manager will drive operational improvements",
        "Market fundamentals expected to improve in 2026",
      ],
      finalConclusion: [
        "DSCR covenant breach is confirmed",
        "Declining trend indicates structural issues",
        "Approximately 10% NOI improvement needed to cure",
        "Consider breach notification and remediation plan",
      ],
    },
    comparison: {
      lenderNarrative: "Lender acknowledges DSCR of 1.08x is below 1.20x covenant minimum. Sponsor has proposed operational improvement plan to restore compliance within 12 months.",
      businessRuleOutcome: "Business rules confirm DSCR breach: Current 1.08x vs 1.20x minimum represents 0.12x shortfall requiring $428K additional NOI annually.",
      appraisalData: "Appraisal stabilized DSCR projection of 1.25x assumes market rent growth of 3% and occupancy stabilization at 94%. Current performance trails these assumptions."
    }
  },
  {
    name: "Yield Metrics",
    rules: [
      {
        name: "Debt Yield Analysis",
        description: "Debt yield provides adequate coverage above minimum threshold.",
        status: "pass",
        riskScore: 2,
        subrules: [
          { name: "Current Debt Yield", description: "8.7% debt yield exceeds 8.0% minimum", status: "pass" },
          { name: "Cushion to Minimum", description: "70 bps cushion above covenant floor", status: "pass" },
          { name: "Trend Analysis", description: "Debt yield declining but still compliant", status: "pass" },
        ],
      },
      {
        name: "Cap Rate Comparison",
        description: "Implied cap rate is in line with market comparables.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Implied Cap Rate", description: "6.2% cap rate within market range", status: "pass" },
          { name: "Market Comparison", description: "Within 30 bps of 5.9% market average", status: "pass" },
          { name: "Valuation Support", description: "Cap rate supports current loan basis", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Debt Yield", value: "8.7%" },
          { label: "Minimum Required", value: "8.0%" },
          { label: "Cap Rate", value: "6.3%" },
        ],
        observations: [
          "Debt yield provides 70 bps cushion above minimum",
          "Cap rate 50 bps above market of 5.8%",
          "Fixed-rate debt provides more favorable yield metrics",
        ],
      },
      lenderJustification: [
        "Debt yield metrics indicate loan is not underwater",
        "Cap rate premium reflects operational challenges",
        "NOI improvement will compress cap rate",
        "Fixed rate protects against yield compression",
      ],
      finalConclusion: [
        "Yield metrics more favorable than DSCR indicates",
        "Loan has recovery potential if operations improve",
        "70 bps yield cushion provides some protection",
        "Monitor yield metrics alongside DSCR",
      ],
    },
    comparison: {
      lenderNarrative: "Lender reports debt yield of 8.7% based on current NOI of $3,850,000 and UPB of $44.2M. Yield covenant of 8.0% minimum remains satisfied.",
      businessRuleOutcome: "Business rules confirm debt yield of 8.7% exceeds 8.0% minimum with 70 bps cushion. Implied cap rate of 6.2% is within 30 bps of market.",
      appraisalData: "Appraisal cap rate conclusion of 5.9% based on 6 comparable sales. Subject implied cap of 6.2% reflects 30 bps premium for operational challenges."
    }
  },
  {
    name: "Break-Even Analysis",
    rules: [
      {
        name: "Economic Break-Even",
        description: "Economic break-even provides minimal cushion against revenue decline.",
        status: "fail",
        riskScore: 4,
        subrules: [
          { name: "Break-Even Level", description: "91.5% economic break-even exceeds 85% threshold", status: "fail" },
          { name: "Revenue Sensitivity", description: "8.5% revenue decline would trigger shortfall", status: "fail" },
          { name: "Operating Leverage", description: "High fixed costs limit flexibility", status: "fail" },
        ],
      },
      {
        name: "Occupancy Break-Even",
        description: "Break-even occupancy is elevated, leaving limited margin for further vacancy increases.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "Break-Even Occupancy", description: "84.2% break-even exceeds 80% threshold", status: "fail" },
          { name: "Cushion to Break-Even", description: "Only 3.3% occupancy cushion (8 units)", status: "fail" },
          { name: "Market Vacancy Trend", description: "Submarket vacancy rising, increasing risk", status: "fail" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Physical Break-Even", value: "84.2%" },
          { label: "Economic Break-Even", value: "91.5%" },
          { label: "Current Occupancy", value: "87.5%" },
        ],
        observations: [
          "Only 3.3% cushion above physical break-even",
          "Operating 4.0% below economic break-even",
          "8 additional vacant units would trigger cash shortfall",
        ],
      },
      lenderJustification: [
        "Debt service reserve provides 6 months coverage",
        "Concession burn-off will improve economic occupancy",
        "Lease expirations weighted to favorable periods",
        "Renewal rates trending above budget",
      ],
      finalConclusion: [
        "Break-even metrics reveal significant vulnerability",
        "Property operating below economic sustainability",
        "Limited margin for further occupancy decline",
        "Debt service reserve provides temporary cushion",
      ],
    },
    comparison: {
      lenderNarrative: "Lender calculates break-even occupancy at 84.2% with current occupancy of 87.5% providing 3.3% cushion or approximately 8 units of vacancy tolerance.",
      businessRuleOutcome: "Business rules flag both break-even metrics: Economic break-even of 91.5% exceeds 85% threshold and occupancy break-even of 84.2% exceeds 80% threshold.",
      appraisalData: "Appraisal break-even analysis assumes stabilized expenses. Current elevated concessions and operating costs push break-even above market norms of 78-82%."
    }
  },
];

const managementRules: RuleCategory[] = [
  {
    name: "Property Management",
    rules: [
      {
        name: "Management Transition",
        description: "Planned management transition creates operational risk during changeover period.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "Transition Timeline", description: "Management change planned for Q2 2026", status: "fail" },
          { name: "New Manager Selection", description: "Replacement manager not yet identified", status: "fail" },
          { name: "Transition Plan", description: "No formal transition plan submitted", status: "fail" },
        ],
      },
      {
        name: "Manager Experience",
        description: "Property management company has adequate experience with similar assets.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Years in Business", description: "15+ years managing multifamily assets", status: "pass" },
          { name: "Portfolio Size", description: "Currently manages 45,000+ units", status: "pass" },
          { name: "Market Knowledge", description: "Strong Phoenix market presence", status: "pass" },
        ],
      },
      {
        name: "Staffing Levels",
        description: "On-site staffing is appropriate for property size.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Staff-to-Unit Ratio", description: "1:45 ratio meets 1:50 threshold", status: "pass" },
          { name: "Maintenance Coverage", description: "2 FTE maintenance staff on-site", status: "pass" },
          { name: "Leasing Staff", description: "Adequate leasing personnel for turnover", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Manager", value: "ABC Property Management" },
          { label: "Experience", value: "15+ years multifamily" },
          { label: "Portfolio Size", value: "8,500 units" },
        ],
        observations: [
          "Qualified manager with extensive experience",
          "12 Phoenix properties in current portfolio",
          "Planned transition to new manager Q2 2026",
        ],
      },
      lenderJustification: [
        "Current manager performing adequately",
        "Transition planned to address performance",
        "New manager selection process underway",
        "Regional office provides direct oversight",
      ],
      finalConclusion: [
        "Management team adequately qualified",
        "Q2 2026 transition introduces operational risk",
        "Critical timing given performance issues",
        "Request transition plan for lender review",
      ],
    },
    comparison: {
      lenderNarrative: "Lender notes current property manager Greystone has 15+ years experience and manages 45,000+ units. Transition to new manager planned for Q2 2026.",
      businessRuleOutcome: "Business rules flag management transition as risk factor. While current manager is qualified, transition during performance improvement period creates operational uncertainty.",
      appraisalData: "Appraisal management analysis notes current team is adequately staffed with 1:41 staff-to-unit ratio. No concerns noted regarding management experience or capabilities."
    }
  },
  {
    name: "Reporting Compliance",
    rules: [
      {
        name: "Insurance Certificate",
        description: "Insurance certificate on file but renewal approaching.",
        status: "pass",
        riskScore: 2,
        subrules: [
          { name: "Current Coverage", description: "Insurance certificate on file and valid", status: "pass" },
          { name: "Renewal Date", description: "Policy expires April 2026 - monitor renewal", status: "pass" },
          { name: "Coverage Adequacy", description: "Coverage amounts meet loan requirements", status: "pass" },
        ],
      },
      {
        name: "Financial Statement Timeliness",
        description: "Financial statements submitted within required timeframes.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Submission Timing", description: "Statements received within 45-day requirement", status: "pass" },
          { name: "Completeness", description: "All required schedules included", status: "pass" },
          { name: "Quality", description: "Statements prepared by qualified CPA", status: "pass" },
        ],
      },
      {
        name: "Rent Roll Submission",
        description: "Rent rolls provided quarterly as required by loan documents.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Submission Frequency", description: "Quarterly rent rolls received on schedule", status: "pass" },
          { name: "Data Completeness", description: "All units and lease terms included", status: "pass" },
          { name: "Format Compliance", description: "Rent roll format meets requirements", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Reporting Status", value: "Current" },
          { label: "Late Reports (12mo)", value: "0" },
          { label: "Insurance Renewal", value: "April 2026" },
        ],
        observations: [
          "Excellent compliance with zero late reports",
          "Financial statements received timely",
          "Monthly rent roll updates provided",
        ],
      },
      lenderJustification: [
        "Borrower demonstrates cooperative behavior",
        "All reporting requirements met or exceeded",
        "Responsive to information requests",
        "No outstanding documentation items",
      ],
      finalConclusion: [
        "Reporting compliance is excellent",
        "Positive indicator for loan administration",
        "Monitor April 2026 insurance renewal",
        "Consider more frequent reporting given concerns",
      ],
    },
    comparison: {
      lenderNarrative: "Lender confirms borrower has maintained excellent reporting compliance with zero late submissions in the past 12 months. All required documents on file.",
      businessRuleOutcome: "Business rules confirm all reporting requirements satisfied. Insurance certificate valid through April 2026, financial statements current through Q3 2025.",
      appraisalData: "Appraisal notes property documentation is well-maintained with complete historical financial records available for analysis."
    }
  },
  {
    name: "Capital Reserves",
    rules: [
      {
        name: "Reserve Balance",
        description: "Capital reserve balance meets minimum requirements.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Current Balance", description: "$1.2M reserve balance exceeds minimum", status: "pass" },
          { name: "Per Unit Reserve", description: "$5,000/unit well above $500/unit requirement", status: "pass" },
          { name: "CapEx Coverage", description: "Reserves cover planned 24-month CapEx", status: "pass" },
        ],
      },
      {
        name: "Reserve Funding",
        description: "Monthly reserve contributions are being made as required.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Monthly Contributions", description: "$25,000/month being deposited as required", status: "pass" },
          { name: "Funding Schedule", description: "No missed contributions in past 12 months", status: "pass" },
          { name: "Annual Funding", description: "$300,000 annual funding meets projections", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Current Balance", value: "$425,000" },
          { label: "Minimum Required", value: "$42,500" },
          { label: "Planned CapEx (24mo)", value: "$850,000" },
        ],
        observations: [
          "Reserve balance at 10x minimum requirement",
          "Monthly contribution of $15,000 building reserves",
          "Planned CapEx adequately covered by reserves",
        ],
      },
      lenderJustification: [
        "Reserves accumulated over loan term",
        "CapEx plan approved by asset management",
        "No draws required in past 12 months",
        "Contribution rate maintains target balance",
      ],
      finalConclusion: [
        "Reserve position is strong and well-funded",
        "Significant cushion for improvements and repairs",
        "Mitigating factor given operational challenges",
        "No adjustment required to reserve structure",
      ],
    },
    comparison: {
      lenderNarrative: "Lender reports capital reserve balance of $1.24M with monthly contributions of $25,000 being made as required. Balance is 10x minimum requirement.",
      businessRuleOutcome: "Business rules confirm reserve balance of $5,000/unit significantly exceeds $500/unit minimum requirement. All funding obligations being met.",
      appraisalData: "Appraisal capital needs analysis identifies $850K of improvements over 24 months. Current reserve balance provides adequate coverage for planned and contingency CapEx."
    }
  },
  {
    name: "Sponsor Monitoring",
    rules: [
      {
        name: "Sponsor Portfolio Performance",
        description: "Other properties in sponsor portfolio showing mixed performance.",
        status: "fail",
        riskScore: 3,
        subrules: [
          { name: "Watchlist Properties", description: "2 properties currently on watchlist", status: "fail" },
          { name: "Portfolio Concentration", description: "Phoenix market represents 35% of portfolio", status: "fail" },
          { name: "Cross-Default Risk", description: "Other assets may compete for sponsor attention", status: "fail" },
        ],
      },
      {
        name: "Sponsor Financial Condition",
        description: "Sponsor financial statements indicate adequate liquidity for potential shortfalls.",
        status: "pass",
        riskScore: 1,
        subrules: [
          { name: "Liquidity Position", description: "$45M liquidity exceeds 12 months debt service", status: "pass" },
          { name: "Net Worth", description: "$380M net worth provides strong support", status: "pass" },
          { name: "Credit History", description: "No defaults in 15+ year track record", status: "pass" },
        ],
      },
    ],
insight: {
      factPattern: {
        facts: [
          { label: "Sponsor Net Worth", value: "$85M" },
          { label: "Liquidity", value: "$12.5M" },
          { label: "Portfolio Size", value: "2,800 units" },
        ],
        observations: [
          "Liquidity covers 36 months of debt service",
          "2 other properties currently on watchlist",
          "8-year relationship with no default history",
        ],
      },
      lenderJustification: [
        "Strong financial capacity demonstrated",
        "Liquidity well exceeds 12-month requirement",
        "Portfolio diversified across markets",
        "Track record of supporting distressed assets",
      ],
      finalConclusion: [
        "Sponsor financial capacity is strong",
        "Watchlist properties may limit attention",
        "Long relationship is positive indicator",
        "Willingness to support assets is demonstrated",
      ],
    },
    comparison: {
      lenderNarrative: "Lender notes sponsor Sunshine Holdings LLC maintains $45M liquidity and $380M net worth with 15+ year track record and no defaults.",
      businessRuleOutcome: "Business rules flag 2 properties on watchlist including subject loan. Phoenix market represents 35% of sponsor portfolio, creating concentration risk.",
      appraisalData: "Appraisal notes sponsor has successfully managed $2.1B multifamily portfolio. Recent market conditions have impacted performance across Phoenix holdings."
    }
  },
];

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CircularProgressRing({
  score,
  maxScore,
  size = 70,
  strokeWidth = 7,
}: {
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
}) {
  const percentage = (score / maxScore) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return "#10b981"; // pass color
    if (percentage >= 50) return "#f59e0b"; // medium color
    return "#ef4444"; // fail color
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

function SegmentedScoreBar({
  score,
  maxScore,
  segments = 10,
}: {
  score: number;
  maxScore: number;
  segments?: number;
}) {
  const percentage = (score / maxScore) * 100;
  const filledSegments = Math.round((score / maxScore) * segments);

  const getColor = () => {
    if (percentage >= 70) return "text-pass";
    if (percentage >= 50) return "text-medium";
    return "text-fail";
  };

  const getBarColor = () => {
    if (percentage >= 70) return "bg-pass";
    if (percentage >= 50) return "bg-medium";
    return "bg-fail";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2.5 w-3 rounded-sm",
              i < filledSegments ? getBarColor() : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className={cn("text-xl font-bold", getColor())}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

function getRiskScoreBadgeStyle(score: number) {
  switch (score) {
    case 4:
      return "border-fail/40 bg-fail/10 text-fail";
    case 3:
      return "border-chart-2/40 bg-chart-2/10 text-chart-2";
    case 2:
      return "border-medium/40 bg-medium/10 text-medium";
    default:
      return "border-pass/40 bg-pass/10 text-pass";
  }
}

function getRiskScoreLabel(score: number) {
  switch (score) {
    case 4:
      return "Significantly Below Expectation";
    case 3:
      return "Below Expectation";
    case 2:
      return "Meets Expectation";
    default:
      return "Meets/Exceeds Expectation";
  }
}

function RuleCard({ 
  rule, 
  comment,
  subruleComments,
  onSaveComment,
  onSaveSubruleComment 
}: { 
  rule: Rule;
  comment?: string;
  subruleComments?: Record<string, string>;
  onSaveComment: (ruleName: string, comment: string) => void;
  onSaveSubruleComment: (ruleName: string, subruleName: string, comment: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState(comment || "");
  const [openSubruleComment, setOpenSubruleComment] = useState<string | null>(null);
  const [subruleCommentText, setSubruleCommentText] = useState<Record<string, string>>(subruleComments || {});
  const isPassing = rule.status === "pass";
  const isNA = rule.status === "n/a";
  
  const handleSaveComment = () => {
    onSaveComment(rule.name, commentText);
    setIsCommentOpen(false);
  };
  
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors relative",
        isNA
          ? "border-muted bg-muted/30"
          : isPassing
            ? "border-border bg-card"
            : "border-fail/20 bg-fail/[0.02]"
      )}
    >
      {/* Clickable Header Row */}
      <div className="flex w-full items-center justify-between gap-4 p-5">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="text-lg font-semibold text-foreground">{rule.name}</h4>
            {rule.ruleId && (
              <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Rule ID: {rule.ruleId}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-3">
          {/* Comment Icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCommentOpen(!isCommentOpen);
            }}
            className={cn(
              "relative rounded-md p-1.5 transition-colors hover:bg-muted",
              comment ? "text-accent" : "text-muted-foreground hover:text-foreground"
            )}
            title="Add comment"
          >
            <MessageSquare className="h-5 w-5" />
            {comment && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
          {isNA ? (
            <span className="text-sm font-medium text-muted-foreground shrink-0">N/A</span>
          ) : isPassing ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 text-pass" />
          ) : (
            <XCircle className="h-6 w-6 shrink-0 text-fail" />
          )}
        </div>
      </div>
      
      {/* Comment Popup */}
      {isCommentOpen && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h5 className="text-sm font-semibold text-foreground">Comment for: {rule.name}</h5>
            <button
              type="button"
              onClick={() => setIsCommentOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Enter your comment here..."
            className="mb-3 min-h-[100px] resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommentOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveComment}
            >
              Save Comment
            </Button>
          </div>
        </div>
      )}
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <p className="text-base leading-relaxed text-muted-foreground">{rule.description}</p>
          
          {/* Subrules Section */}
          {rule.subrules && rule.subrules.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Subrules</h5>
              <div className="space-y-2">
                {rule.subrules.map((subrule, index) => (
                  <div key={index} className="relative">
                    <div
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-lg border p-3",
                        subrule.status === "n/a"
                          ? "border-muted bg-muted/30"
                          : subrule.status === "pass"
                            ? "border-pass/20 bg-pass/5"
                            : "border-fail/20 bg-fail/5"
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {subrule.status === "n/a" ? (
                          <span className="mt-0.5 text-xs font-medium text-muted-foreground shrink-0">N/A</span>
                        ) : subrule.status === "pass" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pass" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-fail" />
                        )}
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            subrule.status === "n/a" ? "text-muted-foreground" : "text-foreground"
                          )}>{subrule.name}</p>
                          <p className="text-sm text-muted-foreground">{subrule.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Subrule Comment Button */}
                        <button
                          type="button"
                          onClick={() => setOpenSubruleComment(openSubruleComment === subrule.name ? null : subrule.name)}
                          className={cn(
                            "rounded-md p-1 transition-colors hover:bg-muted",
                            subruleCommentText[subrule.name] ? "text-accent" : "text-muted-foreground hover:text-foreground"
                          )}
                          title="Add comment"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {subrule.status === "n/a" ? (
                          <span className="text-xs font-medium text-muted-foreground shrink-0">N/A</span>
                        ) : subrule.status === "pass" ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-pass" />
                        ) : (
                          <XCircle className="h-5 w-5 shrink-0 text-fail" />
                        )}
                      </div>
                    </div>
                    {/* Subrule Comment Popup */}
                    {openSubruleComment === subrule.name && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 shadow-lg">
                        <div className="mb-2 flex items-center justify-between">
                          <h6 className="text-xs font-semibold text-foreground">Comment: {subrule.name}</h6>
                          <button
                            type="button"
                            onClick={() => setOpenSubruleComment(null)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <Textarea
                          value={subruleCommentText[subrule.name] || ""}
                          onChange={(e) => setSubruleCommentText({...subruleCommentText, [subrule.name]: e.target.value})}
                          placeholder="Enter comment..."
                          className="mb-2 min-h-[60px] resize-none text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenSubruleComment(null)}
                            className="h-7 bg-transparent text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              onSaveSubruleComment(rule.name, subrule.name, subruleCommentText[subrule.name] || "");
                              setOpenSubruleComment(null);
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RiskInsightPanel({ insight, onClose }: { insight: RiskInsight; onClose: () => void }) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-5 max-h-[500px] overflow-y-auto">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          <h4 className="text-lg font-semibold text-foreground">Risk Insight</h4>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Fact Pattern Section */}
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fact Pattern
        </h5>
        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
          {/* Facts */}
          <div className="text-base leading-relaxed text-foreground">
            {insight.factPattern.facts.map((fact, index) => (
              <div key={index}>
                <span className="font-semibold">{fact.label}:</span> {fact.value}
              </div>
            ))}
          </div>
          {/* Observations */}
          <ul className="list-disc list-inside space-y-1 text-base text-foreground">
            {insight.factPattern.observations.map((obs, index) => (
              <li key={index}>{obs}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Lender Justification Section */}
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lender Justification
        </h5>
        <ul className="rounded-lg border border-border bg-card p-3 list-disc list-inside space-y-1 text-base text-foreground">
          {insight.lenderJustification.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      
      {/* Final Conclusion Section */}
      <div>
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Final Conclusion
        </h5>
        <ul className="rounded-lg border border-border bg-card p-3 list-disc list-inside space-y-1 text-base text-foreground">
          {insight.finalConclusion.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ComparisonPanel({
  comparison,
  categoryName,
  onClose,
}: {
  comparison: ComparisonData;
  categoryName: string;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-4 rounded-xl border border-accent/30 bg-accent/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-accent" />
          <h4 className="text-lg font-semibold text-foreground">
            Comparison: {categoryName}
          </h4>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Lender Narrative */}
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Lender Narrative
        </h5>
        <p className="rounded-lg border border-border bg-card p-3 text-base leading-relaxed text-foreground">
          {comparison.lenderNarrative}
        </p>
      </div>

      {/* Appraisal Data - Moved to middle */}
      <div className="mb-4">
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Appraisal Data
        </h5>
        <p className="rounded-lg border border-border bg-card p-3 text-base leading-relaxed text-foreground">
          {comparison.appraisalData}
        </p>
      </div>

      {/* Business Rule Outcome */}
      <div>
        <h5 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Business Rule Outcome
        </h5>
        <p className="rounded-lg border border-border bg-card p-3 text-base leading-relaxed text-foreground">
          {comparison.businessRuleOutcome}
        </p>
      </div>
    </div>
  );
}

function RuleCategorySection({
  category,
  isExpanded,
  isInsightOpen,
  isComparisonOpen,
  onToggleExpand,
  onToggleInsight,
  onToggleComparison,
  comments,
  subruleComments,
  onSaveComment,
  onSaveSubruleComment,
}: {
  category: RuleCategory;
  isExpanded: boolean;
  isInsightOpen: boolean;
  isComparisonOpen: boolean;
  onToggleExpand: () => void;
  onToggleInsight: () => void;
  onToggleComparison: () => void;
  comments: Record<string, string>;
  subruleComments: Record<string, Record<string, string>>;
  onSaveComment: (categoryName: string, ruleName: string, comment: string) => void;
  onSaveSubruleComment: (categoryName: string, ruleName: string, subruleName: string, comment: string) => void;
}) {
  const passCount = category.rules.filter((r) => r.status === "pass").length;
  const failCount = category.rules.filter((r) => r.status === "fail").length;
  const naCount = category.rules.filter((r) => r.status === "n/a").length;
  const totalApplicable = passCount + failCount;

  // Sort rules by risk score (highest/worst first)
  const sortedRules = [...category.rules].sort((a, b) => b.riskScore - a.riskScore);

  // Determine overall status: PASS if all applicable rules pass, FAIL otherwise
  const overallStatus = failCount === 0 ? "PASS" : "FAIL";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Collapsible Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
      >
        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        
        {/* Category Name */}
        <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
        
        {/* Status Badge */}
        <span
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-semibold w-16 text-center",
            overallStatus === "PASS"
              ? "bg-pass/10 text-pass border border-pass/30"
              : "bg-fail/10 text-fail border border-fail/30"
          )}
        >
          {overallStatus}
        </span>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpanded) {
                onToggleExpand();
              }
              onToggleInsight();
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm",
              isInsightOpen
                ? "border border-accent bg-transparent text-accent hover:bg-accent/10"
                : "bg-gradient-to-r from-accent/90 to-accent text-white hover:from-accent hover:to-accent/90 hover:shadow-md"
            )}
            title="View Risk Insight"
          >
            <Lightbulb className="h-4 w-4" />
            View Insight
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isExpanded) {
                onToggleExpand();
              }
              onToggleComparison();
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm",
              isComparisonOpen
                ? "border border-accent bg-transparent text-accent hover:bg-accent/10"
                : "bg-gradient-to-r from-accent/90 to-accent text-white hover:from-accent hover:to-accent/90 hover:shadow-md"
            )}
            title="View Comparison"
          >
            <GitCompare className="h-4 w-4" />
            View Comparison
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-5 py-4 space-y-4">
          {/* Rules Content */}
          {isInsightOpen || isComparisonOpen ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                {sortedRules.map((rule) => (
                  <RuleCard
                    key={rule.name}
                    rule={rule}
                    comment={comments[rule.name]}
                    subruleComments={subruleComments?.[rule.name]}
                    onSaveComment={(ruleName, comment) =>
                      onSaveComment(category.name, ruleName, comment)
                    }
                    onSaveSubruleComment={(ruleName, subruleName, comment) =>
                      onSaveSubruleComment(category.name, ruleName, subruleName, comment)
                    }
                  />
                ))}
              </div>
              {isInsightOpen && (
                <RiskInsightPanel insight={category.insight} onClose={onToggleInsight} />
              )}
              {isComparisonOpen && (
                <ComparisonPanel
                  comparison={category.comparison}
                  categoryName={category.name}
                  onClose={onToggleComparison}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRules.map((rule) => (
                <RuleCard
                  key={rule.name}
                  rule={rule}
                  comment={comments[rule.name]}
                  subruleComments={subruleComments?.[rule.name]}
                  onSaveComment={(ruleName, comment) =>
                    onSaveComment(category.name, ruleName, comment)
                  }
                  onSaveSubruleComment={(ruleName, subruleName, comment) =>
                    onSaveSubruleComment(category.name, ruleName, subruleName, comment)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LoanDetailPage({ loanId, onNavigateToRedFlagReview }: LoanDetailPageProps) {
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"income" | "valuation">("income");
  const [openInsights, setOpenInsights] = useState<Record<string, boolean>>({});
  const [openComparisons, setOpenComparisons] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Record<string, string>>>({});
  const [subruleComments, setSubruleComments] = useState<Record<string, Record<string, Record<string, string>>>>({});
  const [incomePageComment, setIncomePageComment] = useState("");
  const [valuationPageComment, setValuationPageComment] = useState("");
  const [jsonRuleCategoriesBySection, setJsonRuleCategoriesBySection] = useState<Record<string, UiRuleCategory[]> | null>(null);
  const [jsonRiskInsights, setJsonRiskInsights] = useState<{
    summary_narrative?: string;
    key_risk_areas?: string[];
  } | null>(null);
  const [propertyAddressFromFacts, setPropertyAddressFromFacts] =
    useState<ParsedPropertyAddress | null>(null);
  const [jsonLoanSummary, setJsonLoanSummary] = useState<Record<string, unknown> | null>(null);
  const [loanSummaryScores, setLoanSummaryScores] = useState<LoanSummaryScores | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    fetch("/api/test-json")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load test.json: ${r.status}`);
        return await r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        // Always set headline scores first; other parsing should never block them.
        setLoanSummaryScores(pickLoanSummaryScores(data));

        try {
          setJsonRuleCategoriesBySection(buildRuleCategoriesBySectionFromTestJson(data));
        } catch {
          setJsonRuleCategoriesBySection(null);
        }

        try {
          setJsonRiskInsights(
            data && typeof data === "object" && "risk_insights" in data
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((data as any).risk_insights ?? null)
              : null
          );
        } catch {
          setJsonRiskInsights(null);
        }

        try {
          const statement = pickLoanSummaryStatement(data);
          setPropertyAddressFromFacts(parsePropertyAddressFromLoanSummaryStatement(statement));
        } catch {
          setPropertyAddressFromFacts(null);
        }

        try {
          setJsonLoanSummary(
            data && typeof data === "object" && "loan_summary" in data
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ((data as any).loan_summary && typeof (data as any).loan_summary === "object"
                  ? ((data as any).loan_summary as Record<string, unknown>)
                  : null)
              : null
          );
        } catch {
          setJsonLoanSummary(null);
        }
      })
      .catch(() => {
        // If fetch fails (missing file, etc.), keep the hard-coded fallback rules.
        if (!isMounted) return;
        setJsonRuleCategoriesBySection(null);
        setJsonRiskInsights(null);
        setPropertyAddressFromFacts(null);
        setLoanSummaryScores(null);
        setJsonLoanSummary(null);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLoan: LoanListLoan | null =
    typeof loanId === "string" && loanId.trim().length > 0
      ? loansData.find((l) => l.id === loanId) ?? null
      : null;

  const mappedLoanDetails = selectedLoan
    ? {
        propertyName: selectedLoan.address,
        financingType: selectedLoan.financing,
        loanNumber: selectedLoan.loanNumber,
        loanAmount: selectedLoan.loanAmount,
        propertyType: selectedLoan.propertyType,
        acquisitionDate: selectedLoan.acquisitionDate,
        lenderName: selectedLoan.lenderName,
        propertyAddress: `${selectedLoan.address}, ${selectedLoan.city}, ${selectedLoan.state}`,
        currentUPB: selectedLoan.upb,
        productType: selectedLoan.loanType,
        commitmentDate: selectedLoan.commitmentDate,
        borrower: "—",
        riskScore: selectedLoan.riskScore as 1 | 2 | 3 | 4,
        complianceScore: selectedLoan.complianceScore,
        units: selectedLoan.units,
        occupancy: selectedLoan.occupancy,
        dscr: selectedLoan.dscr,
        ltv: selectedLoan.ltv,
        noi: 0,
        debtYield: 0,
      }
    : null;

  const baseLoanDetails = mappedLoanDetails ?? loanDetails;

  const narrativeText = jsonRiskInsights?.summary_narrative?.trim();
  const narrativeParagraphs =
    narrativeText && narrativeText.length > 0
      ? narrativeText.split(/\n\s*\n/).filter(Boolean)
      : [summaryNarrative.overview, summaryNarrative.riskAssessment];

  const keyRiskAreas =
    jsonRiskInsights?.key_risk_areas && jsonRiskInsights.key_risk_areas.length > 0
      ? jsonRiskInsights.key_risk_areas
      : summaryNarrative.keyRiskAreas;

  const textOrDash = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "string") return value.trim() ? value : "—";
    return String(value);
  };

  const pickLoanSummaryField = (...keys: string[]): unknown => {
    if (!jsonLoanSummary) return undefined;
    for (const key of keys) {
      if (key in jsonLoanSummary) return jsonLoanSummary[key];
    }
    return undefined;
  };

  const jsonLoanNumberCandidate =
    jsonLoanSummary !== null
      ? textOrDash(pickLoanSummaryField("loan_number", "loanNumber", "loan_id", "loanId"))
      : null;

  const hasJsonLoanSummary =
    jsonLoanSummary !== null &&
    selectedLoan !== null &&
    typeof jsonLoanNumberCandidate === "string" &&
    jsonLoanNumberCandidate !== "—" &&
    jsonLoanNumberCandidate === selectedLoan.loanNumber;

  const displayRiskScore = loanSummaryScores?.riskScore ?? baseLoanDetails.riskScore;

  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const displayedLoanDetails = {
    ...baseLoanDetails,
    loanNumber: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("loan_number", "loanNumber", "loan_id", "loanId"))
      : baseLoanDetails.loanNumber,
    loanAmount: hasJsonLoanSummary
      ? (toNumber(pickLoanSummaryField("loan_amount", "loanAmount")) ?? Number.NaN)
      : baseLoanDetails.loanAmount,
    propertyType: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("property_type", "propertyType"))
      : baseLoanDetails.propertyType,
    acquisitionDate: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("acquisition_date", "acquisitionDate"))
      : baseLoanDetails.acquisitionDate,
    lenderName: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("lender_name", "lenderName"))
      : baseLoanDetails.lenderName,
    currentUPB: hasJsonLoanSummary
      ? (toNumber(pickLoanSummaryField("upb", "current_upb", "currentUPB")) ?? Number.NaN)
      : baseLoanDetails.currentUPB,
    productType: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("product_type", "productType"))
      : baseLoanDetails.productType,
    commitmentDate: hasJsonLoanSummary
      ? textOrDash(pickLoanSummaryField("commitment_date", "commitmentDate"))
      : baseLoanDetails.commitmentDate,
    borrower: hasJsonLoanSummary ? textOrDash(pickLoanSummaryField("borrower")) : baseLoanDetails.borrower,
    riskScore: displayRiskScore,
  };
  
  const toggleInsight = (categoryName: string) => {
    setOpenInsights((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
    // Close comparison if opening insight
    if (!openInsights[categoryName]) {
      setOpenComparisons((prev) => ({
        ...prev,
        [categoryName]: false,
      }));
    }
  };

  const toggleComparison = (categoryName: string) => {
    setOpenComparisons((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
    // Close insight if opening comparison
    if (!openComparisons[categoryName]) {
      setOpenInsights((prev) => ({
        ...prev,
        [categoryName]: false,
      }));
    }
  };

  const savePageComment = () => {
    // In a real app, this would save to a database
    alert("Comments saved successfully!");
  };

  const toggleExpanded = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };
  
  const handleSaveComment = (categoryName: string, ruleName: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [categoryName]: {
        ...(prev[categoryName] || {}),
        [ruleName]: comment,
      }
    }));
  };
  
  const exportCommentsToCSV = () => {
    const rows: string[][] = [["Category", "Rule Name", "Comment", "Timestamp"]];
    const timestamp = new Date().toISOString();
    
    Object.entries(comments).forEach(([categoryName, categoryComments]) => {
      Object.entries(categoryComments).forEach(([ruleName, comment]) => {
        if (comment.trim()) {
          rows.push([categoryName, ruleName, comment, timestamp]);
        }
      });
    });
    
    if (rows.length === 1) {
      alert("No comments to export");
      return;
    }
    
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `loan-comments-${displayedLoanDetails.loanNumber}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
const analysisData = {
    income: { 
      title: "Income & Expense", 
      rules: (() => {
        if (!jsonRuleCategoriesBySection) return incomeExpenseRules;
        const incomeKey =
          Object.keys(jsonRuleCategoriesBySection).find((k) => k.toLowerCase().includes("income")) ??
          Object.keys(jsonRuleCategoriesBySection)[0];
        const fromJson = incomeKey ? jsonRuleCategoriesBySection[incomeKey] : undefined;
        return (fromJson && fromJson.length > 0 ? (fromJson as unknown as RuleCategory[]) : incomeExpenseRules);
      })()
    },
    // Valuation intentionally starts empty (no summary / rules entries yet).
    valuation: { title: "Valuation Analysis", rules: [] as RuleCategory[] },
  };
  
  const currentAnalysis = analysisData[activeAnalysisTab];
  const hasCurrentAnalysisRules = (currentAnalysis.rules?.length ?? 0) > 0;
  
  const totalComments = Object.values(comments).reduce(
    (acc, categoryComments) => acc + Object.values(categoryComments).filter(c => c.trim()).length,
    0
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loan Detail Analysis</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Comprehensive loan review and risk assessment
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 bg-transparent text-base">
            <Download className="h-5 w-5" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent text-base">
            <Printer className="h-5 w-5" />
            Print View
          </Button>
        </div>
      </div>

      {/* Loan Details Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent/10">
            <Building2 className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-card-foreground">
              {displayedLoanDetails.propertyName} - {displayedLoanDetails.financingType}
            </h2>
            {hasJsonLoanSummary && propertyAddressFromFacts ? (
              <div className="text-base leading-snug text-muted-foreground">
                <p>{propertyAddressFromFacts.street}</p>
                {propertyAddressFromFacts.city &&
                propertyAddressFromFacts.state &&
                propertyAddressFromFacts.postalCode ? (
                  <p>
                    {propertyAddressFromFacts.city}, {propertyAddressFromFacts.state}{" "}
                    {propertyAddressFromFacts.postalCode}
                  </p>
                ) : (
                  <p className="sr-only">{propertyAddressFromFacts.formattedSingleLine}</p>
                )}
              </div>
            ) : (
              <p className="text-base text-muted-foreground">{displayedLoanDetails.propertyAddress}</p>
            )}
          </div>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Loan Number</p>
            <p className="text-base font-semibold text-foreground">{displayedLoanDetails.loanNumber}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Loan Amount</p>
            <p className="text-base font-semibold text-foreground">{formatCurrency(displayedLoanDetails.loanAmount)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Property Type</p>
            <p className="text-base font-semibold text-foreground">{displayedLoanDetails.propertyType}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Acquisition Date</p>
            <p className="text-base font-semibold text-foreground">{formatDate(displayedLoanDetails.acquisitionDate)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Lender Name</p>
            <p className="text-base font-semibold text-foreground">{displayedLoanDetails.lenderName}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Current UPB</p>
            <p className="text-base font-semibold text-foreground">{formatCurrency(displayedLoanDetails.currentUPB)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Product Type</p>
            <p className="text-base font-semibold text-foreground">{displayedLoanDetails.productType}</p>
          </div>
          <div className="space-y-1.5">
<p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Commitment Date</p>
          <p className="text-base font-semibold text-foreground">{formatDate(displayedLoanDetails.commitmentDate)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Borrower</p>
            <p className="text-base font-semibold text-foreground">{displayedLoanDetails.borrower}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Risk Score</p>
            <div className="flex items-center gap-3">
              {/* Gauge/Meter Arc Icon */}
              <svg width="48" height="30" viewBox="0 0 36 22" className="flex-shrink-0">
                {/* Arc background segments */}
                <path
                  d="M 4 20 A 14 14 0 0 1 10 8"
                  fill="none"
                  stroke={displayRiskScore === 1 ? "#22c55e" : "#e5e7eb"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 11 7 A 14 14 0 0 1 18 5"
                  fill="none"
                  stroke={displayRiskScore <= 2 ? "#22c55e" : "#e5e7eb"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 19 5 A 14 14 0 0 1 26 7"
                  fill="none"
                  stroke={displayRiskScore === 3 ? "#eab308" : "#e5e7eb"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 27 8 A 14 14 0 0 1 32 20"
                  fill="none"
                  stroke={displayRiskScore === 4 ? "#ef4444" : "#e5e7eb"}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {/* Needle */}
                <line
                  x1="18"
                  y1="20"
                  x2={displayRiskScore === 1 ? 8 : displayRiskScore === 2 ? 13 : displayRiskScore === 3 ? 23 : 28}
                  y2={displayRiskScore === 1 ? 12 : displayRiskScore === 2 ? 7 : displayRiskScore === 3 ? 7 : 12}
                  stroke={displayRiskScore <= 2 ? "#22c55e" : displayRiskScore === 3 ? "#eab308" : "#ef4444"}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Center dot */}
                <circle 
                  cx="18" 
                  cy="20" 
                  r="2.5" 
                  fill={displayRiskScore <= 2 ? "#22c55e" : displayRiskScore === 3 ? "#eab308" : "#ef4444"} 
                />
              </svg>
              <span className={cn(
                "text-2xl font-bold",
                displayRiskScore <= 2 ? "text-pass" : 
                displayRiskScore === 3 ? "text-medium" : "text-fail"
              )}>
                {displayRiskScore}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Compliance Score</p>
            {(() => {
              const fallbackPassed =
                incomeExpenseRules.reduce(
                  (acc, cat) => acc + cat.rules.filter((r) => r.status === "pass").length,
                  0
                ) +
                valuationRules.reduce(
                  (acc, cat) => acc + cat.rules.filter((r) => r.status === "pass").length,
                  0
                );
              const fallbackTotal =
                incomeExpenseRules.reduce(
                  (acc, cat) =>
                    acc + cat.rules.filter((r) => r.status === "pass" || r.status === "fail").length,
                  0
                ) +
                valuationRules.reduce(
                  (acc, cat) =>
                    acc + cat.rules.filter((r) => r.status === "pass" || r.status === "fail").length,
                  0
                );

              const passed =
                loanSummaryScores?.compliance.passed ??
                selectedLoan?.complianceScoreData.passed ??
                fallbackPassed;
              const total =
                loanSummaryScores?.compliance.total ??
                selectedLoan?.complianceScoreData.total ??
                fallbackTotal;
              const percentage = total > 0 ? (passed / total) * 100 : 0;
              const fillColor = percentage >= 70 ? "#22c55e" : percentage >= 50 ? "#eab308" : "#ef4444";
              const colorClass = percentage >= 70 ? "text-pass" : percentage >= 50 ? "text-medium" : "text-fail";
              const filledSegments = Math.round((percentage / 100) * 5);
              
              return (
                <div className="flex items-center gap-3">
                  {/* Horizontal segmented bar - 5 segments for approximate progress */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-5 w-4 rounded-sm"
                        style={{
                          backgroundColor: i < filledSegments ? fillColor : "#e5e7eb"
                        }}
                      />
                    ))}
                  </div>
                  <span className={cn("text-2xl font-bold", colorClass)}>
                    {passed}/{total}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Units</p>
            <p className="text-base font-semibold text-foreground">{baseLoanDetails.units}</p>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent" />
          <h2 className="text-xl font-semibold text-card-foreground">Summary Narrative</h2>
        </div>
        
        <div className="space-y-4">
          {narrativeParagraphs.map((p, idx) => (
            <p key={idx} className="text-base leading-relaxed text-foreground">
              {p}
            </p>
          ))}
        </div>
        
        {/* Key Risk Areas */}
        <div className="mt-6 rounded-lg border border-fail/20 bg-fail/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-fail" />
            <h3 className="text-lg font-semibold text-foreground">Key Risk Areas Identified</h3>
          </div>
          <ul className="space-y-2.5">
            {keyRiskAreas.map((risk, index) => (
              <li key={index} className="flex items-start gap-2.5 text-base text-foreground">
                <span className="mt-2 block h-2 w-2 shrink-0 rounded-full bg-fail" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

{/* Detailed Rule Analysis */}
  <div className="rounded-xl border border-border bg-card p-6">
  <div className="mb-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Shield className="h-6 w-6 text-accent" />
      <h2 className="text-xl font-semibold text-card-foreground">Detailed Rule Analysis</h2>
    </div>
    <Button 
      variant="destructive" 
      className="gap-2 text-base"
      onClick={onNavigateToRedFlagReview}
    >
      <Flag className="h-5 w-5" />
      Red Flag Review
    </Button>
  </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveAnalysisTab("income")}
            className={cn(
              "px-4 py-3 text-base font-medium transition-colors border-b-2 -mb-[2px]",
              activeAnalysisTab === "income"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Income & Expense
          </button>
          <button
            onClick={() => setActiveAnalysisTab("valuation")}
            className={cn(
              "px-4 py-3 text-base font-medium transition-colors border-b-2 -mb-[2px]",
              activeAnalysisTab === "valuation"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Valuation
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Header with Risk Score and Compliance Score */}
          <div className="rounded-lg border border-border bg-muted/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-semibold text-foreground">{currentAnalysis.title}</h3>
              <div className="flex flex-wrap items-center gap-6">
                {/* Risk Score */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Risk Score:</span>
                  {(() => {
                    const riskScore = displayRiskScore;
                    const fillColor = riskScore <= 2 ? "#22c55e" : riskScore === 3 ? "#eab308" : "#ef4444";
                    return (
                      <div className="flex items-center gap-2">
                        {/* Gauge/Meter Arc Icon */}
                        <svg width="36" height="22" viewBox="0 0 36 22" className="flex-shrink-0">
                          <path
                            d="M 4 20 A 14 14 0 0 1 10 8"
                            fill="none"
                            stroke={riskScore === 1 ? "#22c55e" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 11 7 A 14 14 0 0 1 18 5"
                            fill="none"
                            stroke={riskScore <= 2 ? "#22c55e" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 19 5 A 14 14 0 0 1 26 7"
                            fill="none"
                            stroke={riskScore === 3 ? "#eab308" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 27 8 A 14 14 0 0 1 32 20"
                            fill="none"
                            stroke={riskScore === 4 ? "#ef4444" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <line
                            x1="18"
                            y1="20"
                            x2={riskScore === 1 ? 8 : riskScore === 2 ? 13 : riskScore === 3 ? 23 : 28}
                            y2={riskScore === 1 ? 12 : riskScore === 2 ? 7 : riskScore === 3 ? 7 : 12}
                            stroke={fillColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle cx="18" cy="20" r="2.5" fill={fillColor} />
                        </svg>
                        <span
                          className={cn(
                            "text-lg font-bold",
                            riskScore <= 2
                              ? "text-pass"
                              : riskScore === 3
                                ? "text-medium"
                                : "text-fail"
                          )}
                        >
                          {riskScore}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                {/* Compliance Score */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Compliance Score:</span>
                  {(() => {
                    if (!hasCurrentAnalysisRules) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div
                                key={i}
                                className="h-4 w-3 rounded-sm"
                                style={{ backgroundColor: "#e5e7eb" }}
                              />
                            ))}
                          </div>
                          <span className="text-lg font-bold text-muted-foreground">—</span>
                        </div>
                      );
                    }

                    const fallbackPassed = currentAnalysis.rules.reduce(
                      (acc, cat) => acc + cat.rules.filter((r) => r.status === "pass").length,
                      0
                    );
                    const fallbackTotal = currentAnalysis.rules.reduce(
                      (acc, cat) =>
                        acc +
                        cat.rules.filter((r) => r.status === "pass" || r.status === "fail").length,
                      0
                    );

                    const passed =
                      loanSummaryScores?.compliance.passed ??
                      selectedLoan?.complianceScoreData.passed ??
                      fallbackPassed;
                    const total =
                      loanSummaryScores?.compliance.total ??
                      selectedLoan?.complianceScoreData.total ??
                      fallbackTotal;
const percentage = total > 0 ? (passed / total) * 100 : 0;
const fillColor = percentage >= 70 ? "#22c55e" : percentage >= 50 ? "#eab308" : "#ef4444";
const colorClass = percentage >= 70 ? "text-pass" : percentage >= 50 ? "text-medium" : "text-fail";
const filledSegments = Math.round((percentage / 100) * 5);
  
  return (
  <div className="flex items-center gap-2">
  {/* Horizontal segmented bar - 5 segments */}
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="h-4 w-3 rounded-sm"
        style={{
          backgroundColor: i < filledSegments ? fillColor : "#e5e7eb"
        }}
      />
    ))}
  </div>
  <span className={cn("text-lg font-bold", colorClass)}>
  {passed}/{total}
  </span>
  </div>
  );
                  })()}
                </div>
              </div>
            </div>

            {/* Summary Section */}
            {activeAnalysisTab === "income" && (
              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Summary
                </h4>
                <p className="text-base leading-relaxed text-foreground">
                  {`The Income & Expense section covers ${currentAnalysis.rules.length} rule categories with ${currentAnalysis.rules.reduce((acc, cat) => acc + cat.rules.length, 0)} individual rules. Key areas reviewed include Net Rental Income, Market Rent, Other Income, Occupancy, Operating Expenses, Insurance, Payroll, and Utilities. ${currentAnalysis.rules.reduce((acc, cat) => acc + cat.rules.filter((r) => r.status === "fail").length, 0)} rules require attention, primarily in areas related to insurance underwriting and expense trending assumptions.`}
                </p>
              </div>
            )}
          </div>

          {activeAnalysisTab === "income" &&
            currentAnalysis.rules.map((category) => (
              <RuleCategorySection
                key={category.name}
                category={category}
                isExpanded={expandedCategories[category.name] || false}
                isInsightOpen={openInsights[category.name] || false}
                isComparisonOpen={openComparisons[category.name] || false}
                onToggleExpand={() => toggleExpanded(category.name)}
                onToggleInsight={() => toggleInsight(category.name)}
                onToggleComparison={() => toggleComparison(category.name)}
                comments={comments[category.name] || {}}
                onSaveComment={handleSaveComment}
              />
            ))}

          {/* Additional Comments Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-5">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              <h4 className="text-lg font-semibold text-foreground">
                Additional Comments - {activeAnalysisTab === "income" ? "Income & Expense" : "Valuation"}
              </h4>
            </div>
            <Textarea
              value={activeAnalysisTab === "income" ? incomePageComment : valuationPageComment}
              onChange={(e) =>
                activeAnalysisTab === "income"
                  ? setIncomePageComment(e.target.value)
                  : setValuationPageComment(e.target.value)
              }
              placeholder={`Enter any additional comments about ${activeAnalysisTab === "income" ? "Income & Expense" : "Valuation"} analysis...`}
              className="min-h-[120px] resize-none text-base"
            />
          </div>
        </div>

        {/* Export Comments Button */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Button
            onClick={exportCommentsToCSV}
            className="gap-2 bg-transparent"
            variant="outline"
          >
            <FileDown className="h-5 w-5" />
            Export Comments to CSV
            {totalComments > 0 && (
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {totalComments}
              </span>
            )}
          </Button>
          <Button onClick={savePageComment} className="gap-2">
            <Save className="h-5 w-5" />
            Save Comments
          </Button>
        </div>
      </div>
    </div>
  );
}
