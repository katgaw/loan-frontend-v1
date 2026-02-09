import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanListPageComponent } from '../components/loan-list-page/loan-list-page.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoanListPageComponent],
  template: `
    <app-loan-list-page (navigateToDetail)="onNavigateToDetail($event)"></app-loan-list-page>
  `,
  styles: []
})
export class HomeComponent {
  constructor(private router: Router) {}

  onNavigateToDetail(loanId: string) {
    this.router.navigate(['/loans', loanId]);
  }
}
