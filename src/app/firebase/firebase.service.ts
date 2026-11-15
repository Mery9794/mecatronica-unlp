import { Injectable } from '@angular/core';
import { environment } from './firebase-config/firebase-config.module';
import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor() {
    const app = initializeApp(environment.firebaseConfig);

    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported) {
          const analytics = getAnalytics(app);
        } else {
          console.warn('Firebase Analytics no es compatible en este entorno.');
        }
      }).catch((error) => {
        console.error('Error al verificar la compatibilidad con Firebase Analytics:', error);
      });
    } else {
      console.warn('Firebase Analytics no se inicializa en el entorno del servidor.');
    }
  }

}
