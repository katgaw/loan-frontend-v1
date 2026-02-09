import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getTestJson(): Observable<any> {
    // Read test.json from assets directory
    return this.http.get<any>('/assets/test.json');
  }
}
