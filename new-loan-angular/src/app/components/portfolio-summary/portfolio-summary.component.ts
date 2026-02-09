import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loansData } from '../../../lib/loan-data';

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

@Component({
  selector: 'app-portfolio-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-xl border border-border bg-card p-6">
      <h2 class="mb-4 text-xl font-semibold text-card-foreground">
        Portfolio Risk Summary
      </h2>

      <div class="grid gap-6 sm:grid-cols-3">
        <!-- Total UPB -->
        <div class="flex items-start gap-4">
          <div class="rounded-lg bg-fail/10 p-3.5">
            <svg class="h-7 w-7 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p class="text-base text-muted-foreground">Total UPB</p>
            <p class="text-3xl font-bold text-foreground">
              {{ formatCurrency(totalUpb) }}
            </p>
          </div>
        </div>

        <!-- Percentage Rules Compliant -->
        <div class="flex items-start gap-4">
          <div class="rounded-lg bg-pass/10 p-3.5">
            <svg class="h-7 w-7 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-base text-muted-foreground">Percentage of Rules Compliant</p>
            <p class="text-3xl font-bold text-foreground">
              {{ percentageCompliant }}%
            </p>
            <p class="text-sm text-muted-foreground">
              {{ percentageFailed }}% failed
            </p>
          </div>
        </div>

        <!-- Critical Loans -->
        <div class="flex items-start gap-4">
          <div class="rounded-lg bg-critical/10 p-3.5">
            <svg class="h-7 w-7 text-critical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <p class="text-base text-muted-foreground">Critical Loans</p>
            <p class="text-3xl font-bold text-foreground">
              {{ criticalLoans }}
            </p>
            <p class="text-sm text-muted-foreground">
              Loans requiring immediate action
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PortfolioSummaryComponent {
  loans = loansData;
  formatCurrency = formatCurrency;

  get totalUpb(): number {
    return this.loans.reduce((acc, loan) => acc + loan.upb, 0);
  }

  get percentageCompliant(): number {
    const totalPassed = this.loans.reduce((acc, loan) => acc + loan.complianceScoreData.passed, 0);
    const totalRules = this.loans.reduce((acc, loan) => acc + loan.complianceScoreData.total, 0);
    return totalRules > 0 ? Math.round((totalPassed / totalRules) * 100) : 0;
  }

  get percentageFailed(): number {
    const totalPassed = this.loans.reduce((acc, loan) => acc + loan.complianceScoreData.passed, 0);
    const totalRules = this.loans.reduce((acc, loan) => acc + loan.complianceScoreData.total, 0);
    const totalFailed = this.loans.reduce(
      (acc, loan) => acc + Math.max(0, loan.complianceScoreData.total - loan.complianceScoreData.passed),
      0
    );
    return totalRules > 0 ? Math.round((totalFailed / totalRules) * 100) : 0;
  }

  get criticalLoans(): number {
    return this.loans.filter((loan) => loan.riskScore >= 3).length;
  }
}
