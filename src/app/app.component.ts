import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'electromedicina';
  esPaginaPaciente: boolean = false;
    esPaginaRegistroPaciente: boolean = false;
    esPaginaMedico: boolean = false;
    esPaginaRegistroMedico: boolean = false;
    esPaginaAdmin: boolean = false;
    esPaginaHistorial: boolean = false;
    esPaginaSignosVitales: boolean = false;
  
    constructor(private router: Router) {

      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.esPaginaPaciente = event.url.includes('/pagina-del-paciente'); 
          this.esPaginaRegistroPaciente = event.url.includes('/registro-paciente'); 
          this.esPaginaMedico = event.url.includes('/pagina-medico'); 
          this.esPaginaRegistroMedico = event.url.includes('/registro-medico'); 
          this.esPaginaAdmin = event.url.includes('/pagina-admin'); 
          this.esPaginaHistorial = event.url.includes('/historial-clinico/'); 
          this.esPaginaSignosVitales = event.url.includes('/signos-vitales/'); 
        }
      });
    } 
  }