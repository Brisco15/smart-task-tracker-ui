import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'http://localhost:5260/api';

  constructor (private http: HttpClient){};

  getAllTasks(){
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return this.http.get(`${this.apiUrl}/taskItems`, {headers})
  }

  getTask(taskID: number){
    return this.http.get(`${this.apiUrl}/taskItems/${taskID}`)
  }

  getTasksByProject(projectId: number) {
  return this.http.get(`${this.apiUrl}/tasks/project/${projectId}`);
  }

  deleteTask(taskID: number){
    return this.http.delete(`${this.apiUrl}/taskItems/${taskID}`)
  }

  updateTask(taskID: number, taskData: any){
    return this.http.put(`${this.apiUrl}/taskItems/${taskID}`, taskData)
  }

  archiveTask(taskID: number){
    return this.http.patch(`${this.apiUrl}/taskItems/${taskID}/archive`,{})
  }

  postTask(newTask: any){
    return this.http.post(`${this.apiUrl}/taskItems`, newTask)
    .pipe(tap(()=>console.log('A new task was created'))
    )

  }
}


