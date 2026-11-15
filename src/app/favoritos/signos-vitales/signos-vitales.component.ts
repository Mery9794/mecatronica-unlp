import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Metrica, UserPaciente } from '../../models';
import { ActivatedRoute } from '@angular/router';
import { FavService } from '../fav.service';
import { Subscription } from 'rxjs';
import { ChartOptions, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-signos-vitales',
  templateUrl: './signos-vitales.component.html',
  styleUrls: ['./signos-vitales.component.css']
})
export class SignosVitalesComponent implements OnInit, OnDestroy {

  @Input() paciente: UserPaciente | undefined;

  historialClinico: Metrica[] = [];
  loading = true;

  selectedIcon = 'Temperatura';

  currentTemperature: number | string = 'N/A';
  currentSystolicPressure: number | string = 'N/A';
  currentDiastolicPressure: number | string = 'N/A';
  currentOxygen: number | string = 'N/A';

  days: string[] = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  currentDate: Date = new Date();
  currentIndex = 0;

  showChart = false;

  chartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  chartLegend = true;
  chartType: ChartType = 'line';

  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private favService: FavService
  ) { }

  ngOnInit(): void {
    const routeSub = this.route.params.subscribe(params => {
      const pacienteId = Number(params['id']);

      if (!pacienteId) {
        console.error('No se recibió un ID de paciente válido.');
        this.loading = false;
        return;
      }

      this.loadPaciente(pacienteId);
      this.loadHistorialClinico(pacienteId);
    });

    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private obtenerTiempo(fecha: string | Date): number {
    const tiempo = new Date(fecha).getTime();
    return Number.isFinite(tiempo) ? tiempo : 0;
  }

  private obtenerUltimaMetrica(signo: string): Metrica | undefined {
    return this.historialClinico
      .filter(m => m.signoVital === signo)
      .sort((a, b) => this.obtenerTiempo(b.fecha) - this.obtenerTiempo(a.fecha))[0];
  }

  private obtenerValorNumerico(valor: string | number): number {
    return parseFloat(String(valor));
  }

  loadPaciente(id: number): void {
    const pacienteSub = this.favService.getPacienteById(id).subscribe({
      next: paciente => {
        if (paciente) {
          this.paciente = paciente;
        }
      },
      error: error => {
        console.error('Error al obtener el paciente:', error);
      }
    });

    this.subscriptions.add(pacienteSub);
  }

  loadHistorialClinico(idPaciente: number): void {
    this.loading = true;

    this.favService.getHistorialClinico(idPaciente)
      .then(historial => {
        this.historialClinico = (historial || []).sort(
          (a, b) => this.obtenerTiempo(b.fecha) - this.obtenerTiempo(a.fecha)
        );

        this.loading = false;
        this.updateCurrentMetrics();

        if (this.showChart) {
          this.loadChart(this.selectedIcon);
        }

        console.log('Historial de signos vitales:', this.historialClinico);
      })
      .catch(error => {
        console.error('Error al cargar historial clínico:', error);
        this.historialClinico = [];
        this.loading = false;
        this.updateCurrentMetrics();
      });
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.updateCurrentMetrics();

    if (this.showChart) {
      this.loadChart(icon);
    }
  }

  getButtonClass(icon: string): string {
    const metrica = this.obtenerUltimaMetrica(icon);

    if (!metrica) {
      return 'no-data';
    }

    const valor = String(metrica.valor);

    switch (icon) {
      case 'Temperatura': {
        const temperatura = this.obtenerValorNumerico(metrica.valor);

        if (!Number.isFinite(temperatura)) return 'no-data';
        if (temperatura >= 39.9) return 'danger';
        if (temperatura >= 37.5) return 'warning';
        if (temperatura >= 37) return 'normal';
        return 'warning-low';
      }

      case 'Presión Arterial': {
        const [sistolica, diastolica] = valor.split('/').map(Number);

        if (!Number.isFinite(sistolica) || !Number.isFinite(diastolica)) {
          return 'no-data';
        }

        if (sistolica >= 140 || diastolica >= 90) return 'danger';
        if (sistolica >= 130 || diastolica >= 80) return 'warning';
        if (sistolica < 90 || diastolica < 60) return 'warning-low';
        return 'normal';
      }

      case 'Oxígeno': {
        const oxigeno = this.obtenerValorNumerico(metrica.valor);

        if (!Number.isFinite(oxigeno)) return 'no-data';
        if (oxigeno < 90) return 'danger';
        if (oxigeno < 95) return 'warning';
        return 'normal';
      }

      default:
        return 'no-data';
    }
  }

  // Devuelve la última medición del signo vital para ese día de la semana actual.
  getMetricValue(day: string, metricType: string): number | string {
    const diasSemana: { [key: string]: number } = {
      'LUN': 0,
      'MAR': 1,
      'MIÉ': 2,
      'JUE': 3,
      'VIE': 4,
      'SÁB': 5,
      'DOM': 6
    };

    const indiceDia = diasSemana[day];

    if (indiceDia === undefined) {
      return 'N/A';
    }

    // Calcular el lunes de la semana que contiene currentDate.
    const hoy = new Date(this.currentDate);
    hoy.setHours(0, 0, 0, 0);

    const lunes = new Date(hoy);
    const diferencia = (hoy.getDay() + 6) % 7;
    lunes.setDate(hoy.getDate() - diferencia);

    // Calcular la fecha local del día solicitado.
    const fechaBuscada = new Date(lunes);
    fechaBuscada.setDate(lunes.getDate() + indiceDia);

    const metrica = this.historialClinico
      .filter(m => {
        const fecha = new Date(m.fecha);

        if (isNaN(fecha.getTime())) {
          return false;
        }

        return (
          m.signoVital === metricType &&
          fecha.getFullYear() === fechaBuscada.getFullYear() &&
          fecha.getMonth() === fechaBuscada.getMonth() &&
          fecha.getDate() === fechaBuscada.getDate()
        );
      })
      .sort((a, b) => this.obtenerTiempo(b.fecha) - this.obtenerTiempo(a.fecha))[0];

    return metrica ? String(metrica.valor) : 'N/A';
  }

  updateCurrentMetrics(): void {
    this.currentTemperature = 'N/A';
    this.currentSystolicPressure = 'N/A';
    this.currentDiastolicPressure = 'N/A';
    this.currentOxygen = 'N/A';

    const temperatura = this.obtenerUltimaMetrica('Temperatura');

    if (temperatura) {
      const valor = this.obtenerValorNumerico(temperatura.valor);
      this.currentTemperature = Number.isFinite(valor) ? valor : 'N/A';
    }

    const presion = this.obtenerUltimaMetrica('Presión Arterial');

    if (presion) {
      const [sistolica, diastolica] = String(presion.valor)
        .split('/')
        .map(Number);

      if (Number.isFinite(sistolica) && Number.isFinite(diastolica)) {
        this.currentSystolicPressure = sistolica;
        this.currentDiastolicPressure = diastolica;
      }
    }

    const oxigeno = this.obtenerUltimaMetrica('Oxígeno');

    if (oxigeno) {
      const valor = this.obtenerValorNumerico(oxigeno.valor);
      this.currentOxygen = Number.isFinite(valor) ? valor : 'N/A';
    }
  }

  getCurrentDay(): string {
    return this.currentDate
      .toLocaleDateString('es-ES', { weekday: 'short' })
      .replace('.', '')
      .toUpperCase();
  }

  prevDay(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  nextDay(): void {
    if (this.currentIndex < this.days.length - 3) {
      this.currentIndex++;
    }
  }

  loadChart(metricType: string): void {
    this.showChart = true;

    const registros = this.historialClinico
      .filter(m => m.signoVital === metricType)
      .sort((a, b) => this.obtenerTiempo(a.fecha) - this.obtenerTiempo(b.fecha));

    const datos = registros
      .map(m => ({
        x: new Date(m.fecha).toLocaleString('es-AR'),
        y: this.obtenerValorNumerico(m.valor)
      }))
      .filter(d => Number.isFinite(d.y));

    this.chartData = {
      labels: datos.map(d => d.x),
      datasets: [{
        data: datos.map(d => d.y),
        label: metricType,
        tension: 0.3
      }]
    };
  }

  toggleChart(): void {
    this.showChart = !this.showChart;

    if (this.showChart) {
      this.loadChart(this.selectedIcon);
    }
  }

  getSystolicPressure(day: string): number {
    const value = this.getMetricValue(day, 'Presión Arterial');

    if (value === 'N/A') return 0;

    const [sistolica] = String(value).split('/').map(Number);
    return Number.isFinite(sistolica) ? sistolica : 0;
  }

  getDiastolicPressure(day: string): number {
    const value = this.getMetricValue(day, 'Presión Arterial');

    if (value === 'N/A') return 0;

    const [, diastolica] = String(value).split('/').map(Number);
    return Number.isFinite(diastolica) ? diastolica : 0;
  }
}
