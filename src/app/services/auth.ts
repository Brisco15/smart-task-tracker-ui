import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl= 'http://localhost:5260/api/auth';
    constructor(private http: HttpClient){}

    register(
      userName: string,
      email: string,
      passwordHash: string,
      roleID: number
    ){
      return this.http.post(`${this.apiUrl}/register`, {
        userName,
        email,
        passwordHash,
        roleID
      })
    }
}
