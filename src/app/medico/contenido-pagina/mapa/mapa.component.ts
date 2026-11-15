
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MapInfoWindow } from '@angular/google-maps';
import { environment } from '../../../../environments/environment';
import { Subscription, combineLatest } from 'rxjs';

interface RegistroMetrica {
  idPaciente: number;
  idMetrica?: number;
  signoVital: string;
  valor: string | number;
  fecha: string | Date;
  obs?: string;
  ubicacion: string;
}

interface DatosPaciente {
  idPaciente: number;
  nombre: string;
  apellido: string;
}

interface Marcador {
  position: google.maps.LatLngLiteral;
  title: string;
  patientData: DatosPaciente;
  latestMetrics: {
    name: string;
    value: string | number;
    fecha?: string | Date;
  }[];
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit, OnDestroy {

  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  apiLoaded: Promise<boolean>;

  center: google.maps.LatLngLiteral = {
    lat: -36.170487,
    lng: -67.9903073
  };

  zoom = 6;
  markers: Marcador[] = [];
  infoContent = '';

  private subscriptions: Subscription[] = [];

  private signosVitales = [
    'Temperatura',
    'Presión Arterial',
    'Oxígeno'
  ];

  constructor(private firestore: AngularFirestore) {

    this.apiLoaded = new Promise((resolve) => {
      const apiKey = environment.googleMapsApiKey;

      if (!apiKey) {
        console.error('No se configuró la clave de Google Maps.');
        resolve(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve(true);

      script.onerror = () => {
        console.error('Error al cargar Google Maps API');
        resolve(false);
      };

      document.head.appendChild(script);
    });
  }

  ngOnInit(): void {
    this.getPacientes();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getPacientes(): void {

    const pacientesSub = this.firestore
      .collection<DatosPaciente>('Usuario: Pacientes')
      .snapshotChanges()
      .subscribe({
        next: (snapshot) => {

          this.markers = [];

          snapshot.forEach((documento) => {

            const paciente = documento.payload.doc.data() as DatosPaciente;
            const idPaciente = documento.payload.doc.id;

            const consultas = this.signosVitales.map(signo => {
              return this.firestore
                .collection<RegistroMetrica>(
                  `Usuario: Pacientes/${idPaciente}/Metricas/${signo}/Registros`
                )
                .valueChanges();
            });

            const registrosSub = combineLatest(consultas).subscribe({
              next: (resultados) => {

                const registros = resultados.flat();

                this.crearMarcador(paciente, registros);
              },
              error: (error) => {
                console.error(
                  `Error al obtener mediciones del paciente ${idPaciente}:`,
                  error
                );
              }
            });

            this.subscriptions.push(registrosSub);
          });
        },
        error: (error) => {
          console.error('Error al obtener pacientes:', error);
        }
      });

    this.subscriptions.push(pacientesSub);
  }

  private crearMarcador(
    paciente: DatosPaciente,
    registros: RegistroMetrica[]
  ): void {

    const registrosOrdenados = [...registros].sort(
      (a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    const registroConUbicacion = registrosOrdenados.find(registro => {
      return this.obtenerCoordenadas(registro.ubicacion) !== null;
    });

    if (!registroConUbicacion) {
      this.markers = this.markers.filter(
        marker => marker.patientData.idPaciente !== paciente.idPaciente
      );
      return;
    }

    const coordenadas = this.obtenerCoordenadas(
      registroConUbicacion.ubicacion
    );

    if (!coordenadas) return;

    const latestMetrics = this.signosVitales.map(signo => {

      const registro = registrosOrdenados.find(
        item => item.signoVital === signo
      );

      return {
        name: signo,
        value: registro?.valor ?? 'N/A',
        fecha: registro?.fecha
      };
    });

    const marcador: Marcador = {
      position: coordenadas,
      title: `${paciente.nombre} ${paciente.apellido}`,
      patientData: paciente,
      latestMetrics
    };

    this.markers = [
      ...this.markers.filter(
        marker => marker.patientData.idPaciente !== paciente.idPaciente
      ),
      marcador
    ];
  }

  private obtenerCoordenadas(
    ubicacion: string | undefined
  ): google.maps.LatLngLiteral | null {

    if (!ubicacion) return null;

    const partes = ubicacion.split(',').map(valor => Number(valor.trim()));

    if (partes.length !== 2) return null;

    const [lat, lng] = partes;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return { lat, lng };
  }

  onMarkerClick(marker: Marcador): void {

    const { patientData, latestMetrics } = marker;

    this.infoContent = `
      <strong>Nombre y Apellido:</strong>
      ${patientData.nombre || 'N/A'} ${patientData.apellido || 'N/A'}<br>

      <strong>ID Paciente:</strong>
      ${patientData.idPaciente || 'N/A'}<br><br>

      <strong>Últimas mediciones:</strong><br>

      ${latestMetrics.map(metrica => `
        <strong>${metrica.name}:</strong>
        ${metrica.value}<br>
      `).join('')}
    `;
  }

  closeInfoPanel(): void {
    this.infoContent = '';
  }
}
