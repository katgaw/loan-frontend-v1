"use client";

import { cn } from "@/lib/utils";
import type { Loan } from "@/lib/loan-data";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Shield,
  Bell,
  Download,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";

interface LoanDetailProps {
  loan: Loan;
  onBack: () => void;
}

const statusStyles = {
  PASS: "bg-pass text-white",
  FAIL: "bg-fail text-white",
  WAIVER: "bg-waiver text-white",
};

const severityStyles = {
  Critical: "bg-critical text-white",
  High: "bg-high text-white",
  Medium: "bg-medium text-foreground",
  Low: "bg-low text-white",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function LoanDetail({ loan, onBack }: LoanDetailProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {loan.loanNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {loan.address}, {loan.city}, {loan.state}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold",
              statusStyles[loan.status]
            )}
          >
            {loan.status}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold",
              severityStyles[loan.severity]
            )}
          >
            {loan.severity}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* AI Explanation */}
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">
                AI-Generated Risk Analysis
              </h2>
            </div>
            <p className="leading-relaxed text-foreground">
              {loan.aiExplanation}
            </p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                <MessageSquare className="h-4 w-4" />
                Ask Follow-up
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Property Information */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              Property Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{loan.address}</p>
                <p className="text-sm text-muted-foreground">
                  {loan.city}, {loan.state}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Property Type</p>
                <p className="font-medium text-foreground">
                  {loan.propertyType}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Units</p>
                <p className="font-medium text-foreground">
                  {loan.units > 1 ? `${loan.units} Units` : "Single Asset"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loan Type</p>
                <p className="font-medium text-foreground">{loan.loanType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Financing</p>
                <p className="font-medium text-foreground">{loan.financing}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="font-medium text-foreground">
                  {loan.occupancy > 0 ? `${loan.occupancy}%` : "Pre-Stabilized"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial Metrics */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Financial Metrics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(loan.loanAmount)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  Unpaid Principal Balance
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(loan.upb)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">DSCR</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    loan.dscr < 1.0
                      ? "text-fail"
                      : loan.dscr < 1.2
                        ? "text-medium"
                        : "text-foreground"
                  )}
                >
                  {loan.dscr > 0 ? loan.dscr.toFixed(2) : "N/A"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">LTV</p>
                <p className="text-xl font-bold text-foreground">
                  {loan.ltv.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Rules */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Compliance Rules
            </h2>
            <div className="space-y-3">
              {loan.rules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{rule}</p>
                    <p className="text-sm text-muted-foreground">
                      Rule violation detected - requires review
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-3 rounded-lg border border-pass/20 bg-pass/5 p-3">
                <CheckCircle2 className="h-5 w-5 text-pass" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Insurance Verification
                  </p>
                  <p className="text-sm text-muted-foreground">
                    All insurance requirements met
                  </p>
                </div>
                <span className="rounded-full bg-pass px-2.5 py-0.5 text-xs font-semibold text-white">
                  PASS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Score Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Risk Assessment
            </h2>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Score</span>
              <span
                className={cn(
                  "text-2xl font-bold",
                  loan.riskScore >= 4
                    ? "text-critical"
                    : loan.riskScore >= 3
                      ? "text-high"
                      : loan.riskScore >= 2
                        ? "text-medium"
                        : "text-low"
                )}
              >
                {loan.riskScore}/4
              </span>
            </div>
            <div className="mb-6 flex gap-1">
              {[1, 2, 3, 4].map((score) => (
                <div
                  key={score}
                  className={cn(
                    "h-3 flex-1 rounded",
                    score <= loan.riskScore
                      ? loan.riskScore >= 4
                        ? "bg-critical"
                        : loan.riskScore >= 3
                          ? "bg-high"
                          : loan.riskScore >= 2
                            ? "bg-medium"
                            : "bg-low"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Compliance Score
                </span>
                <span
                  className={cn(
                    "font-semibold",
                    Math.round((loan.complianceScore / 100) * 30) >= 21
                      ? "text-pass"
                      : Math.round((loan.complianceScore / 100) * 30) >= 15
                        ? "text-medium"
                        : "text-fail"
                  )}
                >
                  {Math.round((loan.complianceScore / 100) * 30)}/30
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Flags Triggered
                </span>
                <span className="font-semibold text-foreground">
                  {loan.flagPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    loan.flagPercentage >= 50
                      ? "bg-fail"
                      : loan.flagPercentage >= 30
                        ? "bg-medium"
                        : "bg-pass"
                  )}
                  style={{ width: `${loan.flagPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Loan Info Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Loan Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Lender</p>
                <p className="font-medium text-foreground">{loan.lenderName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acquisition Date</p>
                <p className="font-medium text-foreground">
                  {formatDate(loan.acquisitionDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Last Review Date
                </p>
                <p className="font-medium text-foreground">
                  {formatDate(loan.lastReviewDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Next Review Date
                </p>
                <p className="font-medium text-foreground">
                  {formatDate(loan.nextReviewDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {(loan.severity === "Critical" || loan.severity === "High") && (
                <Button className="w-full gap-2" variant="destructive">
                  <Bell className="h-4 w-4" />
                  Send Breach Alert
                </Button>
              )}
              <Button className="w-full gap-2" variant="default">
                <Clock className="h-4 w-4" />
                Schedule Review
              </Button>
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <Download className="h-4 w-4" />
                Download Report
              </Button>
              <Button className="w-full gap-2 bg-transparent" variant="outline">
                <MessageSquare className="h-4 w-4" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
