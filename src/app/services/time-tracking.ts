import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TimeTracking {
  private apiUrl = 'http://localhost:5260/api';

  constructor(private http: HttpClient){}

  startTimeTracking(taskID: number){
    return this.http.post(`${this.apiUrl}/timetrackings/start?taskId=${taskID}`, {})
  }


  stopTimeTracking(taskID: number){
    return this.http.post(`${this.apiUrl}/timetrackings/stop?taskId=${taskID}`, {})
  }

  getTimeTrackingByProject(projectID: number){
    return this.http.get<any[]>(`${this.apiUrl}/timetrackings/project/${projectID}`)

    
  }

}
