import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ProjectDTO } from '../interfaces/ProjectDTO';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:5260/api';

  constructor(private http : HttpClient){}

  getAllProjects(){
  const headers = new HttpHeaders({
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
  });
    return this.http.get(`${this.apiUrl}/projects`, { headers})
  }

  getAProject(projectID: number){
    return this.http.get(`${this.apiUrl}/projects/${projectID}`)
  }

  deleteProject( projectID : number){
    return this.http.delete(`${this.apiUrl}/projects/${projectID}`)
  }

   updateProject(projectID: number, projectData: any) {
   return this.http.put(`${this.apiUrl}/projects/${projectID}`, projectData);
 }

  archiveProject(projectID: number){
    return this.http.patch(`${this.apiUrl}/projects/${projectID}/archive`, {})
  }

  postProject(newProject: any){
     return this.http.post(`${this.apiUrl}/projects`, newProject)
     .pipe(tap(() => console.log('A new project was created'))
    )
  }


}
