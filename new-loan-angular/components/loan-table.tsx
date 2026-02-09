"use client";

import React from "react"

import { useState } from "react";
import { cn } from "@/lib/utils";
import { keyRiskAreaTitle, type Loan } from "@/lib/loan-data";
import {
  Building2,
  Calendar,
  MapPin,
  AlertCircle,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  ClipboardCheck,
  CircleCheckBig,
  CircleDot,
  CircleX,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface LoanTableProps {
  loans: Loan[];
  onLoanClick: (loanId: string) => void;
  filtersSlot?: React.ReactNode;
}

function SegmentedScoreBar({
  score,
  maxScore,
  segments = 8,
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
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-sm",
              i < filledSegments ? getBarColor() : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className={cn("text-base font-bold", getColor())}>
        {score}/{maxScore}
      </span>
    </div>
  );
}

type SortField =
  | "loanNumber"
  | "acquisitionDate"
  | "lenderName"
  | "propertyType"
  | "financing"
  | "riskScore"
  | "flagPercentage"
  | "status"
  | "severity";
type SortDirection = "asc" | "desc";

const statusStyles = {
  PASS: "bg-pass/10 text-pass border border-pass/30",
  FAIL: "bg-fail/10 text-fail border border-fail/30",
  WAIVER: "bg-waiver/10 text-waiver border border-waiver/30",
};

const severityStyles = {
  Critical: "bg-critical/10 text-critical border border-critical/30",
  High: "bg-high/10 text-high border border-high/30",
  Medium: "bg-medium/10 text-medium border border-medium/30",
  Low: "bg-low/10 text-low border border-low/30",
};

const riskScoreColors = {
  1: "text-low",
  2: "text-medium",
  3: "text-high",
  4: "text-critical",
};

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const ms = Date.parse(dateString);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface SortOption {
  field: SortField;
  label: string;
  direction: SortDirection;
}

interface ColumnSortDropdownProps {
  options: SortOption[];
  currentSort: SortField;
  currentDirection: SortDirection;
  onSort: (field: SortField, direction: SortDirection) => void;
}

function ColumnSortDropdown({
  options,
  currentSort,
  currentDirection,
  onSort,
}: ColumnSortDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent"
        >
          <span>Sort Options</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {options.map((option) => {
          const isActive =
            currentSort === option.field &&
            currentDirection === option.direction;
          return (
            <DropdownMenuItem
              key={`${option.field}-${option.direction}`}
              onClick={() => onSort(option.field, option.direction)}
              className="flex items-center justify-between text-base"
            >
              <span>{option.label}</span>
              {isActive && <Check className="h-4 w-4 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LoanTable({ loans, onLoanClick, filtersSlot }: LoanTableProps) {
  const [sortField, setSortField] = useState<SortField>("riskScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  const sortedLoans = [...loans].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "loanNumber":
        comparison = a.loanNumber.localeCompare(b.loanNumber);
        break;
      case "acquisitionDate":
        const aTime = a.acquisitionDate ? Date.parse(a.acquisitionDate) : Number.NaN;
        const bTime = b.acquisitionDate ? Date.parse(b.acquisitionDate) : Number.NaN;
        comparison =
          (Number.isFinite(aTime) ? aTime : -Infinity) -
          (Number.isFinite(bTime) ? bTime : -Infinity);
        break;
      case "lenderName":
        comparison = (a.lenderName ?? "").localeCompare(b.lenderName ?? "");
        break;
      case "propertyType":
        comparison = a.propertyType.localeCompare(b.propertyType);
        break;
      case "financing":
        comparison = a.financing.localeCompare(b.financing);
        break;
      case "riskScore":
        comparison = a.riskScore - b.riskScore;
        break;
      case "flagPercentage":
        comparison = a.flagPercentage - b.flagPercentage;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "severity":
        const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Sort options for each column
  const loanInfoSortOptions: SortOption[] = [
    { field: "loanNumber", label: "Loan # (A-Z)", direction: "asc" },
    { field: "loanNumber", label: "Loan # (Z-A)", direction: "desc" },
    { field: "acquisitionDate", label: "Newest First", direction: "desc" },
    { field: "acquisitionDate", label: "Oldest First", direction: "asc" },
    { field: "lenderName", label: "Lender (A-Z)", direction: "asc" },
    { field: "lenderName", label: "Lender (Z-A)", direction: "desc" },
  ];

  const propertyDetailsSortOptions: SortOption[] = [
    { field: "propertyType", label: "Property Type (A-Z)", direction: "asc" },
    { field: "propertyType", label: "Property Type (Z-A)", direction: "desc" },
    { field: "financing", label: "Financing (A-Z)", direction: "asc" },
    { field: "financing", label: "Financing (Z-A)", direction: "desc" },
  ];

  const riskMetricsSortOptions: SortOption[] = [
    { field: "riskScore", label: "Risk Score (High-Low)", direction: "desc" },
    { field: "riskScore", label: "Risk Score (Low-High)", direction: "asc" },
    { field: "flagPercentage", label: "Flags % (High-Low)", direction: "desc" },
    { field: "flagPercentage", label: "Flags % (Low-High)", direction: "asc" },
  ];

  const statusRulesSortOptions: SortOption[] = [
    { field: "status", label: "Status (A-Z)", direction: "asc" },
    { field: "status", label: "Status (Z-A)", direction: "desc" },
    { field: "severity", label: "Severity (High-Low)", direction: "desc" },
    { field: "severity", label: "Severity (Low-High)", direction: "asc" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-6">
        <h2 className="text-xl font-semibold text-card-foreground">
          Loan Risk Analysis
        </h2>
        <p className="text-base text-muted-foreground">
          {loans.length} loans requiring attention - Click on a row to view
          details
        </p>
        {filtersSlot && (
          <>
            <div className="my-6 border-t border-border" />
            {filtersSlot}
          </>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[170px]" />
            <col className="w-[180px]" />
            <col className="w-[120px]" />
            <col className="w-[180px]" />
            <col className="w-[130px]" />
            <col className="w-[160px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-4 text-left align-top">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Loan Info
                  </span>
                  <div>
                    <ColumnSortDropdown
                      options={loanInfoSortOptions}
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-4 text-left align-top">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Property Details
                  </span>
                  <div>
                    <ColumnSortDropdown
                      options={propertyDetailsSortOptions}
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-4 text-left align-top">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial
                </span>
              </th>
              <th className="px-4 py-4 text-left align-top">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Risk Metrics
                  </span>
                  <div>
                    <ColumnSortDropdown
                      options={riskMetricsSortOptions}
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </div>
                </div>
              </th>
              <th className="px-4 py-4 text-left align-top">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Rules Compliance
                </span>
              </th>
              <th className="px-4 py-4 text-left align-top">
                <div className="space-y-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Risk Summary
                  </span>
                  <div>
                    <ColumnSortDropdown
                      options={statusRulesSortOptions}
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedLoans.map((loan) => (
              <tr
                key={loan.id}
                onClick={() => onLoanClick(loan.id)}
                className="cursor-pointer transition-colors hover:bg-accent/5"
              >
                {/* Loan Info */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoanClick(loan.id);
                      }}
                      className="text-left font-mono text-sm font-semibold text-accent hover:underline"
                    >
                      {loan.loanNumber}
                    </button>
                    <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                      <span className="font-medium text-foreground">Acq:</span>
                      <span className="text-muted-foreground">{formatDate(loan.acquisitionDate ?? "")}</span>
                      <span className="font-medium text-foreground">Commit:</span>
                      <span className="text-muted-foreground">{formatDate(loan.commitmentDate ?? "")}</span>
                      <span className="font-medium text-foreground">Lender:</span>
                      <span className="text-muted-foreground">{loan.lenderName?.trim() ? loan.lenderName : "—"}</span>
                      <span className="font-medium text-foreground">UW:</span>
                      <span className="text-muted-foreground">{loan.underwriterName?.trim() ? loan.underwriterName : "—"}</span>
                      <span className="font-medium text-foreground">Orig:</span>
                      <span className="text-muted-foreground">{loan.originatorName?.trim() ? loan.originatorName : "—"}</span>
                      <span className="font-medium text-foreground">Deleg:</span>
                      <span className="text-muted-foreground">{loan.delegationType ?? "—"}</span>
                    </div>
                  </div>
                </td>

                {/* Property Details */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground leading-tight">
                          {loan.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {loan.city}, {loan.state}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {loan.propertyType}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {loan.units > 1 ? `${loan.units} Units` : "Single Asset"}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {loan.loanType}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Financial */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Loan Amt</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(loan.loanAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">UPB</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(loan.upb)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">DSCR</p>
                        <p className="text-sm font-medium text-muted-foreground">
                          {loan.dscr !== undefined && loan.dscr > 0 ? loan.dscr.toFixed(2) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">LTV</p>
                        <p className="text-sm font-medium text-foreground">
                          {loan.ltv !== undefined ? `${loan.ltv.toFixed(1)}%` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Risk Metrics */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Gauge/Meter Arc Icon */}
                        <svg width="36" height="22" viewBox="0 0 36 22" className="flex-shrink-0">
                          {/* Arc background segments */}
                          <path
                            d="M 4 20 A 14 14 0 0 1 10 8"
                            fill="none"
                            stroke={loan.riskScore === 1 ? "#22c55e" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 11 7 A 14 14 0 0 1 18 5"
                            fill="none"
                            stroke={loan.riskScore <= 2 ? "#22c55e" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 19 5 A 14 14 0 0 1 26 7"
                            fill="none"
                            stroke={loan.riskScore === 3 ? "#eab308" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 27 8 A 14 14 0 0 1 32 20"
                            fill="none"
                            stroke={loan.riskScore === 4 ? "#ef4444" : "#e5e7eb"}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          {/* Needle */}
                          <line
                            x1="18"
                            y1="20"
                            x2={loan.riskScore === 1 ? 8 : loan.riskScore === 2 ? 13 : loan.riskScore === 3 ? 23 : 28}
                            y2={loan.riskScore === 1 ? 12 : loan.riskScore === 2 ? 7 : loan.riskScore === 3 ? 7 : 12}
                            stroke={loan.riskScore <= 2 ? "#22c55e" : loan.riskScore === 3 ? "#eab308" : "#ef4444"}
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          {/* Center dot */}
                          <circle 
                            cx="18" 
                            cy="20" 
                            r="2.5" 
                            fill={loan.riskScore <= 2 ? "#22c55e" : loan.riskScore === 3 ? "#eab308" : "#ef4444"} 
                          />
                        </svg>
                        <span
                          className={cn(
                            "text-base font-bold",
                            loan.riskScore <= 2
                              ? "text-pass"
                              : loan.riskScore === 3
                                ? "text-medium"
                                : "text-fail"
                          )}
                        >
                          {loan.riskScore}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Compliance Score</p>
                      {(() => {
                        const passed = loan.complianceScoreData.passed;
                        const total = loan.complianceScoreData.total;
                        const percentage = total > 0 ? (passed / total) * 100 : 0;
                        const fillColor = percentage >= 70 ? "#22c55e" : percentage >= 50 ? "#eab308" : "#ef4444";
                        const colorClass = percentage >= 70 ? "text-pass" : percentage >= 50 ? "text-medium" : "text-fail";
                        const filledSegments = Math.round((percentage / 100) * 5);
                        
                        return (
                          <div className="flex items-center gap-2 mt-0.5">
                            {/* Horizontal segmented bar - 5 segments for approximate progress */}
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-3 w-3 rounded-sm"
                                  style={{
                                    backgroundColor: i < filledSegments ? fillColor : "#e5e7eb"
                                  }}
                                />
                              ))}
                            </div>
                            <span className={cn("text-sm font-bold", colorClass)}>
                              {passed}/{total}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">TLR Status</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {loan.tlrStatus === "TLR Completed" ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-pass" />
                            <span className="text-xs font-medium text-pass">Completed</span>
                          </>
                        ) : loan.tlrStatus === "unknown" || loan.tlrStatus === undefined ? (
                          <>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Unknown</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-medium" />
                            <span className="text-xs font-medium text-medium">Not Completed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Rules Compliance */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-1.5">
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-xs font-medium",
                        loan.rulesOutcome.incomeExpense.passed ===
                          loan.rulesOutcome.incomeExpense.total
                          ? "bg-pass/10 text-pass"
                          : loan.rulesOutcome.incomeExpense.passed >=
                              loan.rulesOutcome.incomeExpense.total * 0.7
                            ? "bg-medium/10 text-medium"
                            : "bg-fail/10 text-fail"
                      )}
                    >
                      I&E: {loan.rulesOutcome.incomeExpense.passed}/{loan.rulesOutcome.incomeExpense.total}
                    </span>
                    <span
                      className={cn(
                        "inline-block rounded px-2 py-0.5 text-xs font-medium",
                        loan.rulesOutcome.valuation.passed ===
                          loan.rulesOutcome.valuation.total
                          ? "bg-pass/10 text-pass"
                          : loan.rulesOutcome.valuation.passed >=
                              loan.rulesOutcome.valuation.total * 0.7
                            ? "bg-medium/10 text-medium"
                            : "bg-fail/10 text-fail"
                      )}
                    >
                      Valuation: {loan.rulesOutcome.valuation.passed}/{loan.rulesOutcome.valuation.total}
                    </span>
                  </div>
                </td>

                {/* Risk Summary */}
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-col gap-2">
                    <span
                      className={cn(
                        "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        severityStyles[loan.severity]
                      )}
                    >
                      {loan.severity}
                    </span>
                    <div className="flex flex-col gap-1">
                      {loan.keyRiskAreas.slice(0, 2).map((riskArea) => {
                        const title = keyRiskAreaTitle(riskArea);
                        return (
                        <span
                          key={riskArea}
                          className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
                        >
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{title}</span>
                        </span>
                        );
                      })}
                      {loan.keyRiskAreas.length > 2 && (
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          +{loan.keyRiskAreas.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
