import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button.component';
import { TextareaComponent } from '../components/ui/textarea/textarea.component';
import { loansData, Loan } from '../../lib/loan-data';
import { cn } from '../../lib/utils';
import { ApiService } from '../services/api.service';
import { buildRuleCategoriesBySectionFromTestJson, UiRuleCategory, RuleStatus } from '../../lib/test-rule-results';
import { parsePropertyAddressFromLoanSummaryStatement, ParsedPropertyAddress } from '../../lib/address';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  const ms = Date.parse(dateString);
  if (!Number.isFinite(ms)) return "—";
  return new Date(ms).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

interface Rule {
  ruleId?: string;
  name: string;
  description: string;
  status: RuleStatus;
  riskScore: 1 | 2 | 3 | 4;
  subrules: Array<{ name: string; description: string; status: RuleStatus }>;
}

interface RiskInsight {
  factPattern: {
    facts: Array<{ label: string; value: string }>;
    observations: string[] | string;
  };
  lenderJustification: string[] | string;
  finalConclusion: string[] | string;
}

interface ComparisonItem {
  question: string;
  answer: string;
}

interface ComparisonData {
  items: ComparisonItem[];
}

interface RuleCategory {
  name: string;
  rules: Rule[];
  insight: RiskInsight;
  comparison: ComparisonData;
}

function pickLoanSummaryStatement(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  // Handle both "facts_lookup" (correct) and "facts_loodkup" (typo in test.json)
  const factsLookup = (data as Record<string, unknown>)["facts_lookup"] || 
                      (data as Record<string, unknown>)["facts_loodkup"];
  if (!factsLookup || typeof factsLookup !== "object") return null;
  const factLoanSummary031 = (factsLookup as Record<string, unknown>)["fact_loan_summary_031"];
  if (!factLoanSummary031 || typeof factLoanSummary031 !== "object") return null;
  const statement = (factLoanSummary031 as Record<string, unknown>)["statement"];
  return typeof statement === "string" ? statement : null;
}

