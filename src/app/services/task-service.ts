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
    return this.http.get(`${this.apiUrl}/tasks`, {headers})  // ✅ Geändert von /taskItems zu /tasks
  }

  getTask(taskID: number){
    return this.http.get(`${this.apiUrl}/tasks/${taskID}`)  // ✅ Geändert
  }

  getTasksByProject(projectId: number) {
    return this.http.get(`${this.apiUrl}/tasks/project/${projectId}`);  // ✅ Bereits korrekt
  }

  deleteTask(taskID: number){
    return this.http.delete(`${this.apiUrl}/tasks/${taskID}`)  // ✅ Geändert
  }

  updateTask(taskID: number, taskData: any){
    return this.http.put(`${this.apiUrl}/tasks/${taskID}`, taskData)  // ✅ Geändert
  }

  archiveTask(taskID: number){
    return this.http.patch(`${this.apiUrl}/tasks/${taskID}/archive`,{})  // ✅ Geändert
  }

  postTask(newTask: any){
    return this.http.post(`${this.apiUrl}/tasks`, newTask)  // ✅ Geändert von /taskItems zu /tasks
    .pipe(tap(()=>console.log('A new task was created'))
    )
  }
}


