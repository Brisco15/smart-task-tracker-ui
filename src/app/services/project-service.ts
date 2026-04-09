import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Projects } from '../pages/projects/projects';
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

  // updateProject(projectID: number, projectData: Projects){
  //   return this.http.put(`${this.apiUrl}/projects/${projectID}`,{
  //     projectName: projectData.projectName,
  //     description: projectData.description,
  //     startDate: projectData.startDate
  //   })
  // }

  archiveProject(projectID: number){
    return this.http.patch(`${this.apiUrl}/projects/${projectID}/archive`, {})
  }

  postProject(projectID : number, newProject : Projects){
     return this.http.post(`${this.apiUrl}/projects/${projectID}`,newProject)
     .pipe(tap(()=>console.log(' a new project was created')
    ))
  }


}
