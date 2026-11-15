
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-ingreso-medico',
  templateUrl: './ingreso-medico.component.html',
  styleUrl: './ingreso-medico.component.css'
})
export class IngresoMedicoComponent {

  mostrarFormularioMedico = true;
  formularioMedico: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: AngularFireAuth
  ) {
    this.formularioMedico = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required]
    });
  }

  async ingresarMedico() {

    if (this.formularioMedico.invalid) {
      this.formularioMedico.markAllAsTouched();
      alert('Completá correctamente el correo electrónico y la contraseña.');
      return;
    }

    const email = this.formularioMedico.value.email;
    const contrasena = this.formularioMedico.value.contrasena;

    try {
      const resultado = await this.auth.signInWithEmailAndPassword(
        email,
        contrasena
      );

      if (resultado.user) {
        console.log('Médico autenticado correctamente:', resultado.user.email);
        console.log('UID de sesión:', resultado.user.uid);
        console.log('Estado de sesión:', resultado.user.emailVerified);
        await this.router.navigate(['/pagina-medico']);
      }

    } catch (error: any) {
      console.error('Error en el inicio de sesión:', error);

      if (error.code === 'auth/user-not-found') {
        alert('No existe una cuenta con ese correo electrónico.');
      } else if (error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential') {
        alert('El correo electrónico o la contraseña son incorrectos.');
      } else {
        alert('No se pudo iniciar sesión. Revisá la consola para más detalles.');
      }
    }
  }

  ingresarPrimeraVez() {
    const nuevaVentana = window.open(
      '/registro-medico',
      '_blank',
      'height=600,width=800'
    );

    if (nuevaVentana) {
      nuevaVentana.focus();
    } else {
      alert('No se pudo abrir una nueva ventana. Revisá el bloqueo de ventanas emergentes.');
    }
  }
}
