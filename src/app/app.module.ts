
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Componentes compartidos
import { InicioComponent } from './shared/inicio/inicio.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';

// Portal Médico
import { IngresoMedicoComponent } from './medico/ingreso-medico/ingreso-medico.component';
import { PaginaMedicoComponent } from './medico/pagina-medico/pagina-medico.component';
import { RegistroMedicoComponent } from './medico/registro-medico/registro-medico.component';
import { HomeMedicoComponent } from './medico/contenido-pagina/home-medico/home-medico.component';
import { MapaComponent } from './medico/contenido-pagina/mapa/mapa.component';

// Registro de pacientes realizado por el médico
import { RegistroPacienteComponent } from './paciente/registro-paciente/registro-paciente.component';

// Historial clínico y signos vitales
import { AddFavsComponent } from './favoritos/add-favs/add-favs.component';
import { HistorialClinicoComponent } from './favoritos/historial-clinico/historial-clinico.component';
import { SignosVitalesComponent } from './favoritos/signos-vitales/signos-vitales.component';
import { FavService } from './favoritos/fav.service';

// Servicios
import { SharedService } from './servicios/shared.service';

// Módulos y dependencias
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFirestore, AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';

import { environment } from './firebase/firebase-config/firebase-config.module';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

@NgModule({
  declarations: [
    AppComponent,

    // Compartidos
    InicioComponent,
    NavbarComponent,
    FooterComponent,

    // Médico
    IngresoMedicoComponent,
    PaginaMedicoComponent,
    RegistroMedicoComponent,
    HomeMedicoComponent,
    MapaComponent,

    // Registro de pacientes
    RegistroPacienteComponent,

    // Funciones clínicas
    AddFavsComponent,
    HistorialClinicoComponent,
    SignosVitalesComponent
  ],

  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleMapsModule,

    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireDatabaseModule
  ],

  providers: [
    FavService,
    SharedService,
    AngularFirestore,
    provideCharts(withDefaultRegisterables())
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
