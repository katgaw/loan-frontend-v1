import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../ui/button/button.component';
import { cn } from '../../../lib/utils';

export interface DateRange {
  startDate: string;
  endDate: string;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const fullMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function formatMonthYear(dateStr: string): string {
  if (dateStr === 'all') return 'All Dates';
  const [year, month] = dateStr.split('-');
  return `${fullMonthNames[parseInt(month) - 1]} ${year}`;
}

function formatShortMonthYear(dateStr: string): string {
  if (dateStr === 'all') return 'All';
  const [year, month] = dateStr.split('-');
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="relative">
      <app-button
        variant="outline"
        [class]="cn('h-12 min-w-[200px] justify-start gap-2 text-base font-normal bg-transparent', !hasSelection && 'text-muted-foreground')"
        (click)="open.set(!open())"
      >
        <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span class="flex-1 text-left">{{ displayText() }}</span>
        @if (hasSelection) {
          <svg 
            class="h-4 w-4 text-muted-foreground hover:text-foreground" 
            (click)="$event.stopPropagation(); handleClear()"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        }
      </app-button>

      @if (open()) {
        <div class="absolute z-50 mt-2 w-auto rounded-md border bg-popover p-4 shadow-md">
          <!-- Header -->
          <div class="mb-3 text-center">
            <p class="text-sm text-muted-foreground">
              {{ selectionState() === 'start' ? 'Select start month' : 'Select end month' }}
            </p>
            @if (tempStart()) {
              <p class="text-xs text-primary mt-1">
                Start: {{ formatMonthYear(tempStart()!) }}
              </p>
            }
          </div>

          <!-- Year navigation -->
          <div class="flex items-center justify-between mb-4">
            <app-button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              (click)="decrementYear()"
              [disabled]="viewYear() <= 2020"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </app-button>
            <span class="text-base font-semibold">{{ viewYear() }}</span>
            <app-button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              (click)="incrementYear()"
              [disabled]="viewYear() >= 2025"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </app-button>
          </div>

          <!-- Month grid -->
          <div class="grid grid-cols-4 gap-2">
            @for (month of monthNames; track month; let i = $index) {
              <button
                type="button"
                [disabled]="!isValidMonth(viewYear(), i + 1)"
                (click)="handleMonthClick(viewYear(), i + 1)"
                [class]="getMonthButtonClass(viewYear(), i + 1)"
              >
                {{ month }}
              </button>
            }
          </div>

          <!-- Quick actions -->
          <div class="mt-4 flex gap-2 border-t pt-4">
            <app-button
              variant="ghost"
              size="sm"
              class="flex-1 text-xs"
              (click)="handleQuickAction('all')"
            >
              All Dates
            </app-button>
            <app-button
              variant="ghost"
              size="sm"
              class="flex-1 text-xs"
              (click)="handleQuickAction('2024')"
            >
              2024
            </app-button>
            <app-button
              variant="ghost"
              size="sm"
              class="flex-1 text-xs"
              (click)="handleQuickAction('2023')"
            >
              2023
            </app-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class DateRangePickerComponent {
  @Input() value: DateRange = { startDate: 'all', endDate: '2025-03' };
  @Input() label: string = 'Date Range';
  @Output() valueChange = new EventEmitter<DateRange>();

  open = signal(false);
  viewYear = signal(2024);
  selectionState = signal<'start' | 'end'>('start');
  tempStart = signal<string | null>(null);
  monthNames = monthNames;
  cn = cn;
  formatMonthYear = formatMonthYear;

  validMonths: string[] = [];
  
  constructor() {
    for (let year = 2020; year <= 2025; year++) {
      const maxMonth = year === 2025 ? 3 : 12;
      for (let month = 1; month <= maxMonth; month++) {
        this.validMonths.push(`${year}-${month.toString().padStart(2, '0')}`);
      }
    }
  }

  isValidMonth(year: number, month: number): boolean {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}`;
    return this.validMonths.includes(dateStr);
  }

  handleMonthClick(year: number, month: number) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}`;
    
    if (this.selectionState() === 'start') {
      this.tempStart.set(dateStr);
      this.selectionState.set('end');
    } else {
      const start = this.tempStart() || this.value.startDate;
      if (start === 'all' || dateStr >= start) {
        this.valueChange.emit({ startDate: start === 'all' ? dateStr : start, endDate: dateStr });
      } else {
        this.valueChange.emit({ startDate: dateStr, endDate: start });
      }
      this.tempStart.set(null);
      this.selectionState.set('start');
      this.open.set(false);
    }
  }

  getMonthButtonClass(year: number, month: number): string {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}`;
    const start = this.tempStart() || (this.value.startDate !== 'all' ? this.value.startDate : null);
    const end = this.value.endDate !== 'all' ? this.value.endDate : null;
    const inRange = start && end && dateStr >= start && dateStr <= end;
    const isStart = dateStr === start;
    const isEnd = dateStr === end;
    const isValid = this.isValidMonth(year, month);

    return this.cn(
      'h-10 rounded-md text-sm font-medium transition-colors',
      'hover:bg-accent hover:text-accent-foreground',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      !isValid && 'opacity-30 cursor-not-allowed hover:bg-transparent',
      inRange && !isStart && !isEnd && 'bg-primary/10 text-primary',
      (isStart || isEnd) && 'bg-primary text-primary-foreground hover:bg-primary/90'
    );
  }

  handleClear() {
    this.valueChange.emit({ startDate: 'all', endDate: 'all' });
    this.tempStart.set(null);
    this.selectionState.set('start');
  }

  handleQuickAction(action: string) {
    if (action === 'all') {
      this.valueChange.emit({ startDate: 'all', endDate: 'all' });
    } else if (action === '2024') {
      this.valueChange.emit({ startDate: '2024-01', endDate: '2024-12' });
    } else if (action === '2023') {
      this.valueChange.emit({ startDate: '2023-01', endDate: '2023-12' });
    }
    this.tempStart.set(null);
    this.selectionState.set('start');
    this.open.set(false);
  }

  displayText(): string {
    const { startDate, endDate } = this.value;
    if (startDate === 'all' && endDate === 'all') {
      return `${this.label}: All`;
    }
    if (startDate === 'all') {
      return `${this.label}: Up to ${formatShortMonthYear(endDate)}`;
    }
    if (endDate === 'all') {
      return `${this.label}: From ${formatShortMonthYear(startDate)}`;
    }
    if (startDate === endDate) {
      return `${this.label}: ${formatShortMonthYear(startDate)}`;
    }
    return `${this.label}: ${formatShortMonthYear(startDate)} - ${formatShortMonthYear(endDate)}`;
  }

  get hasSelection(): boolean {
    return this.value.startDate !== 'all' || this.value.endDate !== 'all';
  }

  decrementYear() {
    this.viewYear.set(Math.max(2020, this.viewYear() - 1));
  }

  incrementYear() {
    this.viewYear.set(Math.min(2025, this.viewYear() + 1));
  }
}
