import { Component, OnInit, OnDestroy } from '@angular/core';
import { Metrica, UserPaciente } from '../../models';
import { Subscription } from 'rxjs';
import { AuthService } from '../../servicios/auth.service';
import { FavService } from '../fav.service';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-add-favs',
  standalone: false,
  templateUrl: './add-favs.component.html',
  styleUrls: ['./add-favs.component.css']
})
export class AddFavsComponent implements OnInit, OnDestroy {

  pacientes: UserPaciente[] = [];
  showPatientList = false;
  pacienteSeleccionado: UserPaciente | null = null;

  contadorSubscription: Subscription | undefined;
  expandedPatientId: string | null = null;

  itemsToShow: number = 5;
  pacientesSubscription: Subscription | undefined;

  ordenEdadAscendente: boolean = true; 
  ordenAscendente: boolean = true;

  originalPacientes: UserPaciente[] = [];
  isSorted: boolean = false;

  selectedSignoVital: string = '';

  ordenSignosAscendente: { [key: string]: boolean } = {
    'Temperatura': true,
    'Presión Arterial': true,
    'Oxígeno': true,
    'Fecha': true
  };

  signosVitales: string[] = [
    'Temperatura',
    'Presión Arterial',
    'Oxígeno'
  ];

  datos: any;

  constructor(
    private authService: AuthService,
    private favService: FavService,
    private router: Router,
    private firestore: AngularFirestore
  ) { }


  ngOnInit(): void {

    this.authService.getUserProfesionalId().subscribe({

      next: (idProfesional) => {

        console.log('ID del Profesional:', idProfesional);

        if (idProfesional !== null) {
          this.loadPatients(idProfesional);
        } else {
          console.error('No se encontró el ID del profesional.');
        }
      },

      error: (error) => {
        console.error('Error al obtener el ID profesional:', error);
      }

    });
  }


  ngOnDestroy(): void {

    if (this.contadorSubscription) {
      this.contadorSubscription.unsubscribe();
    }

    if (this.pacientesSubscription) {
      this.pacientesSubscription.unsubscribe();
    }
  }


  showList(): void {
    this.showPatientList = !this.showPatientList;
  }

  loadPatients(idProfesional: number): void {

    console.log('Cargando pacientes del profesional:', idProfesional);

    this.pacientesSubscription?.unsubscribe();

    this.pacientesSubscription = this.favService
      .getAllPacientes(idProfesional)
      .subscribe({

        next: async (pacientesData) => {

          console.log('Pacientes recibidos en AddFavs:', pacientesData);

          this.pacientes = pacientesData.map(paciente => ({
            ...paciente,
            edad: paciente.fechaNacimiento
              ? this.calcularEdad(paciente.fechaNacimiento)
              : -1,
            metricas: []
          }));

          this.originalPacientes = [...this.pacientes];

          console.log('Cantidad en la lista:', this.pacientes.length);

          this.itemsToShow = Math.max(
            5,
            Math.min(this.itemsToShow, this.pacientes.length)
          );

          await Promise.all(
            this.pacientes.map(async (paciente) => {

              try {

                const metricas = await this.favService
                  .getMetricasPaciente(paciente.idPaciente);

                paciente.metricas = metricas.map(metrica => ({
                  ...metrica,
                  valor: metrica.valor ?? 'N/A'
                }));

              } catch (error) {

                console.error(
                  `Error al obtener métricas del paciente ${paciente.idPaciente}:`,
                  error
                );

                paciente.metricas = [];
              }

            })
          );

          console.log('Lista final de pacientes:', this.pacientes);
        },

        error: (error) => {
          console.error('Error al cargar pacientes:', error);
        }

      });
  }


  calcularEdad(fechaNacimiento: string): number {

    const today = new Date();
    const birthDate = new Date(fechaNacimiento);

    let age = today.getFullYear() - birthDate.getFullYear();

    const month = today.getMonth() - birthDate.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }


  // Convierte los valores de las métricas a texto para poder procesarlos.
  private obtenerValorTexto(valor: string | number | null | undefined): string {
    return valor === null || valor === undefined ? '' : String(valor);
  }


  toggleHistorialClinico(paciente: UserPaciente): void {

    this.expandedPatientId =
      this.expandedPatientId === paciente.idPaciente.toString()
        ? null
        : paciente.idPaciente.toString();
  }


  // Iconos de las métricas
  getIconForMetric(metrica: Metrica): string {

    switch (metrica.signoVital) {

      case 'Temperatura':
        return 'fa-solid fa-temperature-high';

      case 'Presión Arterial':
        return 'fa-solid fa-tachometer-alt';

      case 'Oxígeno':
        return 'fa-solid fa-lungs';

      default:
        return 'fa-solid fa-question';
    }
  }


