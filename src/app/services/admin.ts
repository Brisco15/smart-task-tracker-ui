import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root',
})

export class Admin {

  private apiUrl = 'http://localhost:5260/api';

  constructor(private http: HttpClient) { }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}/users`)
  }

  deleteUser(userID: number) {
    return this.http.delete(`${this.apiUrl}/users/${userID}`)
  }


  postProject(projectName: string, description: string, startDate: Date) {
    return this.http.post(`${this.apiUrl}/projects`, {
      projectName,
      description,
      startDate,
    });

  }

  updateProject(projectID: number, projectName: string, description: string, startDate: Date) {
    return this.http.put(`${this.apiUrl}/projects/${projectID}`, {
      projectName,
      description,
      startDate,
    });
  }

  getProjects() {
    return this.http.get(`${this.apiUrl}/projects`)
  }

  deleteProject(projectID: number) {

    return this.http.delete(`${this.apiUrl}/projects/${projectID}`)
  }


}
