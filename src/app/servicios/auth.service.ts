import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { RegistroAltaBaja, Metrica, ProfesionalData } from '../models';
import { collection, addDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private afs: AngularFirestore, private auth: AngularFireAuth) { }

  getProfesionalData(idProfesional: string): Observable<ProfesionalData | null> {
    return this.afs.doc(`Usuario: Profesionales/${idProfesional}`)
      .get()
      .pipe(
        map(snapshot => {
          if (snapshot.exists) {
            return snapshot.data() as ProfesionalData;
          }
          return null;
        }),
        catchError(error => {
          console.error('Error al obtener datos del profesional:', error);
          return of(null);
        })
      );
  }

  getUserProfesionalId(): Observable<number | null> {
    return this.auth.authState.pipe(
      switchMap(user => {

        if (!user) {
          console.warn('Firebase todavía no tiene un usuario autenticado.');
          return of(null);
        }

        console.log('Usuario autenticado:', user.uid);

        return this.getProfesionalIdByUid(user.uid);
      }),
      catchError(error => {
        console.error('Error al recuperar el profesional:', error);
        return of(null);
      })
    );
  }
  getProfesionalIdByUid(uid: string): Observable<number | null> {
    return this.afs.collection('Usuario: Profesionales',
      ref => ref.where('uid', '==', uid)
    ).valueChanges().pipe(
      map((profesionales: any[]) => {
        if (profesionales.length > 0) {
          const id = Number(profesionales[0].idProfesional);
          console.log('ID Profesional encontrado:', id);
          return id;
        }

        console.error('No se encontró un profesional asociado a este UID.');
        return null;
      }),
      catchError(error => {
        console.error('Error al obtener el ID del profesional:', error);
        return throwError(() => error);
      })
    );
  }


  async vicuPacienteMedico(registro: RegistroAltaBaja): Promise<void> {
    try {
      const registroRef = collection(this.afs.firestore, `Usuario: Pacientes/${registro.idPaciente}/RegistroAltaBaja`);
      await addDoc(registroRef, registro);
      console.log(' Registro de alta/baja agregado exitosamente:', registro);
    } catch (error) {
      console.error(' Error al agregar el registro de alta/baja:', error);
      throw error;
    }
  }


  async addMetrica(idPaciente: number, metrica: Metrica): Promise<void> {
    try {
      const metricasRef = collection(this.afs.firestore, `Usuario: Pacientes/${idPaciente}/Metricas`);
      await addDoc(metricasRef, metrica);
      console.log('Métrica agregada exitosamente:', metrica);
    } catch (error) {
      console.error('Error al agregar métrica:', error);
      throw error;
    }
  }

}
