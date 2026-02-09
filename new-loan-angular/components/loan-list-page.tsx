"use client";

import { useState, useMemo, useEffect } from "react";
import { SystemRecommendations } from "@/components/system-recommendations";
import { RiskAnalysisFilters, type DateRange } from "@/components/risk-analysis-filters";
import { LoanTable } from "@/components/loan-table";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { loansData, type Loan } from "@/lib/loan-data";

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
} {
  if (!data || typeof data !== "object") return {};
  const loanSummary = (data as Record<string, unknown>)["loan_summary"];
  if (!loanSummary || typeof loanSummary !== "object") return {};
  
  const summary = loanSummary as Record<string, unknown>;
  const result: {
    tlrStatus?: "TLR Completed" | "TLR Not Completed" | "unknown";
    dscr?: number;
  } = {};
  
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
    // Empty string means no information, so leave dscr undefined
    result.dscr = undefined;
  }
  
  return result;
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
        const ltv = extractLTVFromFacts(data);
        const { tlrStatus, dscr } = extractFromLoanSummary(data);
        
        setLoansWithLTV((prevLoans) =>
          prevLoans.map((loan) => ({
            ...loan,
            ...(ltv !== undefined && { ltv }),
            ...(tlrStatus !== undefined && { tlrStatus }),
            ...(dscr !== undefined ? { dscr } : { dscr: undefined }),
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
      <PortfolioSummary />

      {/* Results by Risk Category */}
      <SystemRecommendations />

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
