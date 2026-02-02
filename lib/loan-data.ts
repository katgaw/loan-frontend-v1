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
    complianceScoreData: { passed: 11, total: 24 },
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
  {
    id: "2",
    loanNumber: "LN-2024-002156",
    acquisitionDate: "2024-05-22",
    commitmentDate: "2024-03-10",
    lenderName: "Capital Bank",
    underwriterName: "Michael Chen",
    originatorName: "Lisa Park",
    delegationType: "Standard",
    complianceScore: 62,
    complianceScoreData: { passed: 15, total: 24 },
    address: "800 Industrial Park Dr",
    city: "Phoenix",
    state: "AZ",
    propertyType: "Industrial",
    financing: "CMBS",
    units: 1,
    loanType: "Acquisition",
    loanAmount: 28750000,
    upb: 27890000,
    riskScore: 3,
    flagPercentage: 45.2,
    status: "FAIL",
    severity: "High",
    rules: ["Operating Expense Variance", "Market Vacancy Rates"],
    aiExplanation:
      "High risk due to single tenant exposure (92% of NRI) and pending Phase II environmental assessment. Market fundamentals remain strong but concentration risk elevated.",
    criticalRiskSummary: "Single tenant 92% NRI exposure, OpEx +8% variance, Environmental pending",
    lastReviewDate: "2024-01-08",
    nextReviewDate: "2024-02-08",
    dscr: 1.18,
    ltv: 72.1,
    occupancy: 100,
    tlrStatus: "TLR Not Completed",
    rulesOutcome: {
      incomeExpense: { passed: 16, total: 20 },
      valuation: { passed: 5, total: 8 },
    },
  },
  {
    id: "3",
    loanNumber: "LN-2024-001523",
    acquisitionDate: "2024-02-08",
    commitmentDate: "2023-12-15",
    lenderName: "Lender A",
    underwriterName: "David Wilson",
    originatorName: "Amanda Brown",
    delegationType: "Preview",
    complianceScore: 58,
    complianceScoreData: { passed: 14, total: 24 },
    address: "425 Riverside Plaza",
    city: "Denver",
    state: "CO",
    propertyType: "Office",
    financing: "Life Company",
    units: 1,
    loanType: "Refinance",
    loanAmount: 56200000,
    upb: 54100000,
    riskScore: 3,
    flagPercentage: 52.8,
    status: "WAIVER",
    severity: "High",
    rules: ["Occupancy Decline", "Rent Growth Below Target"],
    aiExplanation:
      "Office sector headwinds contributing to occupancy decline from 89% to 76%. Waiver granted due to strong sponsor guarantee and committed lease pipeline. Enhanced monitoring required.",
    criticalRiskSummary: "Occupancy 76% (down from 89%), Rent growth -2.1%, Office market stress",
    lastReviewDate: "2024-01-12",
    nextReviewDate: "2024-02-12",
    dscr: 1.08,
    ltv: 68.9,
    occupancy: 76.3,
    tlrStatus: "TLR Completed",
    rulesOutcome: {
      incomeExpense: { passed: 15, total: 20 },
      valuation: { passed: 4, total: 8 },
    },
  },
  {
    id: "4",
    loanNumber: "LN-2024-003201",
    acquisitionDate: "2024-08-30",
    commitmentDate: "2024-06-15",
    lenderName: "First National",
    underwriterName: "Emily Davis",
    originatorName: "Robert Martinez",
    delegationType: "PD",
    complianceScore: 71,
    complianceScoreData: { passed: 17, total: 24 },
    address: "1890 Harbor View Rd",
    city: "San Diego",
    state: "CA",
    propertyType: "Retail",
    financing: "Bank Balance Sheet",
    units: 12,
    loanType: "Acquisition",
    loanAmount: 18900000,
    upb: 18450000,
    riskScore: 2,
    flagPercentage: 28.5,
    status: "PASS",
    severity: "Medium",
    rules: ["General and Administrative Variance"],
    aiExplanation:
      "Minor documentation deficiency in rent roll verification. Property performing above underwriting with strong tenant mix. Low risk overall with good market positioning.",
    criticalRiskSummary: "Minor G&A variance, Strong performance overall",
    lastReviewDate: "2024-01-15",
    nextReviewDate: "2024-04-15",
    dscr: 1.42,
    ltv: 62.3,
    occupancy: 94.5,
    tlrStatus: "TLR Completed",
    rulesOutcome: {
      incomeExpense: { passed: 19, total: 20 },
      valuation: { passed: 7, total: 8 },
    },
  },
  {
    id: "5",
    loanNumber: "LN-2024-002789",
    acquisitionDate: "2024-07-14",
    commitmentDate: "2024-05-01",
    lenderName: "Capital Bank",
    underwriterName: "Jennifer Taylor",
    originatorName: "Kevin Anderson",
    delegationType: "Standard",
    complianceScore: 52,
    complianceScoreData: { passed: 13, total: 24 },
    address: "555 Medical Center Pkwy",
    city: "Nashville",
    state: "TN",
    propertyType: "Healthcare",
    financing: "HUD",
    units: 180,
    loanType: "Construction Perm",
    loanAmount: 67800000,
    upb: 65200000,
    riskScore: 3,
    flagPercentage: 41.7,
    status: "FAIL",
    severity: "High",
    rules: ["Payroll Underwriting", "Other Income Variance"],
    aiExplanation:
      "Construction timeline extended by 4 months with 12% cost overrun. Sponsor injecting additional equity. Monitoring completion milestones closely. Market demand remains robust.",
    criticalRiskSummary: "Construction delay +4mo, Cost overrun +12%, Payroll/Other Income variance",
    lastReviewDate: "2024-01-05",
    nextReviewDate: "2024-01-20",
    dscr: 0,
    ltv: 75.8,
    occupancy: 0,
    tlrStatus: "TLR Not Completed",
    rulesOutcome: {
      incomeExpense: { passed: 13, total: 20 },
      valuation: { passed: 5, total: 8 },
    },
  },
  {
    id: "6",
    loanNumber: "LN-2024-001892",
    acquisitionDate: "2024-04-03",
    commitmentDate: "2024-02-01",
    lenderName: "Lender A",
    underwriterName: "Chris Thompson",
    originatorName: "Michelle Lee",
    delegationType: "Preview",
    complianceScore: 78,
    complianceScoreData: { passed: 19, total: 24 },
    address: "2100 University Ave",
    city: "Seattle",
    state: "WA",
    propertyType: "Student Housing",
    financing: "Fannie Mae",
    units: 320,
    loanType: "Refinance",
    loanAmount: 38500000,
    upb: 37100000,
    riskScore: 2,
    flagPercentage: 22.1,
    status: "PASS",
    severity: "Low",
    rules: ["Market Vacancy Rates"],
    aiExplanation:
      "Strong performing asset with stable occupancy above 95%. Minor flag for market analysis update due to timing. No operational concerns identified. Continue standard monitoring.",
    criticalRiskSummary: "Minor market vacancy flag, Strong overall performance",
    lastReviewDate: "2024-01-18",
    nextReviewDate: "2024-07-18",
    dscr: 1.56,
    ltv: 58.4,
    occupancy: 96.8,
    tlrStatus: "TLR Completed",
    rulesOutcome: {
      incomeExpense: { passed: 18, total: 20 },
      valuation: { passed: 8, total: 8 },
    },
  },
  {
    id: "7",
    loanNumber: "LN-2024-002445",
    acquisitionDate: "2024-06-19",
    commitmentDate: "2024-04-25",
    lenderName: "First National",
    underwriterName: "John Smith",
    originatorName: "Sarah Johnson",
    delegationType: "PD",
    complianceScore: 49,
    complianceScoreData: { passed: 12, total: 24 },
    address: "750 Logistics Way",
    city: "Atlanta",
    state: "GA",
    propertyType: "Industrial",
    financing: "CMBS",
    units: 1,
    loanType: "Acquisition",
    loanAmount: 31200000,
    upb: 30450000,
    riskScore: 4,
    flagPercentage: 58.9,
    status: "FAIL",
    severity: "Critical",
    rules: ["DSCR Below Threshold", "Operating Expense Variance", "Insurance Underwriting"],
    aiExplanation:
      "Critical: 65% of leases rolling within 12 months, DSCR trending down to 1.05, and operating reserve below required minimum. Sponsor discussions initiated for reserve replenishment.",
    criticalRiskSummary: "Lease rollover 65%, DSCR 1.05 trending down, Reserve deficit, OpEx +15%",
    lastReviewDate: "2024-01-14",
    nextReviewDate: "2024-01-28",
    dscr: 1.05,
    ltv: 71.2,
    occupancy: 88.4,
    tlrStatus: "TLR Not Completed",
    rulesOutcome: {
      incomeExpense: { passed: 12, total: 20 },
      valuation: { passed: 4, total: 8 },
    },
  },
];

export const systemRecommendations = {
  incomeExpenseAnalysis: {
    count: 7,
    portfolioPercentage: 20,
    severity: "Critical" as const,
    description: "Loans with failed Income & Expense rules",
    complianceScore: { passed: 8, total: 14 },
    riskScoreDistribution: { score1: 1, score2: 2, score3: 2, score4: 2 },
  },
  valuationAnalysis: {
    count: 7,
    portfolioPercentage: 10,
    severity: "High" as const,
    description: "Loans with failed Valuation rules",
    complianceScore: { passed: 5, total: 8 },
    riskScoreDistribution: { score1: 1, score2: 2, score3: 2, score4: 2 },
  },
};

export const portfolioSummary = {
  totalUPBAtRisk: 274440000,
  rulesFailedPercentage: 40.2,
  criticalLoans: 2,
};
