export interface RulesOutcome {
  incomeExpense: { passed: number; total: number };
  valuation: { passed: number; total: number };
}

export interface ComplianceScoreData {
  passed: number;
  total: number;
}

export interface Loan {
  id: string;
  loanNumber: string;
  acquisitionDate: string;
  commitmentDate: string;
  lenderName: string;
  underwriterName: string;
  originatorName: string;
  delegationType: "Preview" | "PD" | "Standard";
  complianceScore: number;
  complianceScoreData: ComplianceScoreData;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  financing: string;
  units: number;
  loanType: string;
  loanAmount: number;
  upb: number;
  riskScore: number;
  flagPercentage: number;
  status: "PASS" | "FAIL" | "WAIVER";
  severity: "Critical" | "High" | "Medium" | "Low";
  rules: string[];
  aiExplanation: string;
  criticalRiskSummary: string;
  lastReviewDate: string;
  nextReviewDate: string;
  dscr: number;
  ltv: number;
  occupancy: number;
  tlrStatus: "TLR Completed" | "TLR Not Completed";
  rulesOutcome: RulesOutcome;
}

export const loansData: Loan[] = [
  {
    id: "1",
    loanNumber: "LN-2024-001847",
    acquisitionDate: "2024-03-15",
    commitmentDate: "2024-01-20",
    lenderName: "First National",
    underwriterName: "John Smith",
    originatorName: "Sarah Johnson",
    delegationType: "PD",
    complianceScore: 45,
    complianceScoreData: { passed: 14, total: 24 },
    address: "1250 Commerce Blvd",
    city: "Austin",
    state: "TX",
    propertyType: "Multifamily",
    financing: "Freddie Mac",
    units: 248,
    loanType: "Refinance",
    loanAmount: 42500000,
    upb: 41250000,
    riskScore: 4,
    flagPercentage: 67.3,
    status: "FAIL",
    severity: "Critical",
    rules: ["DSCR Below Threshold", "Net Rental Income Decline", "Insurance Underwriting"],
    aiExplanation:
      "Critical risk identified: DSCR dropped to 0.92 (threshold 1.25), combined with outdated appraisal (18 months) and lapsed hazard insurance coverage. Immediate breach review recommended.",
    criticalRiskSummary: "DSCR breach (0.92 vs 1.25), Insurance gap, NRI -12.9% vs T12",
    lastReviewDate: "2024-01-10",
    nextReviewDate: "2024-01-25",
    dscr: 0.92,
    ltv: 78.5,
    occupancy: 84.2,
    tlrStatus: "TLR Completed",
    rulesOutcome: {
      incomeExpense: { passed: 14, total: 20 },
      valuation: { passed: 3, total: 8 },
    },
  },
];

export const systemRecommendations = {
  incomeExpenseAnalysis: {
    count: 1,
    portfolioPercentage: 100,
    severity: "Critical" as const,
    description: "Loans with failed Income & Expense rules",
    complianceScore: { passed: 14, total: 20 },
    riskScoreDistribution: { score1: 0, score2: 0, score3: 0, score4: 1 },
  },
  valuationAnalysis: {
    count: 1,
    portfolioPercentage: 100,
    severity: "High" as const,
    description: "Loans with failed Valuation rules",
    complianceScore: { passed: 3, total: 8 },
    riskScoreDistribution: { score1: 0, score2: 0, score3: 0, score4: 1 },
  },
};

export const portfolioSummary = {
  totalUPBAtRisk: 41250000,
  rulesFailedPercentage: 54.2,
  criticalLoans: 1,
};
