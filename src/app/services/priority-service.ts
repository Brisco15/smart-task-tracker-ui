import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PriorityService {
  private apiUrl = 'http://localhost:5260/api';

  constructor(private http: HttpClient){}

  getAllPriorities(){
    return this.http.get(`${this.apiUrl}/priorities`)
  }
}