  // Color del icono de la métrica
  getColorForMetric(metrica: Metrica): string {

    if (metrica.signoVital === 'Temperatura') {

      const temperatura = parseFloat(this.obtenerValorTexto(metrica.valor));

      if (temperatura >= 39.9) return 'red';
      else if (temperatura > 37.0) return 'orange';
      else return 'green';

    } else if (metrica.signoVital === 'Presión Arterial') {

      const [sistolica, diastolica] = this.obtenerValorTexto(metrica.valor).split('/');

      const s = parseFloat(sistolica);
      const d = parseFloat(diastolica);

      if (s < 120 && d < 80) return 'green';
      else if ((s >= 120 && s < 130) || (d >= 80 && d < 90)) return 'orange';
      else return 'red';

    } else if (metrica.signoVital === 'Oxígeno') {

      const oxigeno = parseFloat(this.obtenerValorTexto(metrica.valor));

      if (oxigeno >= 95) return 'green';
      else if (oxigeno >= 90) return 'orange';
      else return 'red';
    }

    return 'gray';
  }


  setItemsToShow(count: number): void {
    this.itemsToShow = Math.min(count, this.pacientes.length);
  }


  getStartIndex(): number {
    return this.pacientes.length > 0 ? 1 : 0;
  }


  getEndIndex(): number {
    return Math.min(this.itemsToShow, this.pacientes.length);
  }


  // Ordenar por apellido
  toggleSort(): void {

    if (this.isSorted) {

      this.pacientes = [...this.originalPacientes];

    } else {

      this.pacientes.sort((a, b) => {

        if (this.ordenAscendente) {
          return a.apellido.localeCompare(b.apellido);
        } else {
          return b.apellido.localeCompare(a.apellido);
        }

      });

      this.ordenAscendente = !this.ordenAscendente;
    }

    this.isSorted = !this.isSorted;
  }


  // Ordenar por edad
  toggleSortByAge(): void {

    this.pacientes = this.pacientes.filter(
      paciente => paciente.edad !== undefined
    );

    if (this.ordenEdadAscendente) {

      this.pacientes.sort(
        (a, b) => (a.edad || 0) - (b.edad || 0)
      );

    } else {

      this.pacientes.sort(
        (a, b) => (b.edad || 0) - (a.edad || 0)
      );
    }

    this.ordenEdadAscendente = !this.ordenEdadAscendente;
  }


  // Obtener nivel de gravedad del paciente
  getSeverityLevel(paciente: UserPaciente): number {

    if (!paciente.metricas || paciente.metricas.length === 0) {
      return -1;
    }

    const metrica = paciente.metricas[0];

    if (metrica.signoVital === 'Temperatura') {

      const temperatura = parseFloat(this.obtenerValorTexto(metrica.valor));

      if (temperatura >= 39.9) return 3;
      if (temperatura >= 37.0) return 2;

      return 1;
    }

    if (metrica.signoVital === 'Presión Arterial') {

      const [sistolica, diastolica] = this.obtenerValorTexto(metrica.valor).split('/');

      const sistolicaValue = parseFloat(sistolica);
      const diastolicaValue = parseFloat(diastolica);

      if (sistolicaValue >= 140 || diastolicaValue >= 90) return 3;

      if (
        (sistolicaValue >= 130 && sistolicaValue < 140) ||
        (diastolicaValue >= 80 && diastolicaValue < 90)
      ) {
        return 2;
      }

      return 1;
    }

    if (metrica.signoVital === 'Oxígeno') {

      const oxigeno = parseFloat(this.obtenerValorTexto(metrica.valor));

      if (oxigeno < 90) return 3;
      if (oxigeno < 95) return 2;

      return 1;
    }

    return 0;
  }


  // Seleccionar signo vital y alternar orden
  setSelectedSignoVital(signo: string): void {

    if (this.selectedSignoVital === signo) {

      this.ordenSignosAscendente[signo] =
        !this.ordenSignosAscendente[signo];

    } else {

      this.selectedSignoVital = signo;
      this.ordenSignosAscendente[signo] = true;
    }

    this.ordenarDatosPorSignoVital();
  }


  // Ordenar por signo vital seleccionado
  ordenarDatosPorSignoVital(): void {

    switch (this.selectedSignoVital) {

      case 'Temperatura':

        this.pacientes.sort((a, b) => {

          const valorA = a.metricas?.find(
            m => m.signoVital === 'Temperatura'
          )?.valor;

          const valorB = b.metricas?.find(
            m => m.signoVital === 'Temperatura'
          )?.valor;

          return this.ordenSignosAscendente['Temperatura']
            ? parseFloat(String(valorA ?? '0')) - parseFloat(String(valorB ?? '0'))
            : parseFloat(String(valorB ?? '0')) - parseFloat(String(valorA ?? '0'));
        });

        break;


      case 'Presión Arterial':

        this.pacientes.sort((a, b) => {

          const valorA = a.metricas?.find(
            m => m.signoVital === 'Presión Arterial'
          )?.valor;

          const valorB = b.metricas?.find(
            m => m.signoVital === 'Presión Arterial'
          )?.valor;

          return this.ordenSignosAscendente['Presión Arterial']
            ? parseFloat(String(valorA ?? '0').split('/')[0]) -
              parseFloat(String(valorB ?? '0').split('/')[0])
            : parseFloat(String(valorB ?? '0').split('/')[0]) -
              parseFloat(String(valorA ?? '0').split('/')[0]);
        });

        break;


      case 'Oxígeno':

        this.pacientes.sort((a, b) => {

          const valorA = a.metricas?.find(
            m => m.signoVital === 'Oxígeno'
          )?.valor;

          const valorB = b.metricas?.find(
            m => m.signoVital === 'Oxígeno'
          )?.valor;

          return this.ordenSignosAscendente['Oxígeno']
            ? parseFloat(String(valorA ?? '0')) - parseFloat(String(valorB ?? '0'))
            : parseFloat(String(valorB ?? '0')) - parseFloat(String(valorA ?? '0'));
        });

        break;

      default:
        break;
    }
  }


