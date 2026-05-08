import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StatusService {
  private apiUrl = 'https://smart-task-tracker-api-4114.azurewebsites.net/api';

  constructor(private http: HttpClient){}

  getAllStatus(){
    return this.http.get(`${this.apiUrl}/status`)
  }
}
