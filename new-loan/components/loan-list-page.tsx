"use client";

import { useState, useMemo } from "react";
import { SystemRecommendations } from "@/components/system-recommendations";
import { RiskAnalysisFilters, type DateRange } from "@/components/risk-analysis-filters";
import { LoanTable } from "@/components/loan-table";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { loansData } from "@/lib/loan-data";

interface LoanListPageProps {
  onNavigateToDetail: (loanId: string) => void;
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

  const filteredLoans = useMemo(() => {
    let filtered = [...loansData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (loan) =>
          loan.loanNumber.toLowerCase().includes(query) ||
          loan.address.toLowerCase().includes(query) ||
          loan.city.toLowerCase().includes(query) ||
          loan.lenderName.toLowerCase().includes(query)
      );
    }

    // Risk Score filter
    if (riskScoreFilter !== "all") {
      filtered = filtered.filter((loan) => loan.riskScore === parseInt(riskScoreFilter));
    }

    // TLR Status filter
    if (tlrStatusFilter !== "all") {
      filtered = filtered.filter((loan) => loan.tlrStatus === tlrStatusFilter);
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
        const loanDate = loan.acquisitionDate.substring(0, 7);
        return loanDate >= acquisitionDateRange.startDate && loanDate <= acquisitionDateRange.endDate;
      });
    }

    // Commitment date range filter
    if (commitmentDateRange.startDate !== "all") {
      filtered = filtered.filter((loan) => {
        const loanDate = loan.commitmentDate.substring(0, 7);
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
  }, [searchQuery, riskScoreFilter, tlrStatusFilter, delegationFilter, lenderFilter, acquisitionDateRange, commitmentDateRange, underwriterFilter, originatorFilter]);

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
