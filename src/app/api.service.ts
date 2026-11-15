import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  private apiUrl = 'http://localhost:3000';  

  constructor(private http: HttpClient) {}

  registrarProfesional(profesionalData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/profesionales`, profesionalData);
  }

  verificarCredenciales(email: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, contrasena });
  }
}
