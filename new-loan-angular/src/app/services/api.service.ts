import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  getTestJson(): Observable<any> {
    // Read test_new.json from assets directory.
    // Add a cache-busting query param so edits to the JSON are reflected immediately.
    return this.http.get<any>(`/assets/test_new.json?v=${Date.now()}`);
  }
}
