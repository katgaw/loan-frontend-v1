import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoanDetailComponent } from './loan-detail/loan-detail.component';
import { RedFlagReviewComponent } from './red-flag-review/red-flag-review.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'loans/:id', component: LoanDetailComponent },
  { path: 'loans/:id/red-flags', component: RedFlagReviewComponent },
  { path: '**', redirectTo: '' }
];
