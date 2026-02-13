import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loansData, Loan } from '../../../lib/loan-data';

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
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
            <svg class="h-7 w-7 text-fail" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="2" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
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
            <svg class="h-7 w-7 text-pass" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M3 3v18h18"></path>
              <path d="M18 7v10"></path>
              <path d="M13 7v15"></path>
              <path d="M8 7v11"></path>
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
            <svg class="h-7 w-7 text-critical" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
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
  @Input() loans: Loan[] = loansData;
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
    // Percentage failed is simply the complement of percentage compliant
    return 100 - this.percentageCompliant;
  }

  get criticalLoans(): number {
    return this.loans.filter((loan) => loan.riskScore !== null && loan.riskScore >= 3).length;
  }
}
