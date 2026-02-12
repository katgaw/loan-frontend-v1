"use client";

import { useState, useMemo, useEffect } from "react";
import { SystemRecommendations } from "@/components/system-recommendations";
import { RiskAnalysisFilters, type DateRange } from "@/components/risk-analysis-filters";
import { LoanTable } from "@/components/loan-table";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { loansData, type Loan } from "@/lib/loan-data";
import { buildRuleCategoriesBySectionFromTestJson } from "@/lib/test-rule-results";

interface LoanListPageProps {
  onNavigateToDetail: (loanId: string) => void;
}

function extractLTVFromFacts(data: unknown): number | undefined {
  if (!data || typeof data !== "object") return undefined;
  const factsLookup = (data as Record<string, unknown>)["facts_lookup"];
  if (!factsLookup || typeof factsLookup !== "object") return undefined;
  const factLoanSummary017 = (factsLookup as Record<string, unknown>)["fact_loan_summary_017"];
  if (!factLoanSummary017 || typeof factLoanSummary017 !== "object") return undefined;
  const statement = (factLoanSummary017 as Record<string, unknown>)["statement"];
  if (typeof statement !== "string") return undefined;
  
  // Extract LTV percentage from statement like "The LTV is 50% based on the appraised value of the property"
  const match = statement.match(/LTV\s+is\s+(\d+(?:\.\d+)?)%/i);
  if (match && match[1]) {
    const value = parseFloat(match[1]);
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function extractFromLoanSummary(data: unknown): {
  tlrStatus?: "TLR Completed" | "TLR Not Completed" | "unknown";
  dscr?: number;
  loanAmount?: number;
  upb?: number;
  ltv?: number;
  riskScore?: number;
  address?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  units?: number;
  loanType?: string;
} {
  if (!data || typeof data !== "object") return {};
  const loanSummary = (data as Record<string, unknown>)["loan_summary"];
  if (!loanSummary || typeof loanSummary !== "object") return {};
  
  const summary = loanSummary as Record<string, unknown>;
  const result: {
    tlrStatus?: "TLR Completed" | "TLR Not Completed" | "unknown";
    dscr?: number;
    loanAmount?: number;
    upb?: number;
    ltv?: number;
    riskScore?: number;
    address?: string;
    city?: string;
    state?: string;
    propertyType?: string;
    units?: number;
    loanType?: string;
  } = {};

  // Extract risk_score (string "1"-"4" in JSON → number)
  const rawRisk = summary["risk_score"];
  if (typeof rawRisk === "string" && rawRisk.trim() !== "") {
    const parsed = parseInt(rawRisk, 10);
    if (parsed >= 1 && parsed <= 4) {
      result.riskScore = parsed;
    }
  } else if (typeof rawRisk === "number" && rawRisk >= 1 && rawRisk <= 4) {
    result.riskScore = rawRisk;
  }

  // Extract property_name → address
  const propertyName = summary["property_name"];
  if (typeof propertyName === "string" && propertyName.trim() !== "") {
    result.address = propertyName.trim();
  }

  // Extract city
  const cityValue = summary["city"];
  if (typeof cityValue === "string" && cityValue.trim() !== "") {
    result.city = cityValue.trim();
  }

  // Extract state
  const stateValue = summary["state"];
  if (typeof stateValue === "string" && stateValue.trim() !== "") {
    result.state = stateValue.trim();
  }

  // Extract property_type → propertyType
  const propertyTypeValue = summary["property_type"];
  if (typeof propertyTypeValue === "string" && propertyTypeValue.trim() !== "") {
    result.propertyType = propertyTypeValue.trim();
  }

  // Extract units (string in JSON → number)
  const unitsValue = summary["units"];
  if (typeof unitsValue === "string" && unitsValue.trim() !== "") {
    const parsed = parseInt(unitsValue, 10);
    if (Number.isFinite(parsed)) {
      result.units = parsed;
    }
  } else if (typeof unitsValue === "number" && Number.isFinite(unitsValue)) {
    result.units = unitsValue;
  }

  // Extract product_type → loanType (empty string overrides hardcoded default)
  const productType = summary["product_type"];
  if (typeof productType === "string") {
    result.loanType = productType.trim();
  }
  
  // Extract TLR_status
  const tlrStatusValue = summary["TLR_status"];
  if (typeof tlrStatusValue === "string") {
    if (tlrStatusValue === "unknown" || tlrStatusValue === "TLR Completed" || tlrStatusValue === "TLR Not Completed") {
      result.tlrStatus = tlrStatusValue as "TLR Completed" | "TLR Not Completed" | "unknown";
    }
  }
  
  // Extract DSCR
  const dscrValue = summary["DSCR"];
  if (typeof dscrValue === "string" && dscrValue.trim() !== "") {
    const parsed = parseFloat(dscrValue);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      result.dscr = parsed;
    }
  } else if (dscrValue === "" || dscrValue === null || dscrValue === undefined) {
    result.dscr = undefined;
  }

  // Extract loan_amount (may contain commas, e.g. "45,500,000")
  const loanAmountValue = summary["loan_amount"];
  if (typeof loanAmountValue === "string" && loanAmountValue.trim() !== "") {
    const parsed = parseFloat(loanAmountValue.replace(/,/g, ""));
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      result.loanAmount = parsed;
    }
  } else if (typeof loanAmountValue === "number" && Number.isFinite(loanAmountValue)) {
    result.loanAmount = loanAmountValue;
  }

  // Extract upb
  const upbValue = summary["upb"];
  if (typeof upbValue === "string" && upbValue.trim() !== "") {
    const parsed = parseFloat(upbValue.replace(/,/g, ""));
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      result.upb = parsed;
    }
  } else if (typeof upbValue === "number" && Number.isFinite(upbValue)) {
    result.upb = upbValue;
  }

  // Extract LTV
  const ltvValue = summary["LTV"];
  if (typeof ltvValue === "string" && ltvValue.trim() !== "") {
    const parsed = parseFloat(ltvValue.replace(/%/g, ""));
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      result.ltv = parsed;
    }
  } else if (typeof ltvValue === "number" && Number.isFinite(ltvValue)) {
    result.ltv = ltvValue;
  }
  
  return result;
}

