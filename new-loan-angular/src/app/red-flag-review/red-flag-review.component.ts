import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button.component';
import { QuestionCardComponent, RedFlagQuestion } from '../components/question-card/question-card.component';
import { ApiService } from '../services/api.service';
import { cn } from '../../lib/utils';

type ResponseType = "Yes" | "No" | "N/A";

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s_]/g, "");
}

function extractQuestionAnswerPairs(
  data: unknown,
  desiredKey: string
): Array<{ question: string; answer?: string }> | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const foundKey = Object.keys(record).find((k) => normalizeKey(k) === normalizeKey(desiredKey));
  if (!foundKey) return null;

  const section = record[foundKey];
  if (!section || typeof section !== "object") return null;

  const sectionRec = section as Record<string, unknown>;
  const q = sectionRec['question'];
  const a = sectionRec['answer'];
  if (!Array.isArray(q)) return null;

  const questions = q
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);

  const answers = Array.isArray(a)
    ? a
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .map((s) => s || undefined) // Convert empty strings to undefined
    : [];

  if (questions.length === 0) return null;
  return questions.map((question, idx) => ({
    question,
    answer: answers[idx], // Will be undefined if not present or empty
  }));
}

function makeQuestions(
  prefix: "L" | "FM",
  items: Array<{ question: string; answer?: string }>
): RedFlagQuestion[] {
  return items.map(({ question, answer }, idx) => ({
    id: `${prefix}${idx + 1}`,
    question,
    response: "N/A",
    rationale: "",
    answer,
    aiInsight: "",
  }));
}

// Lender Red Flags Review Questions (fallback)
const lenderRedFlagsQuestions: RedFlagQuestion[] = [
  {
    id: "L1",
    question: "Does the lender's underwriting narrative adequately explain the property's income and expense assumptions?",
    response: "Yes",
    rationale: "The lender provided detailed explanations for all income assumptions including rental rates, vacancy factors, and other income sources. Expense ratios were benchmarked against comparable properties.",
    aiInsight: "Documentation appears comprehensive. Rental rate assumptions align with market data within 3% variance. Vacancy factor of 5% is conservative for this submarket.",
  },
  {
    id: "L2",
    question: "Are there any unexplained variances between the appraisal NOI and the lender's underwritten NOI?",
    response: "Yes",
    rationale: "All variances between appraisal and lender NOI have been documented and explained in the underwriting narrative with supporting market data.",
    aiInsight: "NOI variance of 4.2% is within acceptable range. Key drivers identified: management fee adjustment and insurance cost normalization.",
  },
];

// Fannie Mae Red Flags Review Questions (fallback)
const fannieMaeRedFlagsQuestions: RedFlagQuestion[] = [
  {
    id: "FM1",
    question: "Does the property meet Fannie Mae's eligibility requirements for multifamily housing?",
    response: "Yes",
    rationale: "Property is a 248-unit multifamily complex meeting all Fannie Mae eligibility criteria including minimum unit count and property age requirements.",
    aiInsight: "All eligibility criteria verified. Property type, age, and unit count align with Fannie Mae guidelines for standard DUS execution.",
  },
  {
    id: "FM2",
    question: "Are there any Fannie Mae Guide compliance issues identified in the loan file?",
    response: "Yes",
    rationale: "Loan file documentation is complete and compliant with Fannie Mae Guide requirements. All required third-party reports are current.",
    aiInsight: "Documentation completeness score: 98%. Minor administrative items identified but no material compliance gaps.",
  },
];

