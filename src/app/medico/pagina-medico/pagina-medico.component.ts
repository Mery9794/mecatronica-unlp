
import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../servicios/auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { SharedService } from '../../servicios/shared.service';
import { Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-pagina-medico',
  templateUrl: './pagina-medico.component.html',
  styleUrls: ['./pagina-medico.component.css']
})
export class PaginaMedicoComponent implements OnInit, OnDestroy {

  botonActivo: string = 'Inicio';

  private subscriptions = new Subscription();

  private esNavegador: boolean;

  pestanasVisible: any = {
    Inicio: true,
    Favoritos: false,
    Mapeo: false,
    Registro: false
  };

  usuario = {
    nombre: '',
    apellido: ''
  };

  saludo: string = '';
  searchTerm: string = '';
  pacientesFavoritos: any[] = [];

  idProfesional: number | null = null;

  constructor(
    private firestore: AngularFirestore,
    private router: Router,
    private firebaseAuth: AngularFireAuth,
    private authService: AuthService,
    private sharedService: SharedService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.esNavegador = isPlatformBrowser(platformId);
    this.saludo = this.obtenerSaludo();
  }

  ngOnInit(): void {

    if (!this.esNavegador) {
      return;
    }

    const authSub = this.firebaseAuth.authState.subscribe(auth => {

      if (!auth) {
        console.log('Esperando autenticación del médico...');
        return;
      }

      const uid = auth.uid;

      console.log('UID del médico autenticado:', uid);

      const profesionalSub = this.authService
        .getProfesionalIdByUid(uid)
        .subscribe({

          next: profesionalId => {

            if (profesionalId === null || profesionalId <= 0) {
              console.error(
                'No se encontró un profesional asociado a esta cuenta.'
              );
              return;
            }

            this.idProfesional = profesionalId;

            console.log('ID del profesional:', profesionalId);

            const datosSub = this.authService
              .getProfesionalData(profesionalId.toString())
              .subscribe({

                next: profesional => {

                  if (profesional) {

                    console.log('Datos del profesional:', profesional);

                    this.sharedService.actualizarDatosProfesional(
                      profesional.nombre,
                      profesional.apellido
                    );

                    this.usuario.nombre = profesional.nombre;
                    this.usuario.apellido = profesional.apellido;
                  }
                },

                error: error => {
                  console.error(
                    'Error al obtener los datos del médico:',
                    error
                  );
                }

              });

            this.subscriptions.add(datosSub);

            this.obtenerPacientesFavoritos(uid);
          },

          error: error => {
            console.error(
              'Error al buscar el profesional:',
              error
            );
          }

        });

      this.subscriptions.add(profesionalSub);

    });

    this.subscriptions.add(authSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  obtenerSaludo(): string {

    const hoy = new Date();
    const hora = hoy.getHours();

    if (hora >= 4 && hora < 12) {
      return 'Buenos Días';
    } else if (hora >= 12 && hora < 19) {
      return 'Buenas Tardes';
    } else {
      return 'Buenas Noches';
    }
  }

  cambiarPestana(pestana: string): void {

    this.botonActivo = pestana;

    for (const key in this.pestanasVisible) {
      this.pestanasVisible[key] = key === pestana;
    }
  }

  async cerrarSesion(): Promise<void> {

    try {

      await this.firebaseAuth.signOut();

      this.router.navigate(['/inicio']);

    } catch (error) {

      console.error('Error al cerrar sesión:', error);

    }
  }

  obtenerPacientesFavoritos(uidProfesional: string): void {

    this.firestore
      .collection('Usuario: Pacientes', ref =>
        ref.where('uidProfesional', '==', uidProfesional)
      )
      .valueChanges()
      .subscribe({

        next: (data: any[]) => {

          this.pacientesFavoritos = data.map(paciente => ({
            idPaciente: paciente.idPaciente,
            nombre: paciente.nombre,
            apellido: paciente.apellido
          }));

          console.log(
            'Pacientes obtenidos:',
            this.pacientesFavoritos
          );
        },

        error: error => {
          console.error(
            'Error al obtener pacientes:',
            error
          );
        }

      });
  }

  abrirFormularioRegistro(): void {

    const nuevaVentana = window.open(
      '/registro-paciente',
      '_blank',
      'height=600,width=800'
    );

    if (nuevaVentana) {
      nuevaVentana.focus();
    } else {
      alert(
        'No se pudo abrir una nueva ventana. Asegúrate de deshabilitar el bloqueo de ventanas emergentes.'
      );
    }
  }

}
