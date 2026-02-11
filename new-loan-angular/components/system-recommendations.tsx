"use client";

import { cn } from "@/lib/utils";
import { DollarSign } from "lucide-react";
import { loansData } from "@/lib/loan-data";

const severityStyles = {
  Critical: "bg-critical/10 text-critical border-critical/20",
  High: "bg-high/10 text-high border-high/20",
  Medium: "bg-medium/10 text-medium border-medium/20",
  Low: "bg-low/10 text-low border-low/20",
};

const severityBadgeStyles = {
  Critical: "bg-critical text-white",
  High: "bg-high text-white",
  Medium: "bg-medium text-foreground",
  Low: "bg-low text-white",
};

// Mini pie chart component for risk score distribution
function RiskScorePieChart({ distribution }: { distribution: { score1: number; score2: number; score3: number; score4: number } }) {
  const total =
    distribution.score1 +
    distribution.score2 +
    distribution.score3 +
    distribution.score4;
  const size = 80;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const segments = [
    { value: distribution.score1, color: "#22c55e", label: "1 - Meets/Exceeds Expectation" },
    { value: distribution.score2, color: "#eab308", label: "2 - Meets Expectation" },
    { value: distribution.score3, color: "#f97316", label: "3 - Below Expectation" },
    { value: distribution.score4, color: "#ef4444", label: "4 - Significantly Below Expectation" },
  ];
  
  let currentOffset = 0;
  
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? (segment.value / total) * 100 : 0;
          const dashLength = (percentage / 100) * circumference;
          const offset = currentOffset;
          currentOffset += dashLength;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={-offset}
            />
          );
        })}
      </svg>
      <div className="flex flex-col gap-1">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-xs text-muted-foreground">
              {segment.label}: {segment.value} {segment.value === 1 ? "loan" : "loans"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SystemRecommendations() {
  const totalLoans = loansData.length;
  const failedIncomeExpenseLoans = loansData.filter(
    (loan) => loan.rulesOutcome.incomeExpense.passed < loan.rulesOutcome.incomeExpense.total
  ).length;

  const riskScoreDistribution = loansData.reduce(
    (acc, loan) => {
      if (loan.riskScore === 1) acc.score1 += 1;
      else if (loan.riskScore === 2) acc.score2 += 1;
      else if (loan.riskScore === 3) acc.score3 += 1;
      else acc.score4 += 1;
      return acc;
    },
    { score1: 0, score2: 0, score3: 0, score4: 0 }
  );

  const item = {
    key: "incomeExpenseAnalysis",
    title: "Income & Expense",
    icon: DollarSign,
    severity: "Critical" as const,
    description: "Loans with failed Income & Expense rules",
    count: failedIncomeExpenseLoans,
    portfolioPercentage: totalLoans > 0 ? Math.round((failedIncomeExpenseLoans / totalLoans) * 100) : 0,
    riskScoreDistribution,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-xl font-semibold text-card-foreground">
        Results by Risk Category
      </h2>
      <p className="mb-5 text-base text-muted-foreground">
        Number of loans by risk score
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          key={item.key}
          className={cn(
            "relative overflow-hidden rounded-lg border p-5 transition-all hover:shadow-md bg-purple-50/50 border-purple-100"
          )}
        >
          <div className="mb-3">
            <div className="rounded-lg bg-purple-600 p-2 w-fit">
              <item.icon className="h-6 w-6 text-white" />
            </div>
          </div>
          <h3 className="mb-1.5 text-lg font-semibold text-foreground">{item.title}</h3>

          {/* Risk Score Distribution Pie Chart */}
          <div className="mb-3">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Risk Score Distribution</p>
            <RiskScorePieChart distribution={item.riskScoreDistribution} />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {item.count}
            </span>
            <span className="text-sm text-muted-foreground">
              loans ({item.portfolioPercentage}% of portfolio)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