@Component({
  selector: 'app-red-flag-review',
  standalone: true,
  imports: [CommonModule, ButtonComponent, QuestionCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="flex items-center gap-4">
          <app-button
            variant="ghost"
            size="icon"
            (click)="goBack()"
            className="h-10 w-10"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </app-button>
          <div>
            <h1 class="text-3xl font-bold text-foreground">Red Flag Review</h1>
            <p class="mt-1 text-lg text-muted-foreground">
              Red flags review questions and compliance assessment
            </p>
          </div>
        </div>
        <div class="flex gap-3">
          <app-button variant="outline" className="gap-2 bg-transparent text-base">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export Report
          </app-button>
          <app-button variant="outline" className="gap-2 bg-transparent text-base">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Print View
          </app-button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-border">
        <button
          (click)="setActiveTab('lender')"
          [class]="cn(
            'px-6 py-3 text-base font-medium transition-colors',
            activeTab() === 'lender'
              ? 'border-b-2 border-accent text-accent'
              : 'text-muted-foreground hover:text-foreground'
          )"
        >
          Lender Red Flags Review
        </button>
        <button
          (click)="setActiveTab('fannieMae')"
          [class]="cn(
            'px-6 py-3 text-base font-medium transition-colors',
            activeTab() === 'fannieMae'
              ? 'border-b-2 border-accent text-accent'
              : 'text-muted-foreground hover:text-foreground'
          )"
        >
          Fannie Mae Red Flags Review
        </button>
      </div>

      <!-- Questions List -->
      <div class="space-y-4">
        @for (question of currentQuestions(); track question.id) {
          <app-question-card
            [question]="question"
            (responseChange)="handleResponseChange($event.id, $event.response)"
            (rationaleChange)="handleRationaleChange($event.id, $event.rationale)"
          ></app-question-card>
        }
      </div>

      <!-- Bottom Action Buttons -->
      <div class="flex justify-end gap-3">
        <app-button variant="outline" className="gap-2 bg-transparent text-base" size="lg">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Export Comments to CSV
        </app-button>
        <app-button className="gap-2 text-base" size="lg" (click)="saveComments()">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          Save Comments
        </app-button>
      </div>
    </div>
  `,
  styles: []
})
export class RedFlagReviewComponent implements OnInit {
  activeTab = signal<'lender' | 'fannieMae'>('lender');
  lenderQuestions = signal<RedFlagQuestion[]>(lenderRedFlagsQuestions);
  fannieMaeQuestions = signal<RedFlagQuestion[]>(fannieMaeRedFlagsQuestions);

  currentQuestions = computed(() => {
    return this.activeTab() === 'lender' 
      ? this.lenderQuestions() 
      : this.fannieMaeQuestions();
  });

  cn = cn;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    this.loadTestJson();
  }

  private loadTestJson() {
    this.apiService.getTestJson().subscribe({
      next: (data) => {
        const lenderFromJson = extractQuestionAnswerPairs(data, "Lender red flag");
        const companyFromJson = extractQuestionAnswerPairs(data, "Company red flag");
        if (lenderFromJson) {
          this.lenderQuestions.set(makeQuestions("L", lenderFromJson));
        }
        if (companyFromJson) {
          this.fannieMaeQuestions.set(makeQuestions("FM", companyFromJson));
        }
      },
      error: (error) => {
        console.error('Error loading test_new.json:', error);
        // Keep hard-coded fallbacks
      }
    });
  }

  setActiveTab(tab: 'lender' | 'fannieMae') {
    this.activeTab.set(tab);
  }

  handleResponseChange(id: string, response: ResponseType) {
    if (this.activeTab() === 'lender') {
      const current = this.lenderQuestions();
      const updated = current.map((q) =>
        q.id === id ? { ...q, response } : q
      );
      this.lenderQuestions.set(updated);
    } else {
      const current = this.fannieMaeQuestions();
      const updated = current.map((q) =>
        q.id === id ? { ...q, response } : q
      );
      this.fannieMaeQuestions.set(updated);
    }
  }

  handleRationaleChange(id: string, rationale: string) {
    if (this.activeTab() === 'lender') {
      const current = this.lenderQuestions();
      const updated = current.map((q) =>
        q.id === id ? { ...q, rationale } : q
      );
      this.lenderQuestions.set(updated);
    } else {
      const current = this.fannieMaeQuestions();
      const updated = current.map((q) =>
        q.id === id ? { ...q, rationale } : q
      );
      this.fannieMaeQuestions.set(updated);
    }
  }

  saveComments() {
    // In a real app, this would save to a database
    alert('Comments saved successfully!');
  }

  goBack() {
    const loanId = this.route.snapshot.paramMap.get('id');
    if (loanId) {
      this.router.navigate(['/loans', loanId]);
    } else {
      this.router.navigate(['/']);
    }
  }
}
