
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  botonActivo: string | null = null;
  menuOpen = false;

  cambiarBotonActivo(boton: string) {
    if (this.botonActivo === boton) {
      this.botonActivo = null;
    } else {
      this.botonActivo = boton;
    }
  }

  mostrarAviso(portal: string) {
    alert(`El Portal ${portal} no se encuentra disponible actualmente.`);
  }
}