/**
 * Compute compliance score using the SAME logic as the loan detail page:
 * - Build rule categories from JSON via buildRuleCategoriesBySectionFromTestJson
 * - A category counts as "passed" when it has ZERO rules with status === "fail"
 * - total = number of categories across all sections
 * This ensures the portfolio summary % stays in sync with the detail page score.
 */
function extractComplianceScoreData(data: unknown): { passed: number; total: number } | undefined {
  try {
    const sectionMap = buildRuleCategoriesBySectionFromTestJson(data);
    if (!sectionMap || Object.keys(sectionMap).length === 0) return undefined;

    let passed = 0;
    let total = 0;

    for (const categories of Object.values(sectionMap)) {
      for (const cat of categories) {
        total += 1;
        const hasFail = cat.rules.some((r) => r.status === "fail");
        if (!hasFail) {
          passed += 1;
        }
      }
    }

    return { passed, total };
  } catch {
    return undefined;
  }
}

function extractKeyRiskAreas(data: unknown): string[] | undefined {
  if (!data || typeof data !== "object") return undefined;
  const riskInsights = (data as Record<string, unknown>)["risk_insights"];
  if (!riskInsights || typeof riskInsights !== "object") return undefined;
  const areas = (riskInsights as Record<string, unknown>)["key_risk_areas"];
  if (!Array.isArray(areas) || areas.length === 0) return undefined;
  const strings = areas.filter((a): a is string => typeof a === "string" && a.trim() !== "");
  return strings.length > 0 ? strings : undefined;
}

