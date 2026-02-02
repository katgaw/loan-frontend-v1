"use client";

import { cn } from "@/lib/utils";
import { DollarSign, BarChart3 } from "lucide-react";
import { systemRecommendations } from "@/lib/loan-data";

const recommendationItems = [
  {
    key: "incomeExpenseAnalysis",
    title: "Income & Expense",
    icon: DollarSign,
    data: systemRecommendations.incomeExpenseAnalysis,
  },
  {
    key: "valuationAnalysis",
    title: "Valuation",
    icon: BarChart3,
    data: systemRecommendations.valuationAnalysis,
  },
];

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
  const total = distribution.score1 + distribution.score2 + distribution.score3 + distribution.score4;
  const size = 80;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Convert percentages to loan counts (assuming total loans in each category)
  const loanCounts = {
    score1: Math.round((distribution.score1 / 100) * total) || distribution.score1,
    score2: Math.round((distribution.score2 / 100) * total) || distribution.score2,
    score3: Math.round((distribution.score3 / 100) * total) || distribution.score3,
    score4: Math.round((distribution.score4 / 100) * total) || distribution.score4,
  };
  
  const segments = [
    { value: distribution.score1, count: loanCounts.score1, color: "#22c55e", label: "1 - Meets/Exceeds Expectation" },
    { value: distribution.score2, count: loanCounts.score2, color: "#eab308", label: "2 - Meets Expectation" },
    { value: distribution.score3, count: loanCounts.score3, color: "#f97316", label: "3 - Below Expectation" },
    { value: distribution.score4, count: loanCounts.score4, color: "#ef4444", label: "4 - Significantly Below Expectation" },
  ];
  
  let currentOffset = 0;
  
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
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
            <span className="text-xs text-muted-foreground">{segment.label}: {segment.count} {segment.count === 1 ? "loan" : "loans"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SystemRecommendations() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-1 text-xl font-semibold text-card-foreground">
        Results by Risk Category
      </h2>
      <p className="mb-5 text-base text-muted-foreground">
        Number of loans by risk score
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {recommendationItems.map((item) => (
          <div
            key={item.key}
            className={cn(
              "relative overflow-hidden rounded-lg border p-5 transition-all hover:shadow-md",
              severityStyles[item.data.severity]
            )}
          >
            <div className="mb-3">
              <div className="rounded-lg bg-background/50 p-2 w-fit">
                <item.icon className="h-6 w-6" />
              </div>
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-foreground">{item.title}</h3>
            
            {/* Risk Score Distribution Pie Chart */}
            <div className="mb-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Risk Score Distribution</p>
              <RiskScorePieChart distribution={item.data.riskScoreDistribution} />
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {item.data.count}
              </span>
              <span className="text-sm text-muted-foreground">
                loans ({item.data.portfolioPercentage}% of portfolio)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