  // Obtener icono según el signo vital
  getIconForMetricByType(signoVital: string): string {

    switch (signoVital) {

      case 'Temperatura':
        return 'fa-solid fa-temperature-high';

      case 'Presión Arterial':
        return 'fa-tachometer-alt';

      case 'Oxígeno':
        return 'fa-lungs';

      default:
        return 'fa-question';
    }
  }


  // Obtener color según el signo vital
  getColorForMetricByType(
    metricas: Metrica[],
    signoVital: string
  ): string {

    const metrica = metricas.find(
      m => m.signoVital === signoVital
    );

    if (!metrica) return 'black';

    const valor = parseFloat(this.obtenerValorTexto(metrica.valor));

    if (signoVital === 'Temperatura') {
      return valor >= 39.9
        ? 'red'
        : valor >= 37.5
          ? 'orange'
          : 'green';
    }

    if (signoVital === 'Presión Arterial') {

      const [sistolica, diastolica] = this.obtenerValorTexto(metrica.valor).split('/');

      const sistolicaValue = parseFloat(sistolica);
      const diastolicaValue = parseFloat(diastolica);

      if (sistolicaValue >= 140 || diastolicaValue >= 90) {
        return 'red';
      }

      if (
        (sistolicaValue >= 130 && sistolicaValue < 140) ||
        (diastolicaValue >= 80 && diastolicaValue < 90)
      ) {
        return 'orange';
      }

      return 'green';
    }

    if (signoVital === 'Oxígeno') {
      return valor <= 90
        ? 'red'
        : valor < 95
          ? 'orange'
          : 'green';
    }

    return 'black';
  }


  // Ordenar pacientes por signo vital seleccionado
  sortBySelectedSignoVital(): void {

    this.pacientes.sort((a, b) => {

      const valorA = parseFloat(
        this.getMetricValue(a, this.selectedSignoVital) || '0'
      );

      const valorB = parseFloat(
        this.getMetricValue(b, this.selectedSignoVital) || '0'
      );

      const ordenAscendente =
        this.ordenSignosAscendente[this.selectedSignoVital] ?? true;

      return ordenAscendente
        ? valorA - valorB
        : valorB - valorA;
    });

    this.ordenSignosAscendente[this.selectedSignoVital] =
      !this.ordenSignosAscendente[this.selectedSignoVital];
  }


  // Obtener valor de la métrica
  getMetricValue(
    paciente: UserPaciente,
    signoVital: string
  ): string | null {

    const metrica = paciente.metricas?.find(
      m => m.signoVital === signoVital
    );

    return metrica ? String(metrica.valor) : 'N/A';
  }


  // Ordenar por signo vital
  toggleSortBySignoVital(signoVital: string): void {

    this.ordenSignosAscendente[signoVital] =
      !this.ordenSignosAscendente[signoVital];

    this.pacientes.sort((a, b) => {

      const aValor = this.obtenerValorSignoVital(a, signoVital);
      const bValor = this.obtenerValorSignoVital(b, signoVital);

      return this.ordenSignosAscendente[signoVital]
        ? aValor - bValor
        : bValor - aValor;
    });
  }


  obtenerValorSignoVital(
    paciente: UserPaciente,
    signoVital: string
  ): number {

    const metrica = paciente.metricas?.find(
      m => m.signoVital === signoVital
    );

    return metrica
      ? parseFloat(this.obtenerValorTexto(metrica.valor)) || 0
      : 0;
  }


  // Obtener valor numérico de las métricas
  getNumericMetricValue(
    metricas: Metrica[],
    signoVital: string
  ): number {

    const metrica = metricas.find(
      m => m.signoVital === signoVital
    );

    if (!metrica || isNaN(parseFloat(this.obtenerValorTexto(metrica.valor)))) {
      return 0;
    }

    return parseFloat(this.obtenerValorTexto(metrica.valor));
  }


  // Botón signos vitales
  verSignosVitales(paciente: UserPaciente): void {

    const nuevaVentana = window.open(
      `/signos-vitales/${paciente.idPaciente}`,
      `${paciente.idPaciente}`,
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


  toggleSignosVitales(
    event: MouseEvent,
    paciente: UserPaciente
  ): void {

    event.stopPropagation();
    this.verSignosVitales(paciente);
  }

}
