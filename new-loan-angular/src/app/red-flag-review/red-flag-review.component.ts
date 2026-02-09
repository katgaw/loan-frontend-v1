import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../components/ui/button/button.component';

@Component({
  selector: 'app-red-flag-review',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="space-y-6">
      <h1 class="text-3xl font-bold">Red Flag Review</h1>
      <p class="text-muted-foreground">This is a placeholder for the red flag review page. Full implementation coming soon.</p>
      <app-button (click)="goBack()">Back</app-button>
    </div>
  `,
  styles: []
})
export class RedFlagReviewComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}
