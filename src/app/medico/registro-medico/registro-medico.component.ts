
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-registro-medico',
  templateUrl: './registro-medico.component.html',
  styleUrls: ['./registro-medico.component.css']
})
export class RegistroMedicoComponent {

  registroForm: FormGroup;
  parteVisible: string = 'datosGenerales';
  registroExitoso: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private firestore: AngularFirestore
  ) {
    this.registroForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],

      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],

      perfil: ['medico']
    });
  }

  mostrarParte(parte: string) {
    this.parteVisible = parte;
  }

  mostrarParteAnterior() {
    switch (this.parteVisible) {
      case 'contacto':
        this.parteVisible = 'datosGenerales';
        break;

      case 'perfil':
        this.parteVisible = 'contacto';
        break;
    }
  }

  mostrarParteSiguiente() {
    switch (this.parteVisible) {
      case 'datosGenerales':
        this.parteVisible = 'contacto';
        break;

      case 'contacto':
        this.parteVisible = 'perfil';
        break;
    }
  }

  async registrarProfesional() {

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    try {
      const profesionalData = {
        ...this.registroForm.value,
        perfil: 'medico',
        estado: 'pendiente',
        fechaSolicitud: new Date()
      };

      // Guardar la solicitud sin crear una cuenta de acceso.
      await this.firestore
        .collection('Solicitudes: Profesionales')
        .add(profesionalData);

      this.registroForm.reset({
        perfil: 'medico'
      });

      this.parteVisible = 'datosGenerales';
      this.registroExitoso = true;

    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      alert('No se pudo enviar la solicitud. Intentá nuevamente.');
    }
  }
}