function pickLoanSummaryScores(data: unknown): { riskScore: 1 | 2 | 3 | 4; compliance: { passed: number; total: number } } | null {
  if (!data || typeof data !== "object") return null;
  const loanSummary = (data as Record<string, unknown>)["loan_summary"];
  if (!loanSummary || typeof loanSummary !== "object") return null;

  const rawRisk = (loanSummary as Record<string, unknown>)["risk_score"];
  const risk = typeof rawRisk === "string" ? Number.parseInt(rawRisk, 10) : rawRisk;
  if (typeof risk !== "number" || !Number.isFinite(risk)) return null;
  if (risk !== 1 && risk !== 2 && risk !== 3 && risk !== 4) return null;

  const rawCompliance = (loanSummary as Record<string, unknown>)["compliance_score"];
  if (typeof rawCompliance !== "string") return null;
  const parts = rawCompliance.split("/").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const passed = Number.parseInt(parts[0] ?? "", 10);
  const total = Number.parseInt(parts[1] ?? "", 10);
  if (!Number.isFinite(passed) || !Number.isFinite(total) || total <= 0) return null;

  return { riskScore: risk, compliance: { passed, total } };
}

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, TextareaComponent],
  template: `
    <div class="space-y-6">
      <!-- Back Button -->
      <app-button
        variant="outline"
        size="sm"
        className="gap-2 bg-transparent mb-4"
        (click)="goBack()"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Back to List
      </app-button>

      <!-- Page Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-foreground">
            Loan Detail Analysis
          </h1>
          <p class="mt-1 text-lg text-muted-foreground">
            Comprehensive loan review and risk assessment
          </p>
        </div>
        <div class="flex gap-2">
          <app-button variant="outline" size="default" className="gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export Report
          </app-button>
          <app-button variant="outline" size="default" className="gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Print View
          </app-button>
        </div>
      </div>

      @if (displayedLoan()) {
        @let loan = displayedLoan()!;
        <!-- Loan Details Card -->
        <div class="rounded-xl border border-border bg-card p-6">
          <div class="mb-6 flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-foreground">
                {{ loan.address }} - {{ loan.financing }}
              </h2>
              <p class="text-base text-muted-foreground">
                {{ loan.address }}, {{ loan.city }}, {{ loan.state }}
              </p>
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <!-- Left Column -->
            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Number</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ loan.loanNumber }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Type</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ loan.propertyType }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lender Name</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ loan.lenderName?.trim() ? loan.lenderName : '—' }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Type</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ loan.loanType }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Borrower</p>
                <p class="mt-1 text-base font-bold text-foreground">—</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Compliance Score</p>
                <div class="mt-1 flex items-center gap-2">
                  <p class="text-base font-bold text-foreground">{{ loan.complianceScoreData.passed }}/{{ loan.complianceScoreData.total }}</p>
                  <div class="flex gap-1">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <div
                        [class]="cn(
                          'h-4 w-4 rounded',
                          i <= Math.round((loan.complianceScoreData.passed / loan.complianceScoreData.total) * 5)
                            ? 'bg-yellow-500'
                            : 'border border-gray-300 bg-transparent'
                        )"
                      ></div>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan Amount</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ formatCurrency(loan.loanAmount) }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acquisition Date</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ formatDate(loan.acquisitionDate ?? '') }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current UPB</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ formatCurrency(loan.upb) }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commitment Date</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ formatDate(loan.commitmentDate ?? '') }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Units</p>
                <p class="mt-1 text-base font-bold text-foreground">{{ loan.units }}</p>
              </div>
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Score</p>
                <div class="mt-1 flex items-center gap-3">
                  <!-- Semicircular Progress Bar -->
                  <svg width="80" height="48" viewBox="0 0 80 80" class="overflow-visible flex-shrink-0">
                    <defs>
                      <clipPath [id]="'semicircle-mask-' + loan.id + '-' + loan.riskScore">
                        <rect x="0" y="0" width="80" height="44"></rect>
                      </clipPath>
                    </defs>
                    <!-- Background circle (unfilled) - clipped to show only top half -->
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="#e5e7eb"
                      stroke-width="8"
                      stroke-linecap="round"
                      [attr.clip-path]="'url(#semicircle-mask-' + loan.id + '-' + loan.riskScore + ')'"
                    ></circle>
                    <!-- Filled circle - clipped to show only top half, rotated to start from left -->
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      [attr.stroke]="getRiskScoreColor(loan.riskScore)"
                      stroke-width="8"
                      stroke-linecap="round"
                      [attr.stroke-dasharray]="getSemicircleLength()"
                      [attr.stroke-dashoffset]="getRiskScoreOffset(loan.riskScore)"
                      [attr.clip-path]="'url(#semicircle-mask-' + loan.id + '-' + loan.riskScore + ')'"
                      class="transition-all duration-300"
                      transform="rotate(-90 40 40)"
                    ></circle>
                  </svg>
                  <span
                    class="text-lg font-bold"
                    [style.color]="getRiskScoreColor(loan.riskScore)"
                  >
                    {{ loan.riskScore }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="space-y-6">
          <!-- Summary Narrative -->
            <div class="rounded-xl border border-border bg-card p-6">
              <div class="mb-4 flex items-center gap-2">
                <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <h2 class="text-xl font-bold text-foreground">
                  Summary Narrative
                </h2>
              </div>
              <p class="leading-relaxed text-foreground">
                {{ loan.aiExplanation }}
              </p>
            </div>

            <!-- Key Risk Areas Identified -->
            <div class="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
              <div class="mb-4 flex items-center gap-2">
                <svg class="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h2 class="text-lg font-semibold text-foreground">
                  Key Risk Areas Identified
                </h2>
              </div>
              <ul class="space-y-2">
                @for (riskArea of loan.keyRiskAreas; track riskArea) {
                  <li class="flex items-start gap-2">
                    <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive"></span>
                    <span class="text-foreground">{{ riskArea }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Detailed Rule Analysis -->
            <div class="rounded-xl border border-border bg-card p-6">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  <h2 class="text-xl font-semibold text-card-foreground">Detailed Rule Analysis</h2>
                </div>
                <app-button 
                  variant="destructive" 
                  className="gap-2 text-base"
                  (click)="navigateToRedFlagReview()"
                >
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path>
                  </svg>
                  Red Flag Review
                </app-button>
              </div>

              <!-- Tabs -->
              <div class="mb-6 flex gap-2 border-b border-border">
                <button
                  (click)="setActiveTab('income')"
                  [class]="cn(
                    'px-4 py-3 text-base font-medium transition-colors border-b-2 -mb-[2px]',
                    activeTab() === 'income'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )"
                >
                  Income & Expense
                </button>
                <button
                  (click)="setActiveTab('valuation')"
                  [class]="cn(
                    'px-4 py-3 text-base font-medium transition-colors border-b-2 -mb-[2px]',
                    activeTab() === 'valuation'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )"
                >
                  Valuation
                </button>
              </div>

              <!-- Tab Content -->
              <div class="space-y-6">
                <!-- Header with Risk Score and Compliance Score -->
                <div class="rounded-lg border border-border bg-muted/30 p-5">
                  <div class="flex flex-wrap items-center justify-between gap-4">
                    <h3 class="text-xl font-semibold text-foreground">{{ getCurrentTabTitle() }}</h3>
                    <div class="flex flex-wrap items-center gap-6">
                      @if (activeTab() === 'income') {
                        <!-- Risk Score -->
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-muted-foreground">Risk Score:</span>
                          <div class="flex items-center gap-2">
                            <svg width="36" height="22" viewBox="0 0 36 22" class="flex-shrink-0">
                              <path
                                d="M 4 20 A 14 14 0 0 1 10 8"
                                fill="none"
                                [attr.stroke]="loan.riskScore === 1 ? '#22c55e' : '#e5e7eb'"
                                stroke-width="3"
                                stroke-linecap="round"
                              />
                              <path
                                d="M 11 7 A 14 14 0 0 1 18 5"
                                fill="none"
                                [attr.stroke]="loan.riskScore <= 2 ? '#22c55e' : '#e5e7eb'"
                                stroke-width="3"
                                stroke-linecap="round"
                              />
                              <path
                                d="M 19 5 A 14 14 0 0 1 26 7"
                                fill="none"
                                [attr.stroke]="loan.riskScore === 3 ? '#eab308' : '#e5e7eb'"
                                stroke-width="3"
                                stroke-linecap="round"
                              />
                              <path
                                d="M 27 8 A 14 14 0 0 1 32 20"
                                fill="none"
                                [attr.stroke]="loan.riskScore === 4 ? '#ef4444' : '#e5e7eb'"
                                stroke-width="3"
                                stroke-linecap="round"
                              />
                              <line
                                x1="18"
                                y1="20"
                                [attr.x2]="getSmallGaugeNeedleX(loan.riskScore)"
                                [attr.y2]="getSmallGaugeNeedleY(loan.riskScore)"
                                [attr.stroke]="getRiskScoreColor(loan.riskScore)"
                                stroke-width="2"
                                stroke-linecap="round"
                              />
                              <circle cx="18" cy="20" r="2.5" [attr.fill]="getRiskScoreColor(loan.riskScore)" />
                            </svg>
                            <span [class]="cn(
                              'text-lg font-bold',
                              loan.riskScore <= 2 ? 'text-pass' : loan.riskScore === 3 ? 'text-medium' : 'text-fail'
                            )">
                              {{ loan.riskScore }}
                            </span>
                          </div>
                        </div>
                      }
                      <!-- Compliance Score -->
                      <div class="flex items-center gap-2">
                        <span class="text-sm text-muted-foreground">Compliance Score:</span>
                        <div class="flex items-center gap-2">
                          <div class="flex gap-0.5">
                            @for (i of [1, 2, 3, 4, 5]; track i) {
                              <div
                                class="h-4 w-3 rounded-sm"
                                [style.backgroundColor]="i <= getComplianceFilledSegments() ? getComplianceColor() : '#e5e7eb'"
                              ></div>
                            }
                          </div>
                          <span [class]="cn('text-lg font-bold', getComplianceColorClass())">
                            {{ getCompliancePassed() }}/{{ getComplianceTotal() }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Summary Section -->
                  @if (activeTab() === 'income' && getCurrentRules().length > 0) {
                    <div class="mt-4 border-t border-border pt-4">
                      <h4 class="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Summary
                      </h4>
                      <p class="text-base leading-relaxed text-foreground">
                        The {{ getCurrentTabTitle() }} section covers {{ getCurrentRules().length }} rule categor{{ getCurrentRules().length === 1 ? 'y' : 'ies' }} with {{ getTotalRuleCount() }} individual rule{{ getTotalRuleCount() === 1 ? '' : 's' }}. Key areas reviewed include {{ getCategoryNamesList() }}. {{ getFailedRuleCount() }} rule{{ getFailedRuleCount() === 1 ? '' : 's' }} require{{ getFailedRuleCount() === 1 ? 's' : '' }} attention{{ getFailedRuleCount() > 0 ? ', primarily in areas related to insurance underwriting and expense trending assumptions' : '' }}.
                      </p>
                    </div>
                  }
                </div>

                @if (getCurrentRules().length > 0) {
                  <div class="space-y-4">
                    @for (category of getCurrentRules(); track category.name) {
                      <div [class]="cn(
                        'grid gap-4 overflow-hidden',
                        isInsightOpen(category.name) || isComparisonOpen(category.name) ? 'lg:grid-cols-2' : ''
                      )">
                        <div class="rounded-lg border border-border bg-card overflow-hidden">
                          <!-- Category Header -->
                          <div
                            class="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                            (click)="toggleCategory(category.name)"
                          >
                            @if (expandedCategories()[category.name]) {
                              <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                              </svg>
                            } @else {
                              <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            }
                            <h3 class="text-xl font-bold text-foreground">{{ category.name }}</h3>
                            <span [class]="cn(
                              'rounded-md px-3 py-1.5 text-sm font-semibold w-16 text-center',
                              getCategoryStatus(category) === 'PASS'
                                ? 'bg-pass/10 text-pass border border-pass/30'
                                : 'bg-fail/10 text-fail border border-fail/30'
                            )">
                              {{ getCategoryStatus(category) }}
                            </span>
                            <div class="flex items-center gap-3">
                              <app-button
                                variant="ghost"
                                type="button"
                                [className]="cn(
                                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm !border !border-accent !text-accent hover:!shadow-lg hover:!shadow-accent/20 hover:!scale-[1.02]',
                                  isInsightOpen(category.name)
                                    ? '!bg-transparent hover:!bg-accent/10'
                                    : '!bg-gradient-to-r !from-accent/90 !to-accent hover:!bg-white'
                                )"
                                (click)="$event.stopPropagation(); toggleInsight(category.name)"
                                title="View Risk Insight"
                              >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                                View Insight
                              </app-button>
                              <app-button
                                variant="ghost"
                                type="button"
                                [className]="cn(
                                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all shadow-sm !border !border-accent !text-accent hover:!shadow-lg hover:!shadow-accent/20 hover:!scale-[1.02]',
                                  isComparisonOpen(category.name)
                                    ? '!bg-transparent hover:!bg-accent/10'
                                    : '!bg-gradient-to-r !from-accent/90 !to-accent hover:!bg-white'
                                )"
                                (click)="$event.stopPropagation(); toggleComparison(category.name)"
                                title="View Comparison"
                              >
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                                </svg>
                                View Comparison
                              </app-button>
                            </div>
                          </div>

                          <!-- Expanded Content -->
                          @if (expandedCategories()[category.name]) {
                            <div class="border-t border-border px-5 py-4 space-y-4">
                              @for (rule of category.rules; track rule.name) {
                                <div [class]="cn(
                                  'rounded-xl border transition-colors relative',
                                  rule.status === 'n/a'
                                    ? 'border-muted bg-muted/30'
                                    : rule.status === 'pass'
                                      ? 'border-border bg-card'
                                      : 'border-fail/20 bg-fail/[0.02]'
                                )">
                                  <!-- Clickable Header Row -->
                                  <div class="flex w-full items-center justify-between gap-4 p-5">
                                    <button
                                      type="button"
                                      (click)="toggleRuleExpansion(category.name, rule.name); $event.stopPropagation()"
                                      class="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity"
                                    >
                                      @if (getExpandedRule(category.name, rule.name)) {
                                        <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                      } @else {
                                        <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                      }
                                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <h4 class="text-lg font-semibold text-foreground">{{ rule.name }}</h4>
                                        @if (rule.ruleId) {
                                          <span class="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            Rule ID: {{ rule.ruleId }}
                                          </span>
                                        }
                                      </div>
                                    </button>
                                    <div class="flex items-center gap-3">
                                      <!-- Comment Icon -->
                                      <button
                                        type="button"
                                        (click)="toggleRuleComment(category.name, rule.name); $event.stopPropagation()"
                                        [class]="cn(
                                          'relative rounded-md p-1.5 transition-colors hover:bg-muted',
                                          getComment(category.name, rule.name) ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                                        )"
                                        title="Add comment"
                                      >
                                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                        </svg>
                                        @if (getComment(category.name, rule.name)) {
                                          <span class="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-accent"></span>
                                        }
                                      </button>
                                      @if (rule.status === 'n/a') {
                                        <span class="text-sm font-medium text-muted-foreground shrink-0">N/A</span>
                                      } @else if (rule.status === 'pass') {
                                        <svg class="h-6 w-6 shrink-0 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                      } @else {
                                        <svg class="h-6 w-6 shrink-0 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                      }
                                    </div>
                                  </div>

                                  <!-- Comment Popup -->
                                  @if (getOpenRuleComment(category.name, rule.name)) {
                                    <div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-4 shadow-lg">
                                      <div class="mb-3 flex items-center justify-between">
                                        <h5 class="text-sm font-semibold text-foreground">Comment for: {{ rule.name }}</h5>
                                        <button
                                          type="button"
                                          (click)="toggleRuleComment(category.name, rule.name); $event.stopPropagation()"
                                          class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                          </svg>
                                        </button>
                                      </div>
                                      <app-textarea
                                        [value]="getRuleCommentText(category.name, rule.name)"
                                        (valueChange)="onRuleCommentTextChange(category.name, rule.name, $event)"
                                        placeholder="Enter your comment here..."
                                        className="mb-3 min-h-[100px] resize-none text-sm"
                                      ></app-textarea>
                                      <div class="flex justify-end gap-2">
                                        <app-button
                                          variant="outline"
                                          size="sm"
                                          (click)="toggleRuleComment(category.name, rule.name); $event.stopPropagation()"
                                          className="bg-transparent"
                                        >
                                          Cancel
                                        </app-button>
                                        <app-button
                                          size="sm"
                                          (click)="handleSaveComment(category.name, rule.name, getRuleCommentText(category.name, rule.name)); $event.stopPropagation()"
                                        >
                                          Save Comment
                                        </app-button>
                                      </div>
                                    </div>
                                  }

                                  <!-- Expanded Content -->
                                  @if (getExpandedRule(category.name, rule.name)) {
                                    <div class="border-t border-border px-5 pb-5 pt-4">
                                      <p class="text-base leading-relaxed text-muted-foreground">{{ rule.description }}</p>

                                      <!-- Subrules Section -->
                                      @if (rule.subrules && rule.subrules.length > 0) {
                                        <div class="mt-4">
                                          <h5 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Subrules</h5>
                                          <div class="space-y-2">
                                            @for (subrule of rule.subrules; track subrule.name) {
                                              <div class="relative">
                                                <div
                                                  [class]="cn(
                                                    'flex items-center justify-between gap-4 rounded-lg border p-3',
                                                    subrule.status === 'n/a'
                                                      ? 'border-muted bg-muted/30'
                                                      : subrule.status === 'pass'
                                                        ? 'border-pass/20 bg-pass/5'
                                                        : 'border-fail/20 bg-fail/5'
                                                  )"
                                                >
                                                  <div class="flex items-start gap-3 flex-1">
                                                    @if (subrule.status === 'n/a') {
                                                      <span class="mt-0.5 text-xs font-medium text-muted-foreground shrink-0">N/A</span>
                                                    } @else if (subrule.status === 'pass') {
                                                      <svg class="mt-0.5 h-4 w-4 shrink-0 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                      </svg>
                                                    } @else {
                                                      <svg class="mt-0.5 h-4 w-4 shrink-0 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                      </svg>
                                                    }
                                                    <div class="flex-1">
                                                      <p [class]="cn(
                                                        'text-sm font-medium',
                                                        subrule.status === 'n/a' ? 'text-muted-foreground' : 'text-foreground'
                                                      )">{{ subrule.name }}</p>
                                                      <p class="text-sm text-muted-foreground">{{ subrule.description }}</p>
                                                    </div>
                                                  </div>
                                                  <div class="flex items-center gap-2">
                                                    <!-- Subrule Comment Button -->
                                                    <button
                                                      type="button"
                                                      (click)="toggleSubruleComment(category.name, rule.name, subrule.name); $event.stopPropagation()"
                                                      [class]="cn(
                                                        'relative rounded-md p-1 transition-colors hover:bg-muted',
                                                        getSubruleComment(category.name, rule.name, subrule.name) ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                                                      )"
                                                      title="Add comment"
                                                    >
                                                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                                      </svg>
                                                    </button>
                                                    @if (subrule.status === 'n/a') {
                                                      <span class="text-xs font-medium text-muted-foreground shrink-0">N/A</span>
                                                    } @else if (subrule.status === 'pass') {
                                                      <svg class="h-5 w-5 shrink-0 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                      </svg>
                                                    } @else {
                                                      <svg class="h-5 w-5 shrink-0 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                      </svg>
                                                    }
                                                  </div>
                                                </div>
                                                <!-- Subrule Comment Popup -->
                                                @if (getOpenSubruleComment(category.name, rule.name, subrule.name)) {
                                                  <div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 shadow-lg">
                                                    <div class="mb-2 flex items-center justify-between">
                                                      <h6 class="text-xs font-semibold text-foreground">Comment: {{ subrule.name }}</h6>
                                                      <button
                                                        type="button"
                                                        (click)="toggleSubruleComment(category.name, rule.name, subrule.name); $event.stopPropagation()"
                                                        class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                      >
                                                        <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                        </svg>
                                                      </button>
                                                    </div>
                                                    <app-textarea
                                                      [value]="getSubruleCommentText(category.name, rule.name, subrule.name)"
                                                      (valueChange)="onSubruleCommentTextChange(category.name, rule.name, subrule.name, $event)"
                                                      placeholder="Enter comment..."
                                                      className="mb-2 min-h-[60px] resize-none text-xs"
                                                    ></app-textarea>
                                                    <div class="flex justify-end gap-2">
                                                      <app-button
                                                        variant="outline"
                                                        size="sm"
                                                        (click)="toggleSubruleComment(category.name, rule.name, subrule.name); $event.stopPropagation()"
                                                        className="h-7 bg-transparent text-xs"
                                                      >
                                                        Cancel
                                                      </app-button>
                                                      <app-button
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        (click)="handleSaveSubruleComment(category.name, rule.name, subrule.name, getSubruleCommentText(category.name, rule.name, subrule.name)); $event.stopPropagation()"
                                                      >
                                                        Save
                                                      </app-button>
                                                    </div>
                                                  </div>
                                                }
                                              </div>
                                            }
                                          </div>
                                        </div>
                                      }
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          }
                        </div>
                      
                      <!-- Insight Panel for this specific category -->
                      @if (isInsightOpen(category.name)) {
                        <div class="rounded-lg border border-accent/30 bg-accent/5 p-5 max-h-[500px] overflow-y-auto">
                        <div class="mb-4 flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <svg class="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            <h4 class="text-lg font-semibold text-foreground">Risk Insight: {{ category.name }}</h4>
                          </div>
                          <button
                            (click)="toggleInsight(category.name)"
                            class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <div class="space-y-4">
                          <div>
                            <h5 class="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fact Pattern</h5>
                            <div class="rounded-lg border border-border bg-card p-3 space-y-3">
                              @if (category.insight.factPattern.facts && category.insight.factPattern.facts.length > 0) {
                                <div class="text-base leading-relaxed text-foreground">
                                  @for (fact of category.insight.factPattern.facts; track fact.label) {
                                    <div>
                                      <span class="font-semibold">{{ fact.label }}:</span> {{ fact.value }}
                                    </div>
                                  }
                                </div>
                              }
                              @if (getCategoryInsightObservations(category)) {
                                <p class="text-base leading-relaxed text-foreground">{{ getCategoryInsightObservations(category) }}</p>
                              } @else {
                                <p class="text-sm text-muted-foreground italic">No fact pattern summary available.</p>
                              }
                            </div>
                          </div>
                          <div>
                            <h5 class="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lender Justification</h5>
                            <div class="rounded-lg border border-border bg-card p-3">
                              @if (getCategoryLenderJustification(category)) {
                                <p class="text-base leading-relaxed text-foreground">{{ getCategoryLenderJustification(category) }}</p>
                              } @else {
                                <p class="text-sm text-muted-foreground italic">No lender justification available.</p>
                              }
                            </div>
                          </div>
                          <div>
                            <h5 class="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Final Conclusion</h5>
                            <div class="rounded-lg border border-border bg-card p-3">
                              @if (getCategoryFinalConclusion(category)) {
                                <p class="text-base leading-relaxed text-foreground">{{ getCategoryFinalConclusion(category) }}</p>
                              } @else {
                                <p class="text-sm text-muted-foreground italic">No final conclusion available.</p>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      }

                      <!-- Comparison Panel for this specific category -->
                      @if (isComparisonOpen(category.name)) {
                        <div class="sticky top-4 rounded-xl border border-accent/30 bg-accent/5 p-5 max-h-[500px] overflow-y-auto">
                        <div class="mb-4 flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <svg class="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                            </svg>
                            <h4 class="text-lg font-semibold text-foreground">
                              Comparison: {{ category.name }}
                            </h4>
                          </div>
                          <button
                            (click)="toggleComparison(category.name)"
                            class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                        <div class="space-y-3">
                          @if (category.comparison.items.length > 0) {
                            @for (item of category.comparison.items; track $index) {
                              <div class="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
                                <div class="mb-2 flex items-start gap-2">
                                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                                  </svg>
                                  <p class="text-sm font-medium leading-snug text-foreground">{{ item.question }}</p>
                                </div>
                                <div class="ml-6 flex items-center gap-2">
                                  @if (item.answer.trim().toLowerCase() === 'yes') {
                                    <svg class="h-4 w-4 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span class="inline-flex items-center rounded-md border border-pass/30 bg-pass/10 px-2.5 py-1 text-sm font-semibold text-pass">{{ item.answer }}</span>
                                  } @else if (item.answer.trim().toLowerCase() === 'no') {
                                    <svg class="h-4 w-4 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    <span class="inline-flex items-center rounded-md border border-fail/30 bg-fail/10 px-2.5 py-1 text-sm font-semibold text-fail">{{ item.answer }}</span>
                                  } @else {
                                    <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle><circle cx="12" cy="12" r="3" stroke-width="2"></circle></svg>
                                    <span class="inline-flex items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm font-semibold text-muted-foreground">{{ item.answer }}</span>
                                  }
                                </div>
                              </div>
                            }
                          } @else {
                            <p class="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
                              No comparison data available for this category.
                            </p>
                          }
                        </div>
                      </div>
                      }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="rounded-xl border border-border bg-card p-6">
                    <p class="text-muted-foreground">No rule categories available for this section.</p>
                  </div>
                }

                <!-- Additional Comments Section -->
                <div class="rounded-lg border border-border bg-muted/30 p-5">
                  <div class="mb-3 flex items-center gap-2">
                    <svg class="h-5 w-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <h4 class="text-lg font-semibold text-foreground">
                      Additional Comments - {{ getCurrentTabTitle() }}
                    </h4>
                  </div>
                  <app-textarea
                    [value]="activeTab() === 'income' ? incomePageComment() : valuationPageComment()"
                    (valueChange)="onCommentChange($event)"
                    [placeholder]="'Enter any additional comments about ' + getCurrentTabTitle() + ' analysis...'"
                    className="min-h-[120px] resize-none text-base"
                  >                  </app-textarea>
                </div>

                <!-- Export Comments Button -->
                <div class="flex justify-end gap-3 border-t border-border pt-6">
                  <app-button
                    variant="outline"
                    className="gap-2 bg-transparent"
                    (click)="exportCommentsToCSV()"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Export Comments to CSV
                    @if (getTotalComments() > 0) {
                      <span class="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                        {{ getTotalComments() }}
                      </span>
                    }
                  </app-button>
                  <app-button
                    className="gap-2"
                    (click)="savePageComment()"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Save Comments
                  </app-button>
                </div>
              </div>
            </div>
        </div>
      }
      @else {
        <div class="rounded-xl border border-border bg-card p-6">
          <p class="text-muted-foreground">Loan not found</p>
        </div>
      }
    </div>
  `,
  styles: []
})
export class LoanDetailComponent implements OnInit {
  loan: Loan | null = null;
  loanId: string | null = null;

