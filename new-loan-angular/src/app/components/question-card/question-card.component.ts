import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../ui/button/button.component';
import { TextareaComponent } from '../ui/textarea/textarea.component';
import { cn } from '../../../lib/utils';

export type ResponseType = "Yes" | "No" | "N/A";

export interface RedFlagQuestion {
  id: string;
  question: string;
  response: ResponseType;
  rationale: string;
  answer?: string;
  aiInsight: string;
}

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TextareaComponent],
  template: `
    <div
      [class]="cn(
        'rounded-xl border transition-colors relative',
        question.response === 'Yes'
          ? 'border-border bg-card'
          : question.response === 'No'
            ? 'border-fail/30 bg-fail/5'
            : 'border-muted bg-muted/30'
      )"
    >
      <!-- Header Row -->
      <div class="flex w-full items-center justify-between gap-4 p-5">
        <button
          type="button"
          (click)="toggleExpanded()"
          class="flex flex-1 items-center gap-3 text-left hover:opacity-80 transition-opacity"
        >
          @if (isExpanded()) {
            <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          } @else {
            <svg class="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          }
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
            {{ question.id }}
          </span>
          <h4 class="text-base font-medium text-foreground">{{ question.question }}</h4>
        </button>
        <div class="flex items-center gap-4">
          <!-- Response Display (Read-only) -->
          <div [class]="cn(
            'flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5',
            question.response === 'Yes' 
              ? 'text-pass' 
              : question.response === 'No' 
                ? 'text-fail' 
                : 'text-muted-foreground'
          )">
            @if (question.response === 'Yes') {
              <svg class="h-4 w-4 text-pass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            } @else if (question.response === 'No') {
              <svg class="h-4 w-4 text-fail" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            } @else {
              <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
              </svg>
            }
            <span class="text-sm font-medium">{{ question.response }}</span>
          </div>
          <!-- Comment Icon -->
          <button
            type="button"
            (click)="toggleComment(); $event.stopPropagation()"
            [class]="cn(
              'relative rounded-md p-1.5 transition-colors hover:bg-muted',
              commentText() ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            )"
            title="Add comment"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            @if (commentText()) {
              <span class="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-accent"></span>
            }
          </button>
        </div>
      </div>

      <!-- Comment Popup -->
      @if (isCommentOpen()) {
        <div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-4 shadow-lg">
          <div class="mb-3 flex items-center justify-between">
            <h5 class="text-sm font-semibold text-foreground">Comment</h5>
            <button
              type="button"
              (click)="toggleComment(); $event.stopPropagation()"
              class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <app-textarea
            [value]="commentText()"
            (valueChange)="onCommentTextChange($event)"
            placeholder="Enter your comment here..."
            className="mb-3 min-h-[100px] resize-none text-sm"
          ></app-textarea>
          <div class="flex justify-end gap-2">
            <app-button
              variant="outline"
              size="sm"
              (click)="toggleComment(); $event.stopPropagation()"
              className="bg-transparent"
            >
              Cancel
            </app-button>
            <app-button
              size="sm"
              (click)="saveComment(); $event.stopPropagation()"
            >
              Save Comment
            </app-button>
          </div>
        </div>
      }

      <!-- Expanded Content - Answer and AI Insight -->
      @if (isExpanded()) {
        <div class="border-t border-border px-5 pb-5 pt-4">
          @if (question.answer) {
            <h5 class="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <svg class="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Answer
            </h5>
            <div class="rounded-lg border border-accent/20 bg-accent/5 p-4">
              <p class="text-base leading-relaxed text-foreground">
                {{ question.answer }}
              </p>
            </div>
          } @else {
            <div class="rounded-lg border border-muted/20 bg-muted/5 p-4">
              <p class="text-sm text-muted-foreground italic">
                No answer available for this question.
              </p>
            </div>
          }

          @if (question.aiInsight) {
            <h5 [class]="cn(
              'flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground',
              question.answer ? 'mt-4 mb-2' : 'mb-2'
            )">
              <svg class="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
              AI Insight
            </h5>
            <div class="rounded-lg border border-accent/20 bg-accent/5 p-4">
              <p class="text-base leading-relaxed text-foreground">
                {{ question.aiInsight }}
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class QuestionCardComponent implements OnInit, OnChanges {
  @Input({ required: true }) question!: RedFlagQuestion;
  @Output() responseChange = new EventEmitter<{ id: string; response: ResponseType }>();
  @Output() rationaleChange = new EventEmitter<{ id: string; rationale: string }>();

  isExpanded = signal(false);
  isCommentOpen = signal(false);
  commentText = signal('');

  cn = cn;

  ngOnInit() {
    // Initialize comment text from rationale if it exists
    if (this.question?.rationale) {
      this.commentText.set(this.question.rationale);
    }
  }

  ngOnChanges() {
    // Update comment text when question changes
    if (this.question?.rationale) {
      this.commentText.set(this.question.rationale);
    }
  }

  toggleExpanded() {
    this.isExpanded.set(!this.isExpanded());
  }

  toggleComment() {
    this.isCommentOpen.set(!this.isCommentOpen());
    if (!this.isCommentOpen() && this.commentText()) {
      // Save comment when closing
      this.rationaleChange.emit({
        id: this.question.id,
        rationale: this.commentText()
      });
    }
  }

  onCommentTextChange(value: string) {
    this.commentText.set(value);
  }

  saveComment() {
    this.rationaleChange.emit({
      id: this.question.id,
      rationale: this.commentText()
    });
    this.isCommentOpen.set(false);
  }
}
