"use client";

import { DollarSign, AlertTriangle, BarChart3 } from "lucide-react";
import { loansData } from "@/lib/loan-data";

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

export function PortfolioSummary() {
  const totalUpb = loansData.reduce((acc, loan) => acc + loan.upb, 0);

  // Calculate percentage of rules compliant from compliance scores
  const totalPassed = loansData.reduce((acc, loan) => acc + loan.complianceScoreData.passed, 0);
  const totalRules = loansData.reduce((acc, loan) => acc + loan.complianceScoreData.total, 0);
  const percentageCompliant = totalRules > 0 ? Math.round((totalPassed / totalRules) * 100) : 0;

  // Percentage failed is simply the complement of percentage compliant
  const percentageFailed = 100 - percentageCompliant;

  const criticalLoans = loansData.filter((loan) => loan.riskScore >= 3).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-xl font-semibold text-card-foreground">
        Portfolio Risk Summary
      </h2>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total UPB */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-fail/10 p-3.5">
            <DollarSign className="h-7 w-7 text-fail" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Total UPB</p>
            <p className="text-3xl font-bold text-foreground">
              {formatCurrency(totalUpb)}
            </p>
          </div>
        </div>

        {/* Percentage Rules Compliant */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-pass/10 p-3.5">
            <BarChart3 className="h-7 w-7 text-pass" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Percentage of Rules Compliant</p>
            <p className="text-3xl font-bold text-foreground">
              {percentageCompliant}%
            </p>
            <p className="text-sm text-muted-foreground">
              {percentageFailed}% failed
            </p>
          </div>
        </div>

        {/* Critical Loans */}
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-critical/10 p-3.5">
            <AlertTriangle className="h-7 w-7 text-critical" />
          </div>
          <div>
            <p className="text-base text-muted-foreground">Critical Loans</p>
            <p className="text-3xl font-bold text-foreground">
              {criticalLoans}
            </p>
            <p className="text-sm text-muted-foreground">
              Loans requiring immediate action
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
