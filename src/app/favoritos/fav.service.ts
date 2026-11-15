
import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireAuth } from '@angular/fire/compat/auth';

import { Metrica, UserPaciente, UserProfesional } from '../models';

import { Observable, from } from 'rxjs';
import { map, switchMap, filter, take } from 'rxjs/operators';

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FavService {

  private signosVitales = [
    'Temperatura',
    'Presión Arterial',
    'Oxígeno'
  ];

  constructor(
    private afs: AngularFirestore,
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth
  ) { }

  // Convertir fecha a número para ordenar los registros
  private obtenerTiempo(fecha: string | Date): number {
    return new Date(fecha).getTime();
  }

  // Obtener la última medición de cada signo vital
  async getMetricasPaciente(idPaciente: number): Promise<Metrica[]> {

    let metricasTotales: Metrica[] = [];

    try {
      for (const signo of this.signosVitales) {

        const registrosCollection = collection(
          this.afs.firestore,
          `Usuario: Pacientes/${idPaciente}/Metricas/${signo}/Registros`
        );

        const q = query(
          registrosCollection,
          orderBy('fecha', 'desc'),
          limit(1)
        );

        const registrosSnapshot = await getDocs(q);

        const registros = registrosSnapshot.docs.map(
          documento => documento.data() as Metrica
        );

        metricasTotales.push(...registros);
      }

      metricasTotales.sort(
        (a, b) => this.obtenerTiempo(b.fecha) - this.obtenerTiempo(a.fecha)
      );

      console.log(
        `Últimas métricas del paciente ${idPaciente}:`,
        metricasTotales
      );

      return metricasTotales;

    } catch (error) {
      console.error('Error al obtener métricas:', error);
      return [];
    }
  }

  // Obtener todo el historial clínico del paciente
  async getHistorialClinico(idPaciente: number): Promise<Metrica[]> {

    let historial: Metrica[] = [];

    try {
      for (const signo of this.signosVitales) {

        const registrosCollection = collection(
          this.afs.firestore,
          `Usuario: Pacientes/${idPaciente}/Metricas/${signo}/Registros`
        );

        const q = query(
          registrosCollection,
          orderBy('fecha', 'asc')
        );

        const registrosSnapshot = await getDocs(q);

        const registros = registrosSnapshot.docs.map(
          documento => documento.data() as Metrica
        );

        historial.push(...registros);
      }

      // Ordenar todos los signos vitales cronológicamente
      historial.sort(
        (a, b) => this.obtenerTiempo(a.fecha) - this.obtenerTiempo(b.fecha)
      );

      console.log(
        `Historial clínico del paciente ${idPaciente}:`,
        historial
      );

      return historial;

    } catch (error) {
      console.error('Error obteniendo historial clínico:', error);
      return [];
    }
  }

  // Agregar o actualizar una medición
  async actualizarMetrica(
    metrica: Metrica,
    idPaciente: number
  ): Promise<void> {

    try {
      const fechaDocumento = metrica.fecha instanceof Date
        ? metrica.fecha.toISOString()
        : String(metrica.fecha);

      const metricaRef = doc(
        this.afs.firestore,
        `Usuario: Pacientes/${idPaciente}/Metricas/${metrica.signoVital}/Registros/${fechaDocumento}`
      );

      await setDoc(metricaRef, {
        ...metrica,
        idPaciente: idPaciente
      }, { merge: true });

      console.log('Métrica guardada correctamente:', metrica);

    } catch (error) {
      console.error('Error al guardar la métrica:', error);
      throw error;
    }
  }

  // Obtener pacientes del médico autenticado
  getAllPacientes(idProfesional: number): Observable<UserPaciente[]> {

    return this.afAuth.user.pipe(
      filter(user => user !== null),
      take(1),

      switchMap(user => {

        if (!user) {
          return from(Promise.resolve([] as UserPaciente[]));
        }

        console.log('UID del médico autenticado:', user.uid);
        console.log('ID del profesional:', idProfesional);

        const userRef = collection(
          this.afs.firestore,
          'Usuario: Pacientes'
        );

        const queryRef = query(
          userRef,
          where('idProfesional', '==', idProfesional),
          where('uidProfesional', '==', user.uid)
        );

        return from(getDocs(queryRef)).pipe(
          map(querySnapshot => {

            const pacientes: UserPaciente[] = [];

            querySnapshot.forEach(documento => {
              pacientes.push(documento.data() as UserPaciente);
            });

            console.log('Cantidad de pacientes:', pacientes.length);
            console.log('Pacientes obtenidos:', pacientes);

            return pacientes;
          })
        );
      })
    );
  }

  // Obtener paciente por ID
  getPacienteById(id: number): Observable<UserPaciente | undefined> {

    return this.afs
      .collection<UserPaciente>('Usuario: Pacientes')
      .doc(`${id}`)
      .valueChanges();
  }

  // Actualizar información del paciente
  actualizarPaciente(paciente: UserPaciente): Promise<void> {

    return this.afs
      .collection<UserPaciente>('Usuario: Pacientes')
      .doc(`${paciente.idPaciente}`)
      .update(paciente);
  }

  // Obtener profesionales
  getAllProfesionales(): Observable<UserProfesional[]> {

    const userRef = collection(
      this.afs.firestore,
      'Usuario: Profesionales'
    );

    return from(getDocs(userRef)).pipe(
      map(querySnapshot => {

        const medicos: UserProfesional[] = [];

        querySnapshot.forEach(documento => {
          medicos.push(documento.data() as UserProfesional);
        });

        return medicos;
      })
    );
  }

  // Obtener total de médicos
  getTotalMedicos(): Observable<number> {

    return this.afs
      .collection('Usuario: Profesionales')
      .valueChanges()
      .pipe(
        map((medicos: any[]) => medicos.length)
      );
  }

  // Dar de baja profesional
  darDeBajaProfesional(medico: UserProfesional): void {

    this.db
      .object(`profesionales/${medico.idProfesional}`)
      .update({ estado: 'inactivo' });

    this.db.list('registrosBajas').push({
      medicoId: medico.idProfesional,
      motivo: 'Sin motivo',
      fecha: new Date().toISOString()
    });
  }
}
