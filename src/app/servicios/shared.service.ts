import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  constructor() {
    this.usuarioSubject = new BehaviorSubject<{ nombre: string; apellido: string }>({ nombre: '', apellido: '' });
  }
  
    private usuarioSubject = new BehaviorSubject<{ nombre: string; apellido: string }>({ nombre: '', apellido: '' });
  
    usuario$: Observable<{ nombre: string; apellido: string }> = this.usuarioSubject.asObservable();


  actualizarDatosProfesional(nombre: string, apellido: string) {
    this.usuarioSubject.next({ nombre, apellido });
  }
} 