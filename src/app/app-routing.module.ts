
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { IngresoMedicoComponent } from './medico/ingreso-medico/ingreso-medico.component';
import { PaginaMedicoComponent } from './medico/pagina-medico/pagina-medico.component';
import { RegistroMedicoComponent } from './medico/registro-medico/registro-medico.component';

import { RegistroPacienteComponent } from './paciente/registro-paciente/registro-paciente.component';

import { HistorialClinicoComponent } from './favoritos/historial-clinico/historial-clinico.component';
import { SignosVitalesComponent } from './favoritos/signos-vitales/signos-vitales.component';

import { InicioComponent } from './shared/inicio/inicio.component';

const routes: Routes = [
  { path: 'inicio', component: InicioComponent },
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },

  // Portal Médico
  { path: 'medicos', component: IngresoMedicoComponent },
  { path: 'pagina-medico', component: PaginaMedicoComponent },
  { path: 'registro-medico', component: RegistroMedicoComponent },

  // Registro de pacientes realizado por el médico
  { path: 'registro-paciente', component: RegistroPacienteComponent },

  // Funciones clínicas
  { path: 'historial-clinico/:id', component: HistorialClinicoComponent },
  { path: 'signos-vitales/:id', component: SignosVitalesComponent },

  // Portales no disponibles
  { path: 'administrador', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'pagina-admin', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'pacientes', redirectTo: '/inicio', pathMatch: 'full' },
  { path: 'pagina-del-paciente', redirectTo: '/inicio', pathMatch: 'full' },

  // Cualquier ruta inexistente vuelve al inicio
  { path: '**', redirectTo: '/inicio' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
