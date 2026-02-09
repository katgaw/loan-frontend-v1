import { Component, OnInit, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioSummaryComponent } from '../portfolio-summary/portfolio-summary.component';
import { SystemRecommendationsComponent } from '../system-recommendations/system-recommendations.component';
import { LoanTableComponent } from '../loan-table/loan-table.component';
import { RiskAnalysisFiltersComponent } from '../risk-analysis-filters/risk-analysis-filters.component';
import { loansData, Loan } from '../../../lib/loan-data';
import { ApiService } from '../../services/api.service';
import { DateRange } from '../date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-loan-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PortfolioSummaryComponent,
    SystemRecommendationsComponent,
    LoanTableComponent,
    RiskAnalysisFiltersComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          Multifamily Loan Surveillance
        </h1>
        <p class="mt-1 text-lg text-muted-foreground">
          Comprehensive risk assessment with detailed loan metrics
        </p>
      </div>

      <!-- Portfolio Summary -->
      <app-portfolio-summary></app-portfolio-summary>

      <!-- Results by Risk Category -->
      <app-system-recommendations></app-system-recommendations>

      <!-- Loan Table with Filters -->
      <app-loan-table 
        [loans]="filteredLoans()" 
        (loanClick)="onLoanClick($event)"
      >
        <div class="text-left">
          <h2 class="text-xl font-semibold text-card-foreground">
            Loan Risk Analysis
          </h2>
          <p class="text-base text-muted-foreground">
            {{ filteredLoans().length }} loans requiring attention - Click on a row to view details
          </p>
          <div class="my-6 border-t border-border"></div>
          <app-risk-analysis-filters
            [searchQuery]="searchQuery()"
            (searchChange)="handleSearchChange($event)"
            [riskScoreFilter]="riskScoreFilter()"
            (riskScoreChange)="handleRiskScoreChange($event)"
            [tlrStatusFilter]="tlrStatusFilter()"
            (tlrStatusChange)="handleTlrStatusChange($event)"
            [delegationFilter]="delegationFilter()"
            (delegationChange)="handleDelegationChange($event)"
            [lenderFilter]="lenderFilter()"
            (lenderChange)="handleLenderChange($event)"
            [acquisitionDateRange]="acquisitionDateRange()"
            (acquisitionDateRangeChange)="handleAcquisitionDateRangeChange($event)"
            [commitmentDateRange]="commitmentDateRange()"
            (commitmentDateRangeChange)="handleCommitmentDateRangeChange($event)"
            [underwriterFilter]="underwriterFilter()"
            (underwriterChange)="handleUnderwriterChange($event)"
            [originatorFilter]="originatorFilter()"
            (originatorChange)="handleOriginatorChange($event)"
          ></app-risk-analysis-filters>
        </div>
      </app-loan-table>
    </div>
  `,
  styles: []
})
export class LoanListPageComponent implements OnInit {
  @Output() navigateToDetail = new EventEmitter<string>();

  // Signals for reactive state
  loansWithLTV = signal<Loan[]>(loansData);
  searchQuery = signal<string>('');
  riskScoreFilter = signal<string>('all');
  tlrStatusFilter = signal<string>('all');
  delegationFilter = signal<string>('all');
  lenderFilter = signal<string>('all');
  acquisitionDateRange = signal<DateRange>({ startDate: 'all', endDate: '2025-03' });
  commitmentDateRange = signal<DateRange>({ startDate: 'all', endDate: '2025-03' });
  underwriterFilter = signal<string>('all');
  originatorFilter = signal<string>('all');

  filteredLoans = computed(() => {
    let filtered = [...this.loansWithLTV()];

    const includesQuery = (value: string | undefined, query: string) =>
      (value ?? '').toLowerCase().includes(query);

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (loan) =>
          includesQuery(loan.loanNumber, query) ||
          includesQuery(loan.address, query) ||
          includesQuery(loan.city, query) ||
          includesQuery(loan.lenderName, query)
      );
    }

    // Risk Score filter
    if (this.riskScoreFilter() !== 'all') {
      filtered = filtered.filter((loan) => loan.riskScore === parseInt(this.riskScoreFilter()));
    }

    // TLR Status filter
    if (this.tlrStatusFilter() !== 'all') {
      filtered = filtered.filter((loan) => {
        if (this.tlrStatusFilter() === 'unknown') {
          return loan.tlrStatus === 'unknown' || loan.tlrStatus === undefined;
        }
        return loan.tlrStatus === this.tlrStatusFilter();
      });
    }

    // Delegation Type filter
    if (this.delegationFilter() !== 'all') {
      filtered = filtered.filter((loan) => loan.delegationType === this.delegationFilter());
    }

    // Lender filter
    if (this.lenderFilter() !== 'all') {
      filtered = filtered.filter((loan) => loan.lenderName === this.lenderFilter());
    }

    // Acquisition date range filter
    const acqRange = this.acquisitionDateRange();
    if (acqRange.startDate !== 'all') {
      filtered = filtered.filter((loan) => {
        const loanDate = loan.acquisitionDate?.substring(0, 7);
        if (!loanDate) return false;
        return loanDate >= acqRange.startDate && loanDate <= acqRange.endDate;
      });
    }

    // Commitment date range filter
    const commitRange = this.commitmentDateRange();
    if (commitRange.startDate !== 'all') {
      filtered = filtered.filter((loan) => {
        const loanDate = loan.commitmentDate?.substring(0, 7);
        if (!loanDate) return false;
        return loanDate >= commitRange.startDate && loanDate <= commitRange.endDate;
      });
    }

    // Underwriter filter
    if (this.underwriterFilter() !== 'all') {
      filtered = filtered.filter((loan) => loan.underwriterName === this.underwriterFilter());
    }

    // Originator filter
    if (this.originatorFilter() !== 'all') {
      filtered = filtered.filter((loan) => loan.originatorName === this.originatorFilter());
    }

    // Default sort by risk score (highest first)
    filtered.sort((a, b) => b.riskScore - a.riskScore);

    return filtered;
  });

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTestJson();
  }

  private loadTestJson() {
    this.apiService.getTestJson().subscribe({
      next: (data) => {
        const ltv = this.extractLTVFromFacts(data);
        const { tlrStatus, dscr } = this.extractFromLoanSummary(data);
        
        this.loansWithLTV.set(
          this.loansWithLTV().map((loan) => ({
            ...loan,
            ...(ltv !== undefined && { ltv }),
            ...(tlrStatus !== undefined && { tlrStatus }),
            ...(dscr !== undefined ? { dscr } : { dscr: undefined }),
          }))
        );
      },
      error: () => {
        // If fetch fails, keep using loansData as-is
      }
    });
  }

  private extractLTVFromFacts(data: unknown): number | undefined {
    if (!data || typeof data !== 'object') return undefined;
    const factsLookup = (data as Record<string, unknown>)['facts_lookup'];
    if (!factsLookup || typeof factsLookup !== 'object') return undefined;
    const factLoanSummary017 = (factsLookup as Record<string, unknown>)['fact_loan_summary_017'];
    if (!factLoanSummary017 || typeof factLoanSummary017 !== 'object') return undefined;
    const statement = (factLoanSummary017 as Record<string, unknown>)['statement'];
    if (typeof statement !== 'string') return undefined;
    
    const match = statement.match(/LTV\s+is\s+(\d+(?:\.\d+)?)%/i);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!Number.isNaN(value) && Number.isFinite(value)) {
        return value;
      }
    }
    return undefined;
  }

  private extractFromLoanSummary(data: unknown): {
    tlrStatus?: 'TLR Completed' | 'TLR Not Completed' | 'unknown';
    dscr?: number;
  } {
    if (!data || typeof data !== 'object') return {};
    const loanSummary = (data as Record<string, unknown>)['loan_summary'];
    if (!loanSummary || typeof loanSummary !== 'object') return {};
    
    const summary = loanSummary as Record<string, unknown>;
    const result: {
      tlrStatus?: 'TLR Completed' | 'TLR Not Completed' | 'unknown';
      dscr?: number;
    } = {};
    
    const tlrStatusValue = summary['TLR_status'];
    if (typeof tlrStatusValue === 'string') {
      if (tlrStatusValue === 'unknown' || tlrStatusValue === 'TLR Completed' || tlrStatusValue === 'TLR Not Completed') {
        result.tlrStatus = tlrStatusValue as 'TLR Completed' | 'TLR Not Completed' | 'unknown';
      }
    }
    
    const dscrValue = summary['DSCR'];
    if (typeof dscrValue === 'string' && dscrValue.trim() !== '') {
      const parsed = parseFloat(dscrValue);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        result.dscr = parsed;
      }
    }
    
    return result;
  }

  onLoanClick(loanId: string) {
    this.navigateToDetail.emit(loanId);
  }

  // Wrapper methods to handle filter changes with proper typing
  handleSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  handleRiskScoreChange(value: string) {
    this.riskScoreFilter.set(value);
  }

  handleTlrStatusChange(value: string) {
    this.tlrStatusFilter.set(value);
  }

  handleDelegationChange(value: string) {
    this.delegationFilter.set(value);
  }

  handleLenderChange(value: string) {
    this.lenderFilter.set(value);
  }

  handleUnderwriterChange(value: string) {
    this.underwriterFilter.set(value);
  }

  handleOriginatorChange(value: string) {
    this.originatorFilter.set(value);
  }

  handleAcquisitionDateRangeChange(value: DateRange) {
    this.acquisitionDateRange.set(value);
  }

  handleCommitmentDateRangeChange(value: DateRange) {
    this.commitmentDateRange.set(value);
  }
}