  // Style mappings
  statusStyles: Record<string, string> = {
    PASS: "bg-pass text-white",
    FAIL: "bg-fail text-white",
    WAIVER: "bg-waiver text-white",
  };

  severityStyles: Record<string, string> = {
    Critical: "bg-critical text-white",
    High: "bg-high text-white",
    Medium: "bg-medium text-foreground",
    Low: "bg-low text-white",
  };

  // Detailed Rule Analysis state
  activeTab = signal<'income' | 'valuation'>('income');
  expandedCategories = signal<Record<string, boolean>>({});
  openCategoryInsight = signal<string | null>(null); // Track which category's insight is open
  openCategoryComparison = signal<string | null>(null); // Track which category's comparison is open
  jsonRuleCategoriesBySection = signal<Record<string, UiRuleCategory[]> | null>(null);
  jsonRiskInsights = signal<{
    summary_narrative?: string;
    key_risk_areas?: string[];
  } | null>(null);
  propertyAddressFromFacts = signal<ParsedPropertyAddress | null>(null);
  jsonLoanSummary = signal<Record<string, unknown> | null>(null);
  loanSummaryScores = signal<{ riskScore: 1 | 2 | 3 | 4; compliance: { passed: number; total: number } } | null>(null);
  incomePageComment = signal<string>('');
  valuationPageComment = signal<string>('');
  comments = signal<Record<string, Record<string, string>>>({});
  subruleComments = signal<Record<string, Record<string, Record<string, string>>>>({});
  expandedRules = signal<Record<string, Record<string, boolean>>>({});
  openRuleComment = signal<Record<string, Record<string, boolean>>>({});
  openSubruleComment = signal<Record<string, Record<string, Record<string, boolean>>>>({});
  ruleCommentText = signal<Record<string, Record<string, string>>>({});
  subruleCommentText = signal<Record<string, Record<string, Record<string, string>>>>({});

