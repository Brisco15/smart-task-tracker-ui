import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TimeTracking {
  private apiUrl = 'https://smart-task-tracker-api-4114.azurewebsites.net/api';

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

  getTotalTime(projectID: number){
    return this.http.get<number>(`${this.apiUrl}/timetrackings/project/${projectID}/total`)
  }

  getTimeTrackingByTask(taskId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/timetrackings/task/${taskId}`);
  }

}
