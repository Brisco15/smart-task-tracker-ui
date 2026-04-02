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

  updateUser(userID: number, userData: any) {
  return this.http.put(`${this.apiUrl}/users/${userID}`, {
    userName: userData.userName,
    email: userData.email,
    roleID: userData.roleID
  });
}

  archiveUser(userID: number) {
    return this.http.patch(`${this.apiUrl}/users/${userID}/archive`, {});
  }


}