  // Expose utility functions and Math to template
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  cn = cn;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    // Subscribe to route params to handle navigation
    this.route.paramMap.subscribe(params => {
      this.loanId = params.get('id');
      console.log('Loan ID from route:', this.loanId);
      if (this.loanId) {
        this.loan = loansData.find(loan => loan.id === this.loanId) || null;
        console.log('Found loan:', this.loan);
        if (!this.loan) {
          console.warn('Loan not found for ID:', this.loanId);
          console.log('Available loan IDs:', loansData.map(l => l.id));
        }
      } else {
        console.warn('No loan ID in route');
      }
    });

    // Load JSON data for rule analysis
    this.loadTestJson();
  }

  private loadTestJson() {
    this.apiService.getTestJson().subscribe({
      next: (data) => {
        // Always set headline scores first; other parsing should never block them.
        const scores = pickLoanSummaryScores(data);
        this.loanSummaryScores.set(scores);
        if (scores) {
          console.log('Risk score extracted from test_new.json:', scores.riskScore);
        }

        try {
          const ruleCategories = buildRuleCategoriesBySectionFromTestJson(data);
          console.log('Loaded rule categories from test_new.json:', ruleCategories);
          console.log('Section keys:', Object.keys(ruleCategories));
          this.jsonRuleCategoriesBySection.set(ruleCategories);
        } catch (error) {
          console.error('Error parsing rule categories:', error);
          this.jsonRuleCategoriesBySection.set(null);
        }

        try {
          this.jsonRiskInsights.set(
            data && typeof data === 'object' && 'risk_insights' in data
              ? ((data as any).risk_insights ?? null)
              : null
          );
        } catch (error) {
          console.error('Error parsing risk insights:', error);
          this.jsonRiskInsights.set(null);
        }

        try {
          const statement = pickLoanSummaryStatement(data);
          this.propertyAddressFromFacts.set(parsePropertyAddressFromLoanSummaryStatement(statement));
        } catch (error) {
          console.error('Error parsing property address:', error);
          this.propertyAddressFromFacts.set(null);
        }

        try {
          this.jsonLoanSummary.set(
            data && typeof data === 'object' && 'loan_summary' in data
              ? ((data as any).loan_summary && typeof (data as any).loan_summary === 'object'
                  ? ((data as any).loan_summary as Record<string, unknown>)
                  : null)
              : null
          );
        } catch (error) {
          console.error('Error parsing loan summary:', error);
          this.jsonLoanSummary.set(null);
        }
      },
      error: (error) => {
        console.error('Error loading test_new.json:', error);
        this.jsonRuleCategoriesBySection.set(null);
        this.jsonRiskInsights.set(null);
        this.propertyAddressFromFacts.set(null);
        this.loanSummaryScores.set(null);
        this.jsonLoanSummary.set(null);
      }
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Helper methods for risk score gauge
  getRiskScorePath(score: number): string {
    // Calculate arc path for the gauge (semicircle from left to right)
    // Score 1 = leftmost, Score 4 = rightmost
    const centerX = 32;
    const centerY = 28;
    const radius = 28;
    const startAngle = Math.PI; // 180 degrees (left)
    const endAngle = startAngle - (score / 4) * Math.PI; // Progress based on score
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArcFlag = score > 2 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x2} ${y2}`;
  }

  getRiskScoreNeedleX(score: number): number {
    const centerX = 32;
    const radius = 28;
    const angle = Math.PI - (score / 4) * Math.PI;
    return centerX + radius * Math.cos(angle);
  }

  getRiskScoreNeedleY(score: number): number {
    const centerY = 28;
    const radius = 28;
    const angle = Math.PI - (score / 4) * Math.PI;
    return centerY + radius * Math.sin(angle);
  }

  getRiskScoreColor(score: number): string {
    if (score <= 2) return '#22c55e';
    if (score === 3) return '#eab308';
    return '#ef4444';
  }

  getSemicircleLength(): number {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    return circumference / 2; // semicircle length
  }

  getRiskScoreOffset(score: number): number {
    const maxScore = 4;
    const percentage = (score / maxScore) * 100;
    const semicircleLength = this.getSemicircleLength();
    return semicircleLength - (percentage / 100) * semicircleLength;
  }

  // Helper for smaller gauge (36x22 viewBox)
  getSmallGaugeNeedleX(score: number): number {
    const centerX = 18;
    const radius = 14;
    const angle = Math.PI - (score / 4) * Math.PI;
    return centerX + radius * Math.cos(angle);
  }

  getSmallGaugeNeedleY(score: number): number {
    const centerY = 20;
    const radius = 14;
    const angle = Math.PI - (score / 4) * Math.PI;
    return centerY + radius * Math.sin(angle);
  }

  // Detailed Rule Analysis methods
  setActiveTab(tab: 'income' | 'valuation') {
    this.activeTab.set(tab);
    this.openCategoryInsight.set(null);
    this.openCategoryComparison.set(null);
  }

  toggleCategory(categoryName: string) {
    const current = this.expandedCategories();
    this.expandedCategories.set({
      ...current,
      [categoryName]: !current[categoryName]
    });
  }

  toggleInsight(categoryName: string) {
    const current = this.openCategoryInsight();
    if (current === categoryName) {
      this.openCategoryInsight.set(null);
    } else {
      this.openCategoryInsight.set(categoryName);
      this.openCategoryComparison.set(null); // Close comparison when opening insight
    }
  }

  toggleComparison(categoryName: string) {
    const current = this.openCategoryComparison();
    if (current === categoryName) {
      this.openCategoryComparison.set(null);
    } else {
      this.openCategoryComparison.set(categoryName);
      this.openCategoryInsight.set(null); // Close insight when opening comparison
    }
  }

  getOpenCategoryInsight(): RuleCategory | null {
    const categoryName = this.openCategoryInsight();
    if (!categoryName) return null;
    const rules = this.getCurrentRules();
    // Find the exact category match - case-insensitive comparison to handle any naming differences
    const found = rules.find(cat => 
      cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );
    if (!found) {
      console.warn('Category not found:', { categoryName, availableCategories: rules.map(c => c.name) });
      return null;
    }
    return found;
  }

  getOpenCategoryComparison(): RuleCategory | null {
    const categoryName = this.openCategoryComparison();
    if (!categoryName) return null;
    const rules = this.getCurrentRules();
    return rules.find(cat => cat.name === categoryName) || null;
  }

  isInsightOpen(categoryName: string): boolean {
    return this.openCategoryInsight() === categoryName;
  }

  isComparisonOpen(categoryName: string): boolean {
    return this.openCategoryComparison() === categoryName;
  }

  hasAnyPanelOpen(): boolean {
    return this.openCategoryInsight() !== null || this.openCategoryComparison() !== null;
  }

  getCurrentTabTitle(): string {
    return this.activeTab() === 'income' ? 'Income & Expense' : 'Valuation';
  }

  getCurrentRules(): RuleCategory[] {
    const jsonRules = this.jsonRuleCategoriesBySection();
    if (!jsonRules) {
      console.log('No JSON rules loaded yet');
      return [];
    }

    console.log('Available sections:', Object.keys(jsonRules));
    console.log('Active tab:', this.activeTab());

    if (this.activeTab() === 'income') {
      // Look for section that contains "income" (case-insensitive)
      // The test_new.json has "Income & Expenses" as the section name (note: "Expenses" plural)
      const incomeKey = Object.keys(jsonRules).find(k => 
        k.toLowerCase().includes('income') || k.toLowerCase().includes('expense')
      );
      console.log('Found income key:', incomeKey);
      if (incomeKey && jsonRules[incomeKey]) {
        const rules = jsonRules[incomeKey] as unknown as RuleCategory[];
        console.log('Returning rules for income tab:', rules);
        return rules;
      }
      // If no income section found, return first available section as fallback
      const firstKey = Object.keys(jsonRules)[0];
      if (firstKey) {
        console.log('Using first available section as fallback:', firstKey);
        return jsonRules[firstKey] as unknown as RuleCategory[];
      }
      return [];
    }
    
    // Valuation tab - look for sections that might be valuation-related
    if (this.activeTab() === 'valuation') {
      const valuationKey = Object.keys(jsonRules).find(k => 
        k.toLowerCase().includes('valuation') || k.toLowerCase().includes('appraisal')
      );
      if (valuationKey && jsonRules[valuationKey]) {
        return jsonRules[valuationKey] as unknown as RuleCategory[];
      }
      // Return empty for valuation if no matching section
      return [];
    }
    
    return [];
  }

  getTotalRuleCount(): number {
    return this.getCurrentRules().reduce((acc, cat) => acc + cat.rules.length, 0);
  }

  getFailedRuleCount(): number {
    return this.getCurrentRules().reduce((acc, cat) => 
      acc + cat.rules.filter(r => r.status === 'fail').length, 0
    );
  }

  getCategoryNamesList(): string {
    const categories = this.getCurrentRules();
    if (categories.length === 0) return 'various rule categories';
    if (categories.length === 1) return categories[0].name;
    if (categories.length === 2) return `${categories[0].name} and ${categories[1].name}`;
    const allButLast = categories.slice(0, -1).map(c => c.name).join(', ');
    const last = categories[categories.length - 1].name;
    return `${allButLast}, and ${last}`;
  }

  getCategoryStatus(category: RuleCategory): string {
    const failCount = category.rules.filter(r => r.status === 'fail').length;
    return failCount === 0 ? 'PASS' : 'FAIL';
  }

  getCompliancePassed(): number {
    const loan = this.displayedLoan();
    if (!loan) return 0;
    return loan.complianceScoreData.passed;
  }

  getComplianceTotal(): number {
    const loan = this.displayedLoan();
    if (!loan) return 0;
    return loan.complianceScoreData.total;
  }

  getComplianceFilledSegments(): number {
    const percentage = this.getComplianceTotal() > 0 
      ? (this.getCompliancePassed() / this.getComplianceTotal()) * 100 
      : 0;
    return Math.round((percentage / 100) * 5);
  }

  getComplianceColor(): string {
    const percentage = this.getComplianceTotal() > 0 
      ? (this.getCompliancePassed() / this.getComplianceTotal()) * 100 
      : 0;
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 50) return '#eab308';
    return '#ef4444';
  }

  getComplianceColorClass(): string {
    const percentage = this.getComplianceTotal() > 0 
      ? (this.getCompliancePassed() / this.getComplianceTotal()) * 100 
      : 0;
    if (percentage >= 70) return 'text-pass';
    if (percentage >= 50) return 'text-medium';
    return 'text-fail';
  }

  getComplianceFillColor(): string {
    return this.getComplianceColor();
  }

  // Helper functions for extracting data from JSON (matching React implementation)
  private textOrDash(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value.trim() ? value : '—';
    return String(value);
  }

  private pickLoanSummaryField(...keys: string[]): unknown {
    const summary = this.jsonLoanSummary();
    if (!summary) return undefined;
    for (const key of keys) {
      if (key in summary) return summary[key];
    }
    return undefined;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      // Remove commas from formatted numbers (e.g., "45,500,000" -> "45500000")
      const cleaned = trimmed.replace(/,/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  // Computed property for displayed loan details (merging base loan with JSON data)
  displayedLoan = computed(() => {
    if (!this.loan) return null;

    const jsonLoanSummary = this.jsonLoanSummary();
    if (!jsonLoanSummary) {
      // No JSON data available, use base loan data
      return this.loan;
    }

    // Try to match by loan_id first (internal ID), then by loan_number
    const jsonLoanId = this.pickLoanSummaryField('loan_id', 'loanId');
    const jsonLoanNumber = this.pickLoanSummaryField('loan_number', 'loanNumber');
    
    // Match by ID if available, otherwise match by loan number
    const matchesById = jsonLoanId !== undefined && 
                   String(jsonLoanId) === this.loan.id;
    const matchesByNumber = jsonLoanNumber !== undefined && 
                           typeof jsonLoanNumber === 'string' &&
                           jsonLoanNumber.trim() !== '' &&
                           jsonLoanNumber === this.loan.loanNumber;
    
    const hasJsonLoanSummary = matchesById || matchesByNumber;
    
    // Calculate display values first (before using them)
    const displayRiskScore = this.loanSummaryScores()?.riskScore ?? this.loan.riskScore;
    const displayCompliance = this.loanSummaryScores()?.compliance ?? this.loan.complianceScoreData;
    
    console.log('Loan matching check:', {
      loanId: this.loan.id,
      loanNumber: this.loan.loanNumber,
      jsonLoanId,
      jsonLoanNumber,
      matchesById,
      matchesByNumber,
      hasJsonLoanSummary,
      jsonLoanSummary: jsonLoanSummary
    });
    
    if (hasJsonLoanSummary) {
      console.log('Using JSON data for loan details. Fields from JSON:', {
        propertyType: this.pickLoanSummaryField('property_type', 'propertyType'),
        loanAmount: this.pickLoanSummaryField('loan_amount', 'loanAmount'),
        upb: this.pickLoanSummaryField('upb', 'current_upb', 'currentUPB'),
        units: this.pickLoanSummaryField('units'),
        riskScore: displayRiskScore,
        complianceScore: displayCompliance
      });
    } else {
      console.log('Using base loan data (no JSON match found)');
    }

    return {
      ...this.loan,
      // Always use JSON data if available and matches, otherwise use base loan data
      loanNumber: hasJsonLoanSummary && jsonLoanNumber !== undefined
        ? this.textOrDash(jsonLoanNumber)
        : this.loan.loanNumber,
      loanAmount: hasJsonLoanSummary
        ? (this.toNumber(this.pickLoanSummaryField('loan_amount', 'loanAmount')) ?? this.loan.loanAmount)
        : this.loan.loanAmount,
      propertyType: hasJsonLoanSummary
        ? this.textOrDash(this.pickLoanSummaryField('property_type', 'propertyType'))
        : this.loan.propertyType,
      acquisitionDate: hasJsonLoanSummary
        ? this.textOrDash(this.pickLoanSummaryField('acquisition_date', 'acquisitionDate'))
        : this.loan.acquisitionDate,
      lenderName: hasJsonLoanSummary
        ? this.textOrDash(this.pickLoanSummaryField('lender', 'lender_name', 'lenderName'))
        : this.loan.lenderName,
      upb: hasJsonLoanSummary
        ? (this.toNumber(this.pickLoanSummaryField('upb', 'current_upb', 'currentUPB')) ?? this.loan.upb)
        : this.loan.upb,
      loanType: hasJsonLoanSummary
        ? this.textOrDash(this.pickLoanSummaryField('product_type', 'productType'))
        : this.loan.loanType,
      commitmentDate: hasJsonLoanSummary
        ? this.textOrDash(this.pickLoanSummaryField('commitment_date', 'commitmentDate'))
        : this.loan.commitmentDate,
      units: hasJsonLoanSummary
        ? (this.toNumber(this.pickLoanSummaryField('units')) ?? this.loan.units)
        : this.loan.units,
      riskScore: displayRiskScore,
      complianceScoreData: displayCompliance,
      // Override narrative and key risk areas from JSON if available
      aiExplanation: this.getDisplayedNarrative(),
      keyRiskAreas: this.getDisplayedKeyRiskAreas(),
    };
  });

  private hasJsonLoanSummary(): boolean {
    const jsonLoanSummary = this.jsonLoanSummary();
    if (!jsonLoanSummary || !this.loan) return false;
    
    const jsonLoanId = this.pickLoanSummaryField('loan_id', 'loanId');
    const jsonLoanNumber = this.pickLoanSummaryField('loan_number', 'loanNumber');
    const matchesById = jsonLoanId !== undefined && String(jsonLoanId) === this.loan.id;
    const matchesByNumber = jsonLoanNumber !== undefined && 
                           typeof jsonLoanNumber === 'string' &&
                           jsonLoanNumber.trim() !== '' &&
                           jsonLoanNumber === this.loan.loanNumber;
    return matchesById || matchesByNumber;
  }

  private getDisplayedNarrative(): string {
    // Match React logic: if hasJsonLoanSummary, use JSON risk insights, otherwise use loan's aiExplanation
    const hasJsonLoanSummary = this.hasJsonLoanSummary();
    if (hasJsonLoanSummary) {
      const narrativeText = this.jsonRiskInsights()?.summary_narrative?.trim();
      if (narrativeText && narrativeText.length > 0) {
        console.log('Using narrative from test_new.json risk_insights:', narrativeText);
        return narrativeText;
      }
    }
    // Fallback to loan's aiExplanation (matching React behavior)
    const loanExplanation = this.loan?.aiExplanation?.trim();
    if (loanExplanation && loanExplanation.length > 0) {
      console.log('Using narrative from loan data:', loanExplanation);
      return loanExplanation;
    }
    console.log('No narrative available');
    return '';
  }

  private getDisplayedKeyRiskAreas(): string[] {
    // Match React logic exactly:
    // 1. If loan has keyRiskAreas, use those
    // 2. Otherwise, if hasJsonLoanSummary and JSON has key_risk_areas, use JSON
    // 3. Otherwise, return empty array
    if (this.loan?.keyRiskAreas?.length) {
      console.log('Using key risk areas from loan data:', this.loan.keyRiskAreas);
      return this.loan.keyRiskAreas;
    }
    const hasJsonLoanSummary = this.hasJsonLoanSummary();
    if (hasJsonLoanSummary) {
      const jsonRiskAreas = this.jsonRiskInsights()?.key_risk_areas;
      if (jsonRiskAreas && Array.isArray(jsonRiskAreas) && jsonRiskAreas.length > 0) {
        console.log('Using key risk areas from test_new.json risk_insights:', jsonRiskAreas);
        return jsonRiskAreas;
      }
    }
    console.log('No key risk areas available');
    return [];
  }

  getCategoryInsightObservations(category: RuleCategory): string {
    const insight = category.insight;
    if (Array.isArray(insight.factPattern.observations)) {
      return insight.factPattern.observations.join(' ');
    }
    return typeof insight.factPattern.observations === 'string' 
      ? insight.factPattern.observations 
      : '';
  }

  getCategoryLenderJustification(category: RuleCategory): string {
    const insight = category.insight;
    if (Array.isArray(insight.lenderJustification)) {
      return insight.lenderJustification.join(' ');
    }
    return typeof insight.lenderJustification === 'string' 
      ? insight.lenderJustification 
      : '';
  }

  getCategoryFinalConclusion(category: RuleCategory): string {
    const insight = category.insight;
    if (Array.isArray(insight.finalConclusion)) {
      return insight.finalConclusion.join(' ');
    }
    return typeof insight.finalConclusion === 'string' 
      ? insight.finalConclusion 
      : '';
  }

  onCommentChange(value: string) {
    if (this.activeTab() === 'income') {
      this.incomePageComment.set(value);
    } else {
      this.valuationPageComment.set(value);
    }
  }

  toggleRuleExpansion(categoryName: string, ruleName: string) {
    const current = this.expandedRules();
    const category = current[categoryName] || {};
    this.expandedRules.set({
      ...current,
      [categoryName]: {
        ...category,
        [ruleName]: !category[ruleName]
      }
    });
  }

  toggleRuleComment(categoryName: string, ruleName: string) {
    const current = this.openRuleComment();
    const category = current[categoryName] || {};
    const isOpen = category[ruleName] || false;
    
    // Initialize comment text if opening
    if (!isOpen) {
      const commentText = this.ruleCommentText();
      const categoryText = commentText[categoryName] || {};
      if (!categoryText[ruleName]) {
        const existingComment = this.getComment(categoryName, ruleName) || '';
        this.ruleCommentText.set({
          ...commentText,
          [categoryName]: {
            ...categoryText,
            [ruleName]: existingComment
          }
        });
      }
    }
    
    this.openRuleComment.set({
      ...current,
      [categoryName]: {
        ...category,
        [ruleName]: !isOpen
      }
    });
  }

  toggleSubruleComment(categoryName: string, ruleName: string, subruleName: string) {
    const current = this.openSubruleComment();
    const category = current[categoryName] || {};
    const rule = category[ruleName] || {};
    const isOpen = rule[subruleName] || false;
    
    // Initialize comment text if opening
    if (!isOpen) {
      const commentText = this.subruleCommentText();
      const categoryText = commentText[categoryName] || {};
      const ruleText = categoryText[ruleName] || {};
      if (!ruleText[subruleName]) {
        const existingComment = this.getSubruleComment(categoryName, ruleName, subruleName) || '';
        this.subruleCommentText.set({
          ...commentText,
          [categoryName]: {
            ...categoryText,
            [ruleName]: {
              ...ruleText,
              [subruleName]: existingComment
            }
          }
        });
      }
    }
    
    this.openSubruleComment.set({
      ...current,
      [categoryName]: {
        ...category,
        [ruleName]: {
          ...rule,
          [subruleName]: !isOpen
        }
      }
    });
  }

  handleSaveComment(categoryName: string, ruleName: string, comment: string) {
    const current = this.comments();
    this.comments.set({
      ...current,
      [categoryName]: {
        ...(current[categoryName] || {}),
        [ruleName]: comment
      }
    });
    this.toggleRuleComment(categoryName, ruleName);
  }

  onRuleCommentTextChange(categoryName: string, ruleName: string, value: string) {
    const current = this.ruleCommentText();
    const category = current[categoryName] || {};
    this.ruleCommentText.set({
      ...current,
      [categoryName]: {
        ...category,
        [ruleName]: value
      }
    });
  }

  onSubruleCommentTextChange(categoryName: string, ruleName: string, subruleName: string, value: string) {
    const current = this.subruleCommentText();
    const category = current[categoryName] || {};
    const rule = category[ruleName] || {};
    this.subruleCommentText.set({
      ...current,
      [categoryName]: {
        ...category,
        [ruleName]: {
          ...rule,
          [subruleName]: value
        }
      }
    });
  }

  handleSaveSubruleComment(categoryName: string, ruleName: string, subruleName: string, comment: string) {
    const current = this.subruleComments();
    this.subruleComments.set({
      ...current,
      [categoryName]: {
        ...(current[categoryName] || {}),
        [ruleName]: {
          ...((current[categoryName] && current[categoryName][ruleName]) ? current[categoryName][ruleName] : {}),
          [subruleName]: comment
        }
      }
    });
    this.toggleSubruleComment(categoryName, ruleName, subruleName);
  }

  // Helper methods to safely access nested properties without optional chaining warnings
  getExpandedRule(categoryName: string, ruleName: string): boolean {
    const category = this.expandedRules()[categoryName];
    return category ? (category[ruleName] || false) : false;
  }

  getComment(categoryName: string, ruleName: string): string | undefined {
    const category = this.comments()[categoryName];
    return category ? category[ruleName] : undefined;
  }

  getOpenRuleComment(categoryName: string, ruleName: string): boolean {
    const category = this.openRuleComment()[categoryName];
    return category ? (category[ruleName] || false) : false;
  }

  getRuleCommentText(categoryName: string, ruleName: string): string {
    const category = this.ruleCommentText()[categoryName];
    return category ? (category[ruleName] || '') : '';
  }

  getSubruleComment(categoryName: string, ruleName: string, subruleName: string): string | undefined {
    const category = this.subruleComments()[categoryName];
    if (!category) return undefined;
    const rule = category[ruleName];
    return rule ? rule[subruleName] : undefined;
  }

  getOpenSubruleComment(categoryName: string, ruleName: string, subruleName: string): boolean {
    const category = this.openSubruleComment()[categoryName];
    if (!category) return false;
    const rule = category[ruleName];
    return rule ? (rule[subruleName] || false) : false;
  }

  getSubruleCommentText(categoryName: string, ruleName: string, subruleName: string): string {
    const category = this.subruleCommentText()[categoryName];
    if (!category) return '';
    const rule = category[ruleName];
    return rule ? (rule[subruleName] || '') : '';
  }

  getTotalComments(): number {
    const ruleComments = Object.values(this.comments()).reduce(
      (acc, categoryComments) => acc + Object.values(categoryComments).filter(c => c.trim()).length,
      0
    );
    const subruleComments = Object.values(this.subruleComments()).reduce(
      (acc, categoryComments) => {
        return acc + Object.values(categoryComments).reduce(
          (ruleAcc, ruleComments) => ruleAcc + Object.values(ruleComments).filter(c => c.trim()).length,
          0
        );
      },
      0
    );
    return ruleComments + subruleComments;
  }

  savePageComment() {
    // In a real app, this would save to a database
    alert('Comments saved successfully!');
  }

  exportCommentsToCSV() {
    const rows: string[][] = [['Type', 'Category', 'Rule Name', 'Subrule Name', 'Comment', 'Timestamp']];
    const timestamp = new Date().toISOString();
    
    // Export rule comments
    Object.entries(this.comments()).forEach(([categoryName, categoryComments]) => {
      Object.entries(categoryComments).forEach(([ruleName, comment]) => {
        if (comment.trim()) {
          rows.push(['Rule', categoryName, ruleName, '', comment, timestamp]);
        }
      });
    });
    
    // Export subrule comments
    Object.entries(this.subruleComments()).forEach(([categoryName, categoryComments]) => {
      Object.entries(categoryComments).forEach(([ruleName, ruleComments]) => {
        Object.entries(ruleComments).forEach(([subruleName, comment]) => {
          if (comment.trim()) {
            rows.push(['Subrule', categoryName, ruleName, subruleName, comment, timestamp]);
          }
        });
      });
    });
    
    if (rows.length === 1) {
      alert('No comments to export');
      return;
    }
    
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `loan-comments-${this.loan?.loanNumber || 'unknown'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  navigateToRedFlagReview() {
    if (this.loanId) {
      this.router.navigate(['/loans', this.loanId, 'red-flags']);
    }
  }
}
