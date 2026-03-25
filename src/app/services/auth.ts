import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtPayload } from '../interfaces/jwt-payload';
import { jwtDecode} from 'jwt-decode'
 
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

    login(
      email: string,
      passwordHash: string
    ){
      return this.http.post(`${this.apiUrl}/login`, {
        email,
        password: passwordHash
      })
    }

    getToken(): string | null{
      return localStorage.getItem('token');
    }

    isAuthenticated(): boolean {
      const token = this.getToken();
      if(!token) return false;

      try{
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.exp * 1000 > Date.now();
      }catch {
        return false
      }
    }

    getUserRole(): string | null {
      const token = this.getToken()
      if(!token) {
        console.log('No token found');
        return null;
      }

      try {
        const decoded = jwtDecode<any>(token);
        console.log('=== JWT DEBUG ===');
        console.log('Full decoded token:', decoded);
        console.log('All claim keys:', Object.keys(decoded));
        
        // Try both possible claim names
        const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] 
                  || decoded['role'];
        
        console.log('Extracted Role:', role);
        console.log('================');
        return role || null;
      }catch(error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }

    logout(): void{
      localStorage.removeItem('token')
    }
}
