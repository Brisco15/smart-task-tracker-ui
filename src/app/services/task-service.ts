import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'https://smart-task-tracker-api-4114.azurewebsites.net/api';

  constructor (private http: HttpClient){};

  getAllTasks(){
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    return this.http.get(`${this.apiUrl}/tasks`, {headers})
  }

  getTask(taskID: number){
    return this.http.get(`${this.apiUrl}/tasks/${taskID}`)
  }

  getTasksByProject(projectId: number) {
    return this.http.get(`${this.apiUrl}/tasks/project/${projectId}`);
  }

  deleteTask(taskID: number){
    return this.http.delete(`${this.apiUrl}/tasks/${taskID}`)
  }

  updateTask(taskID: number, taskData: any){
    return this.http.put(`${this.apiUrl}/tasks/${taskID}`, taskData)
  }

  updateTaskByProject(projectId: number,taskID: number, taskData: any){
    return this.http.put(`${this.apiUrl}/tasks/project/${projectId}/${taskID}`, taskData)
  }

  archiveTask(taskID: number){
    return this.http.patch(`${this.apiUrl}/tasks/${taskID}/archive`,{})
  }

  postTask(newTask: any){
    return this.http.post(`${this.apiUrl}/tasks`, newTask)
  }
}


