import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputComponent } from '../ui/input/input.component';
import { SelectComponent, SelectOption } from '../ui/select/select.component';
import { DateRangePickerComponent } from '../date-range-picker/date-range-picker.component';
import { DateRange } from '../date-range-picker/date-range-picker.component';

@Component({
  selector: 'app-risk-analysis-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent, SelectComponent, DateRangePickerComponent],
  template: `
    <div>
      <h2 class="mb-1 text-xl font-semibold text-card-foreground">
        Risk Analysis Filters
      </h2>
      <p class="mb-5 text-base text-muted-foreground">
        Filter and sort loans by various criteria
      </p>

      <div class="flex flex-col gap-4">
        <!-- Search Input -->
        <div class="relative w-full">
          <svg class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
            <app-input
              type="text"
              placeholder="Search by borrower, loan ID, or property..."
              [value]="searchQuery"
              (valueChange)="searchChange.emit($event)"
              className="h-12 pl-11 text-base"
            ></app-input>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Risk Score Filter -->
          <app-select
            [options]="riskScoreOptions"
            [value]="riskScoreFilter"
            (valueChange)="handleRiskScoreChange($event)"
            placeholder="Risk Score"
            className="h-12 w-[150px] text-base"
          ></app-select>

          <!-- TLR Status Filter -->
          <app-select
            [options]="tlrStatusOptions"
            [value]="tlrStatusFilter"
            (valueChange)="handleTlrStatusChange($event)"
            placeholder="TLR Status"
            className="h-12 w-[180px] text-base"
          ></app-select>

          <!-- Credit Delegation Type Filter -->
          <app-select
            [options]="delegationOptions"
            [value]="delegationFilter"
            (valueChange)="handleDelegationChange($event)"
            placeholder="Delegation Type"
            className="h-12 w-[180px] text-base"
          ></app-select>

          <!-- Lender Filter -->
          <app-select
            [options]="lenderOptions"
            [value]="lenderFilter"
            (valueChange)="handleLenderChange($event)"
            placeholder="All Lenders"
            className="h-12 w-[180px] text-base"
          ></app-select>

          <!-- Acquisition Date Range Filter -->
          <app-date-range-picker
            [value]="acquisitionDateRange"
            (valueChange)="handleAcquisitionDateRangeChange($event)"
            label="Acquisition Date"
          ></app-date-range-picker>

          <!-- Commitment Date Range Filter -->
          <app-date-range-picker
            [value]="commitmentDateRange"
            (valueChange)="handleCommitmentDateRangeChange($event)"
            label="Commitment Date"
          ></app-date-range-picker>

          <!-- Underwriter Filter -->
          <app-select
            [options]="underwriterOptions"
            [value]="underwriterFilter"
            (valueChange)="handleUnderwriterChange($event)"
            placeholder="Underwriter"
            className="h-12 w-[170px] text-base"
          ></app-select>

          <!-- Originator Filter -->
          <app-select
            [options]="originatorOptions"
            [value]="originatorFilter"
            (valueChange)="handleOriginatorChange($event)"
            placeholder="Originator"
            className="h-12 w-[170px] text-base"
          ></app-select>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RiskAnalysisFiltersComponent {
  @Input() searchQuery: string = '';
  @Output() searchChange = new EventEmitter<string>();
  @Input() riskScoreFilter: string = 'all';
  @Output() riskScoreChange = new EventEmitter<string>();
  @Input() tlrStatusFilter: string = 'all';
  @Output() tlrStatusChange = new EventEmitter<string>();
  @Input() delegationFilter: string = 'all';
  @Output() delegationChange = new EventEmitter<string>();
  @Input() lenderFilter: string = 'all';
  @Output() lenderChange = new EventEmitter<string>();
  @Input() acquisitionDateRange: DateRange = { startDate: 'all', endDate: '2025-03' };
  @Output() acquisitionDateRangeChange = new EventEmitter<DateRange>();
  @Input() commitmentDateRange: DateRange = { startDate: 'all', endDate: '2025-03' };
  @Output() commitmentDateRangeChange = new EventEmitter<DateRange>();
  @Input() underwriterFilter: string = 'all';
  @Output() underwriterChange = new EventEmitter<string>();
  @Input() originatorFilter: string = 'all';
  @Output() originatorChange = new EventEmitter<string>();

  riskScoreOptions: SelectOption[] = [
    { value: 'all', label: 'All Risk Scores' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
  ];

  tlrStatusOptions: SelectOption[] = [
    { value: 'all', label: 'All TLR Status' },
    { value: 'TLR Completed', label: 'TLR Completed' },
    { value: 'TLR Not Completed', label: 'TLR Not Completed' },
    { value: 'unknown', label: 'Unknown' },
  ];

  delegationOptions: SelectOption[] = [
    { value: 'all', label: 'All Delegation' },
    { value: 'Preview', label: 'Preview' },
    { value: 'PD', label: 'PD (Performance)' },
    { value: 'Standard', label: 'Standard' },
  ];

  lenderOptions: SelectOption[] = [
    { value: 'all', label: 'All Lenders' },
    { value: 'Lender A', label: 'Lender A' },
    { value: 'First National', label: 'First National' },
    { value: 'Capital Bank', label: 'Capital Bank' },
  ];

  underwriterOptions: SelectOption[] = [
    { value: 'all', label: 'All Underwriters' },
    { value: 'John Smith', label: 'John Smith' },
    { value: 'Michael Chen', label: 'Michael Chen' },
    { value: 'David Wilson', label: 'David Wilson' },
    { value: 'Emily Davis', label: 'Emily Davis' },
    { value: 'Jennifer Taylor', label: 'Jennifer Taylor' },
    { value: 'Chris Thompson', label: 'Chris Thompson' },
  ];

  originatorOptions: SelectOption[] = [
    { value: 'all', label: 'All Originators' },
    { value: 'Sarah Johnson', label: 'Sarah Johnson' },
    { value: 'Lisa Park', label: 'Lisa Park' },
    { value: 'Amanda Brown', label: 'Amanda Brown' },
    { value: 'Robert Martinez', label: 'Robert Martinez' },
    { value: 'Kevin Anderson', label: 'Kevin Anderson' },
    { value: 'Michelle Lee', label: 'Michelle Lee' },
  ];

  // Helper methods to handle value changes with proper typing
  handleRiskScoreChange(value: string) {
    this.riskScoreChange.emit(value);
  }

  handleTlrStatusChange(value: string) {
    this.tlrStatusChange.emit(value);
  }

  handleDelegationChange(value: string) {
    this.delegationChange.emit(value);
  }

  handleLenderChange(value: string) {
    this.lenderChange.emit(value);
  }

  handleUnderwriterChange(value: string) {
    this.underwriterChange.emit(value);
  }

  handleOriginatorChange(value: string) {
    this.originatorChange.emit(value);
  }

  handleAcquisitionDateRangeChange(value: DateRange) {
    this.acquisitionDateRangeChange.emit(value);
  }

  handleCommitmentDateRangeChange(value: DateRange) {
    this.commitmentDateRangeChange.emit(value);
  }

  // Expose event emitters with correct names for template binding
  get onSearchChange() { return this.searchChange; }
  get onRiskScoreChange() { return this.riskScoreChange; }
  get onTlrStatusChange() { return this.tlrStatusChange; }
  get onDelegationChange() { return this.delegationChange; }
  get onLenderChange() { return this.lenderChange; }
  get onAcquisitionDateRangeChange() { return this.acquisitionDateRangeChange; }
  get onCommitmentDateRangeChange() { return this.commitmentDateRangeChange; }
  get onUnderwriterChange() { return this.underwriterChange; }
  get onOriginatorChange() { return this.originatorChange; }
}
