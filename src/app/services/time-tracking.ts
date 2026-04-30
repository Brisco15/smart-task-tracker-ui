import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TimeTracking {
  private apiUrl = 'http://localhost:5260/api';

  constructor(private http: HttpClient){}

  startTimeTracking(taskID: number, userID: number){
    return this.http.post(`${this.apiUrl}/timetrackings/start`, {
      taskID,
      userID
    })
  }


  stopTimeTracking(taskID: number, userID: number){
    return this.http.post(`${this.apiUrl}/timetrackings/stop`, {
      taskID,
      userID
    })
  }

}
