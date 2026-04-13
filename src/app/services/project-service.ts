import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProjectDTO } from '../interfaces/ProjectDTO';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = 'http://localhost:5260/api';

  constructor(private http : HttpClient){}

  getAllProjects(){
    return this.http.get(`${this.apiUrl}/projects`)
  }

  getAProject(projectID: number){
    return this.http.get(`${this.apiUrl}/projects/${projectID}`)
  }

  deleteProject( projectID : number){
    return this.http.delete(`${this.apiUrl}/projects/${projectID}`)
  }

  // updateProject(projectID: number, projectData: ProjectDTO){
  //   return this.http.put(`${this.apiUrl}/projects/${projectID}`,{
  //     projectName: projectData.projectName,
  //     description: projectData.description,
  //     startDate: projectData.startDate
  //   })
  // }

  archiveProject(projectID: number){
    return this.http.patch(`${this.apiUrl}/projects/${projectID}/archive`, {})
  }

  postProject(newProject: any){
     return this.http.post(`${this.apiUrl}/projects`, newProject)
     .pipe(tap(() => console.log('A new project was created'))
    )
  }


}