export function LoanListPage({ onNavigateToDetail }: LoanListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskScoreFilter, setRiskScoreFilter] = useState("all");
  const [tlrStatusFilter, setTlrStatusFilter] = useState("all");
  const [delegationFilter, setDelegationFilter] = useState("all");
  const [lenderFilter, setLenderFilter] = useState("all");
  const [acquisitionDateRange, setAcquisitionDateRange] = useState<DateRange>({ startDate: "all", endDate: "2025-03" });
  const [commitmentDateRange, setCommitmentDateRange] = useState<DateRange>({ startDate: "all", endDate: "2025-03" });
  const [underwriterFilter, setUnderwriterFilter] = useState("all");
  const [originatorFilter, setOriginatorFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: "all", endDate: "2025-03" });
  const [loansWithLTV, setLoansWithLTV] = useState<Loan[]>(loansData);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/test-json")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to load test.json: ${r.status}`);
        return await r.json();
      })
      .then((data) => {
        if (!isMounted) return;
        const factsLtv = extractLTVFromFacts(data);
        const {
          tlrStatus, dscr, loanAmount, upb, ltv: summaryLtv, riskScore,
          address, city, state, propertyType, units, loanType,
        } = extractFromLoanSummary(data);
        // Prefer LTV from loan_summary; fall back to facts_lookup extraction
        const ltv = summaryLtv ?? factsLtv;

        // Extract key_risk_areas from risk_insights
        const keyRiskAreas = extractKeyRiskAreas(data);

        // Extract compliance score using same logic as loan detail page
        const complianceScoreData = extractComplianceScoreData(data);
        
        setLoansWithLTV((prevLoans) =>
          prevLoans.map((loan) => ({
            ...loan,
            ...(loanAmount !== undefined && { loanAmount }),
            ...(upb !== undefined && { upb }),
            ...(ltv !== undefined && { ltv }),
            ...(tlrStatus !== undefined && { tlrStatus }),
            ...(dscr !== undefined ? { dscr } : { dscr: undefined }),
            ...(keyRiskAreas !== undefined && { keyRiskAreas }),
            ...(riskScore !== undefined && { riskScore }),
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(state !== undefined && { state }),
            ...(propertyType !== undefined && { propertyType }),
            ...(units !== undefined && { units }),
            ...(loanType !== undefined && { loanType }),
            ...(complianceScoreData !== undefined && { complianceScoreData }),
          }))
        );
      })
      .catch(() => {
        // If fetch fails, keep using loansData as-is
        if (!isMounted) return;
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLoans = useMemo(() => {
    let filtered = [...loansWithLTV];

    const includesQuery = (value: string | undefined, query: string) =>
      (value ?? "").toLowerCase().includes(query);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          includesQuery(loan.loanNumber, query) ||
          includesQuery(loan.address, query) ||
          includesQuery(loan.city, query) ||
          includesQuery(loan.lenderName, query)
      );
    }

    // Risk Score filter
    if (riskScoreFilter !== "all") {
      filtered = filtered.filter((loan) => loan.riskScore === parseInt(riskScoreFilter));
    }

    // TLR Status filter
    if (tlrStatusFilter !== "all") {
      filtered = filtered.filter((loan) => {
        if (tlrStatusFilter === "unknown") {
          return loan.tlrStatus === "unknown" || loan.tlrStatus === undefined;
        }
        return loan.tlrStatus === tlrStatusFilter;
      });
    }

    // Delegation Type filter
    if (delegationFilter !== "all") {
      filtered = filtered.filter((loan) => loan.delegationType === delegationFilter);
    }

    // Lender filter
    if (lenderFilter !== "all") {
      filtered = filtered.filter((loan) => loan.lenderName === lenderFilter);
    }

    // Acquisition date range filter
    if (acquisitionDateRange.startDate !== "all") {
      filtered = filtered.filter((loan) => {
        const loanDate = loan.acquisitionDate?.substring(0, 7);
        if (!loanDate) return false;
        return loanDate >= acquisitionDateRange.startDate && loanDate <= acquisitionDateRange.endDate;
      });
    }

    // Commitment date range filter
    if (commitmentDateRange.startDate !== "all") {
      filtered = filtered.filter((loan) => {
        const loanDate = loan.commitmentDate?.substring(0, 7);
        if (!loanDate) return false;
        return loanDate >= commitmentDateRange.startDate && loanDate <= commitmentDateRange.endDate;
      });
    }

    // Underwriter filter
    if (underwriterFilter !== "all") {
      filtered = filtered.filter((loan) => loan.underwriterName === underwriterFilter);
    }

    // Originator filter
    if (originatorFilter !== "all") {
      filtered = filtered.filter((loan) => loan.originatorName === originatorFilter);
    }

    // Default sort by risk score (highest first)
    filtered.sort((a, b) => b.riskScore - a.riskScore);

    return filtered;
  }, [loansWithLTV, searchQuery, riskScoreFilter, tlrStatusFilter, delegationFilter, lenderFilter, acquisitionDateRange, commitmentDateRange, underwriterFilter, originatorFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Multifamily Loan Surveillance
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          Comprehensive risk assessment with detailed loan metrics
        </p>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary loans={loansWithLTV} />

      {/* Results by Risk Category */}
      <SystemRecommendations loans={loansWithLTV} />

      {/* Loan Table with Filters */}
      <LoanTable 
        loans={filteredLoans} 
        onLoanClick={onNavigateToDetail}
        filtersSlot={
          <RiskAnalysisFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            riskScoreFilter={riskScoreFilter}
            onRiskScoreChange={setRiskScoreFilter}
            tlrStatusFilter={tlrStatusFilter}
            onTlrStatusChange={setTlrStatusFilter}
            delegationFilter={delegationFilter}
            onDelegationChange={setDelegationFilter}
            lenderFilter={lenderFilter}
            onLenderChange={setLenderFilter}
            acquisitionDateRange={acquisitionDateRange}
            onAcquisitionDateRangeChange={setAcquisitionDateRange}
            commitmentDateRange={commitmentDateRange}
            onCommitmentDateRangeChange={setCommitmentDateRange}
            underwriterFilter={underwriterFilter}
            onUnderwriterChange={setUnderwriterFilter}
            originatorFilter={originatorFilter}
            onOriginatorChange={setOriginatorFilter}
          />
        }
      />
    </div>
  );
}
