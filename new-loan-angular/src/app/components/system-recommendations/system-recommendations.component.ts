import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { loansData } from '../../../lib/loan-data';
import { cn } from '../../../lib/utils';

const severityStyles = {
  Critical: "bg-critical/10 text-critical border-critical/20",
  High: "bg-high/10 text-high border-high/20",
  Medium: "bg-medium/10 text-medium border-medium/20",
  Low: "bg-low/10 text-low border-low/20",
};

@Component({
  selector: 'app-risk-score-pie-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-4">
      <svg [attr.width]="size" [attr.height]="size" class="-rotate-90">
        @for (segment of segments; track segment.label) {
          <circle
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
            [attr.r]="radius"
            fill="none"
            [attr.stroke]="segment.color"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="getDashArray(segment)"
            [attr.stroke-dashoffset]="getDashOffset(segment)"
          />
        }
      </svg>
      <div class="flex flex-col gap-1">
        @for (segment of segments; track segment.label) {
          <div class="flex items-center gap-1.5">
            <div class="h-2.5 w-2.5 rounded-full" [style.backgroundColor]="segment.color"></div>
            <span class="text-xs text-muted-foreground">
              {{ segment.label }}: {{ segment.value }} {{ segment.value === 1 ? 'loan' : 'loans' }}
            </span>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class RiskScorePieChartComponent {
  @Input() distribution!: { score1: number; score2: number; score3: number; score4: number };
  
  size = 80;
  strokeWidth = 16;
  radius = (80 - 16) / 2;
  circumference = 2 * Math.PI * ((80 - 16) / 2);

  get total(): number {
    return this.distribution.score1 + this.distribution.score2 + this.distribution.score3 + this.distribution.score4;
  }

  get segments(): Array<{ value: number; color: string; label: string }> {
    return [
      { value: this.distribution.score1, color: "#22c55e", label: "1 - Meets/Exceeds Expectation" },
      { value: this.distribution.score2, color: "#eab308", label: "2 - Meets Expectation" },
      { value: this.distribution.score3, color: "#f97316", label: "3 - Below Expectation" },
      { value: this.distribution.score4, color: "#ef4444", label: "4 - Significantly Below Expectation" },
    ];
  }

  getDashArray(segment: { value: number; color: string; label: string }): string {
    const percentage = this.total > 0 ? (segment.value / this.total) * 100 : 0;
    const dashLength = (percentage / 100) * this.circumference;
    return `${dashLength} ${this.circumference - dashLength}`;
  }

  getDashOffset(segment: { value: number; color: string; label: string }): number {
    const segments = this.segments;
    const index = segments.indexOf(segment);
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const percentage = this.total > 0 ? (segments[i].value / this.total) * 100 : 0;
      offset += (percentage / 100) * this.circumference;
    }
    return -offset;
  }
}

@Component({
  selector: 'app-system-recommendations',
  standalone: true,
  imports: [CommonModule, RiskScorePieChartComponent],
  template: `
    <div class="rounded-xl border border-border bg-card p-6">
      <h2 class="mb-1 text-xl font-semibold text-card-foreground">
        Results by Risk Category
      </h2>
      <p class="mb-5 text-base text-muted-foreground">
        Number of loans by risk score
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <div
          class="relative overflow-hidden rounded-lg border p-5 transition-all hover:shadow-md bg-purple-50/50 border-purple-100"
        >
          <div class="mb-3">
            <div class="rounded-lg bg-purple-600 p-2 w-fit">
              <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <line x1="12" x2="12" y1="2" y2="22"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </div>
          <h3 class="mb-1.5 text-lg font-semibold text-foreground">{{ item.title }}</h3>

          <!-- Risk Score Distribution Pie Chart -->
          <div class="mb-3">
            <p class="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Risk Score Distribution</p>
            <app-risk-score-pie-chart [distribution]="item.riskScoreDistribution"></app-risk-score-pie-chart>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-bold text-foreground">
              {{ item.count }}
            </span>
            <span class="text-sm text-muted-foreground">
              loans ({{ item.portfolioPercentage }}% of portfolio)
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemRecommendationsComponent {
  loans = loansData;
  cn = cn;
  severityStyles = severityStyles;

  get totalLoans(): number {
    return this.loans.length;
  }

  get failedIncomeExpenseLoans(): number {
    return this.loans.filter(
      (loan) => loan.rulesOutcome.incomeExpense.passed < loan.rulesOutcome.incomeExpense.total
    ).length;
  }

  get riskScoreDistribution(): { score1: number; score2: number; score3: number; score4: number } {
    return this.loans.reduce(
      (acc, loan) => {
        if (loan.riskScore === 1) acc.score1 += 1;
        else if (loan.riskScore === 2) acc.score2 += 1;
        else if (loan.riskScore === 3) acc.score3 += 1;
        else acc.score4 += 1;
        return acc;
      },
      { score1: 0, score2: 0, score3: 0, score4: 0 }
    );
  }

  get item() {
    return {
      key: "incomeExpenseAnalysis",
      title: "Income & Expense",
      icon: null,
      severity: "Critical" as const,
      description: "Loans with failed Income & Expense rules",
      count: this.failedIncomeExpenseLoans,
      portfolioPercentage: this.totalLoans > 0 ? Math.round((this.failedIncomeExpenseLoans / this.totalLoans) * 100) : 0,
      riskScoreDistribution: this.riskScoreDistribution,
    };
  }
}
