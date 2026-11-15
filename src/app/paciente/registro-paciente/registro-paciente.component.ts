
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../servicios/auth.service';
import { RegistroAltaBaja, Metrica } from '../../models';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { SharedService } from '../../servicios/shared.service';
import {
  doc,
  runTransaction
} from 'firebase/firestore';

@Component({
  selector: 'app-registro-paciente',
  templateUrl: './registro-paciente.component.html',
  styleUrls: ['./registro-paciente.component.css']
})
export class RegistroPacienteComponent implements OnInit {

  registroForm: FormGroup;
  parteVisible: string = 'datosGenerales';
  registroExitoso: boolean = false;
  idProfesional: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private firestore: AngularFirestore,
    private firebaseAuth: AngularFireAuth,
    private sharedService: SharedService
  ) {
    this.registroForm = this.formBuilder.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      tieneObraSocial: [false],
      nombreObraSocial: [''],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.authService.getUserProfesionalId().subscribe(id => {
      this.idProfesional = id;

      if (id !== null) {
        this.authService.getProfesionalData(id.toString())
          .subscribe(profesionalData => {

            if (profesionalData) {
              this.sharedService.actualizarDatosProfesional(
                profesionalData.nombre,
                profesionalData.apellido
              );
            }
          });
      }
    });
  }

  mostrarParte(parte: string): void {
    this.parteVisible = parte;
  }

  mostrarParteAnterior(): void {
    if (this.parteVisible === 'contacto') {
      this.parteVisible = 'datosGenerales';
    }
  }

  mostrarParteSiguiente(): void {
    if (this.parteVisible === 'datosGenerales') {
      this.parteVisible = 'contacto';
    }
  }

  async registrarPaciente(): Promise<void> {

    console.log('Registrando paciente...');

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    try {

      // Verificar el profesional
      if (this.idProfesional === null || this.idProfesional <= 0) {
        console.error('No se pudo obtener el ID del profesional.');
        return;
      }

      // Obtener el usuario autenticado
      const usuario = await this.firebaseAuth.currentUser;

      if (!usuario) {
        console.error('No hay un médico autenticado.');
        return;
      }

      const uidProfesional = usuario.uid;
      const firestoreInstance = this.firestore.firestore;
      const pacienteData = this.registroForm.value;

      // Referencia al contador global
      const contadorRef = doc(
        firestoreInstance,
        'Contadores',
        'contadorGlobalPacientes'
      );

      // Generar ID y guardar paciente mediante transacción
      const idPaciente = await runTransaction(
        firestoreInstance,
        async (transaction) => {

          // Leer únicamente el contador
          const contadorSnapshot = await transaction.get(contadorRef);

          let nuevoId: number;

          if (contadorSnapshot.exists()) {
            const valorActual = contadorSnapshot.data()['valor'];

            if (
              typeof valorActual !== 'number' ||
              !Number.isInteger(valorActual) ||
              valorActual < 0
            ) {
              throw new Error('El contador global tiene un valor inválido.');
            }

            nuevoId = valorActual + 1;

          } else {
            nuevoId = 1;
          }

          const pacienteRef = doc(
            firestoreInstance,
            'Usuario: Pacientes',
            nuevoId.toString()
          );

          // Actualizar contador
          transaction.set(contadorRef, {
            valor: nuevoId
          });

          // Crear paciente
          transaction.set(pacienteRef, {
            ...pacienteData,
            idPaciente: nuevoId,
            idProfesional: this.idProfesional,
            uidProfesional: uidProfesional
          });

          return nuevoId;
        }
      );

      console.log('Paciente registrado con ID:', idPaciente);

      // Crear métricas iniciales y sus registros
      const signosVitales = [
        'Temperatura',
        'Presión Arterial',
        'Oxígeno'
      ];

      for (const signo of signosVitales) {

        const metricaRef = this.firestore
          .collection(`Usuario: Pacientes/${idPaciente}/Metricas`)
          .doc(signo);

        // Crear documento principal de la métrica
        await metricaRef.set({
          idPaciente: idPaciente,
          signoVital: signo
        });

        // Generar fecha del registro inicial
        const fechaRegistro = new Date().toISOString();

        // Crear documento dentro de Registros
        const registroInicial: Metrica = {
          idMetrica: this.obtenerIdMetricaPorSigno(signo),
          idPaciente: idPaciente,
          signoVital: signo,
          fecha: fechaRegistro,
          valor: '',
          obs: '',
          ubicacion: ''
        };

        await metricaRef
          .collection('Registros')
          .doc(fechaRegistro)
          .set(registroInicial);

      }

      console.log('Métricas y registros iniciales creados correctamente.');
      // Crear registro de alta inicial
      const registroAltaBaja: RegistroAltaBaja = {
        idProfesional: this.idProfesional,
        idPaciente: idPaciente,
        fechaAlta: new Date().toISOString(),
        fechaBaja: '',
        motivo: 'Alta inicial'
      };

      await this.authService.vicuPacienteMedico(registroAltaBaja);

      console.log('Registro de alta guardado correctamente.');

      // Finalizar registro
      this.registroForm.reset();

      this.parteVisible = 'datosGenerales';
      this.registroExitoso = true;

      console.log('Registro completo del paciente:', idPaciente);

    } catch (error) {
      console.error('Error al registrar el paciente:', error);
    }
  }

  async agregarMetricaManual(
    idPaciente: number,
    signoVital: string,
    valor: string
  ): Promise<void> {

    try {

      const metricasRef = this.firestore
        .collection(`Usuario: Pacientes/${idPaciente}/Metricas`)
        .doc(signoVital);

      const timestamp = new Date().toISOString();

      const idMetrica = this.obtenerIdMetricaPorSigno(signoVital);

      const nuevaMetrica: Metrica = {
        idMetrica: idMetrica,
        idPaciente: idPaciente,
        signoVital: signoVital,
        valor: valor,
        fecha: timestamp,
        obs: '',
        ubicacion: await this.getCurrentLocation()
      };

      await metricasRef
        .collection('Registros')
        .doc(timestamp)
        .set(nuevaMetrica);

      console.log(`Nueva medición manual de ${signoVital} guardada.`);

    } catch (error) {
      console.error('Error al agregar la métrica manual:', error);
    }
  }

  obtenerIdMetricaPorSigno(signoVital: string): number {

    const idMetricaMap: { [key: string]: number } = {
      'Temperatura': 1,
      'Presión Arterial': 2,
      'Oxígeno': 3
    };

    return idMetricaMap[signoVital] || 99;
  }

  getCurrentLocation(): Promise<string> {

    return new Promise((resolve, reject) => {

      if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
          position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            resolve(`${lat},${lng}`);
          },
          () => {
            reject('No se pudo obtener la ubicación');
          }
        );

      } else {
        reject('La geolocalización no es compatible con este navegador');
      }
    });
  }
}
