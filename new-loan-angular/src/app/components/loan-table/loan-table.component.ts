import { Component, Input, Output, EventEmitter, signal, computed, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loan, keyRiskAreaTitle } from '../../../lib/loan-data';
import { cn } from '../../../lib/utils';
import { ButtonComponent } from '../ui/button/button.component';

type SortField = 'loanNumber' | 'acquisitionDate' | 'lenderName' | 'propertyType' | 'financing' | 'riskScore' | 'flagPercentage' | 'status' | 'severity';
type SortDirection = 'asc' | 'desc';

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  const ms = Date.parse(dateString);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const statusStyles = {
  PASS: 'bg-pass/10 text-pass border border-pass/30',
  FAIL: 'bg-fail/10 text-fail border border-fail/30',
  WAIVER: 'bg-waiver/10 text-waiver border border-waiver/30',
};

const severityStyles = {
  Critical: 'bg-critical/10 text-critical border border-critical/30',
  High: 'bg-high/10 text-high border border-high/30',
  Medium: 'bg-medium/10 text-medium border border-medium/30',
  Low: 'bg-low/10 text-low border border-low/30',
};

@Component({
  selector: 'app-loan-table',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="rounded-xl border border-border bg-card">
      <div class="border-b border-border p-6">
        <ng-content></ng-content>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full table-fixed">
          <colgroup>
            <col class="w-[170px]" />
            <col class="w-[180px]" />
            <col class="w-[120px]" />
            <col class="w-[180px]" />
            <col class="w-[130px]" />
            <col class="w-[160px]" />
          </colgroup>
          <thead>
            <tr class="border-b border-border bg-muted/30">
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Loan Info
                </span>
              </th>
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Property Details
                </span>
              </th>
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Financial
                </span>
              </th>
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Metrics
                </span>
              </th>
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Rules Compliance
                </span>
              </th>
              <th class="px-4 py-4 text-left align-top">
                <span class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Risk Summary
                </span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (loan of sortedLoans(); track loan.id) {
              <tr
                (click)="onLoanClick(loan.id)"
                class="cursor-pointer transition-colors hover:bg-accent/5"
              >
                <!-- Loan Info -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-1.5">
                    <button
                      (click)="$event.stopPropagation(); onLoanClick(loan.id)"
                      class="text-left font-mono text-sm font-semibold text-accent hover:underline"
                    >
                      {{ loan.loanNumber }}
                    </button>
                    <div class="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                      <span class="font-medium text-foreground">Acq:</span>
                      <span class="text-muted-foreground">{{ formatDate(loan.acquisitionDate ?? '') }}</span>
                      <span class="font-medium text-foreground">Commit:</span>
                      <span class="text-muted-foreground">{{ formatDate(loan.commitmentDate ?? '') }}</span>
                      <span class="font-medium text-foreground">Lender:</span>
                      <span class="text-muted-foreground">{{ loan.lenderName?.trim() ? loan.lenderName : '—' }}</span>
                      <span class="font-medium text-foreground">UW:</span>
                      <span class="text-muted-foreground">{{ loan.underwriterName?.trim() ? loan.underwriterName : '—' }}</span>
                      <span class="font-medium text-foreground">Orig:</span>
                      <span class="text-muted-foreground">{{ loan.originatorName?.trim() ? loan.originatorName : '—' }}</span>
                      <span class="font-medium text-foreground">Deleg:</span>
                      <span class="text-muted-foreground">{{ loan.delegationType ?? '—' }}</span>
                    </div>
                  </div>
                </td>

                <!-- Property Details -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-start gap-2">
                      <svg class="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <div>
                        <p class="text-sm font-medium text-foreground leading-tight">
                          {{ loan.address }}
                        </p>
                        <p class="text-xs text-muted-foreground">
                          {{ loan.city }}, {{ loan.state }}
                        </p>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-1.5">
                      <span class="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {{ loan.propertyType }}
                      </span>
                      <span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {{ loan.units > 1 ? loan.units + ' Units' : 'Single Asset' }}
                      </span>
                      <span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {{ loan.loanType }}
                      </span>
                    </div>
                  </div>
                </td>

                <!-- Financial -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-2">
                    <div>
                      <p class="text-xs text-muted-foreground">Loan Amt</p>
                      <p class="text-sm font-semibold text-foreground">
                        {{ formatCurrency(loan.loanAmount) }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">UPB</p>
                      <p class="text-sm font-medium text-foreground">
                        {{ formatCurrency(loan.upb) }}
                      </p>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <p class="text-xs text-muted-foreground">DSCR</p>
                        <p class="text-sm font-medium text-muted-foreground">
                          {{ loan.dscr !== undefined && loan.dscr > 0 ? loan.dscr.toFixed(2) : '—' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-xs text-muted-foreground">LTV</p>
                        <p class="text-sm font-medium text-foreground">
                          {{ loan.ltv !== undefined ? loan.ltv.toFixed(1) + '%' : '—' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Risk Metrics -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-2.5">
                    <div>
                      <p class="text-xs text-muted-foreground">Risk Score</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span [class]="getRiskScoreColorClass(loan.riskScore)" class="text-base font-bold">
                          {{ loan.riskScore }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">Compliance Score</p>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span [class]="getComplianceColorClass(loan.complianceScoreData)">
                          {{ loan.complianceScoreData.passed }}/{{ loan.complianceScoreData.total }}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p class="text-xs text-muted-foreground">TLR Status</p>
                      <div class="flex items-center gap-1 mt-0.5">
                        @if (loan.tlrStatus === 'TLR Completed') {
                          <svg class="h-3.5 w-3.5 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="text-xs font-medium text-pass">Completed</span>
                        } @else if (loan.tlrStatus === 'unknown' || loan.tlrStatus === undefined) {
                          <svg class="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="text-xs font-medium text-muted-foreground">Unknown</span>
                        } @else {
                          <svg class="h-3.5 w-3.5 text-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          <span class="text-xs font-medium text-medium">Not Completed</span>
                        }
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Rules Compliance -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-1.5">
                    <span [class]="getRuleOutcomeClass(loan.rulesOutcome.incomeExpense)" class="inline-block rounded px-2 py-0.5 text-xs font-medium">
                      I&E: {{ loan.rulesOutcome.incomeExpense.passed }}/{{ loan.rulesOutcome.incomeExpense.total }}
                    </span>
                    <span [class]="getRuleOutcomeClass(loan.rulesOutcome.valuation)" class="inline-block rounded px-2 py-0.5 text-xs font-medium">
                      Valuation: {{ loan.rulesOutcome.valuation.passed }}/{{ loan.rulesOutcome.valuation.total }}
                    </span>
                  </div>
                </td>

                <!-- Risk Summary -->
                <td class="px-4 py-4 align-top">
                  <div class="flex flex-col gap-2">
                    <span [class]="cn('w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold', severityStyles[loan.severity])">
                      {{ loan.severity }}
                    </span>
                    <div class="flex flex-col gap-1">
                      @for (riskArea of loan.keyRiskAreas.slice(0, 2); track riskArea) {
                        <span class="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                          </svg>
                          <span class="truncate">{{ keyRiskAreaTitle(riskArea) }}</span>
                        </span>
                      }
                      @if (loan.keyRiskAreas.length > 2) {
                        <span class="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          +{{ loan.keyRiskAreas.length - 2 }} more
                        </span>
                      }
                    </div>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: []
})
export class LoanTableComponent {
  @Input() loans: Loan[] = [];
  @Output() loanClick = new EventEmitter<string>();

  sortField = signal<SortField>('riskScore');
  sortDirection = signal<SortDirection>('desc');
  formatCurrency = formatCurrency;
  formatDate = formatDate;
  keyRiskAreaTitle = keyRiskAreaTitle;
  cn = cn;
  severityStyles = severityStyles;

  sortedLoans = computed(() => {
    const loans = [...this.loans];
    const field = this.sortField();
    const direction = this.sortDirection();

    loans.sort((a, b) => {
      let comparison = 0;

      switch (field) {
        case 'loanNumber':
          comparison = a.loanNumber.localeCompare(b.loanNumber);
          break;
        case 'acquisitionDate':
          const aTime = a.acquisitionDate ? Date.parse(a.acquisitionDate) : Number.NaN;
          const bTime = b.acquisitionDate ? Date.parse(b.acquisitionDate) : Number.NaN;
          comparison = (Number.isFinite(aTime) ? aTime : -Infinity) - (Number.isFinite(bTime) ? bTime : -Infinity);
          break;
        case 'lenderName':
          comparison = (a.lenderName ?? '').localeCompare(b.lenderName ?? '');
          break;
        case 'propertyType':
          comparison = a.propertyType.localeCompare(b.propertyType);
          break;
        case 'financing':
          comparison = a.financing.localeCompare(b.financing);
          break;
        case 'riskScore':
          comparison = a.riskScore - b.riskScore;
          break;
        case 'flagPercentage':
          comparison = a.flagPercentage - b.flagPercentage;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'severity':
          const severityOrder: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return loans;
  });

  onLoanClick(loanId: string) {
    this.loanClick.emit(loanId);
  }

  getRiskScoreColorClass(score: number): string {
    if (score <= 2) return 'text-pass';
    if (score === 3) return 'text-medium';
    return 'text-fail';
  }

  getComplianceColorClass(data: { passed: number; total: number }): string {
    const percentage = data.total > 0 ? (data.passed / data.total) * 100 : 0;
    if (percentage >= 70) return 'text-sm font-bold text-pass';
    if (percentage >= 50) return 'text-sm font-bold text-medium';
    return 'text-sm font-bold text-fail';
  }

  getRuleOutcomeClass(data: { passed: number; total: number }): string {
    if (data.passed === data.total) return 'bg-pass/10 text-pass';
    if (data.passed >= data.total * 0.7) return 'bg-medium/10 text-medium';
    return 'bg-fail/10 text-fail';
  }
}
