export interface UserProfesional {
    idProfesional?: number;
    nombre: string;
    apellido: string;
    dni: number;
    fechaNacimiento: number;
    sexo: string;
    email: string;
    telefono: number;
    contrasena?: string;
    perfil: string;
  }
export interface UserPaciente {
  id: any;
  alta: boolean;
  idPaciente: number;
  nombre: string;
  apellido: string;
  dni: number;
  fechaNacimiento: string;
  sexo: string;
  telefono: number;
  tieneObraSocial: boolean;
  nombreObraSocial?: string;
  email: string;
  observaciones?: string;
  metricas?: Metrica[];
  conexion?: RegistroAltaBaja;
  edad?: number;
  medico?: UserProfesional[];
}
  
  export interface RegistroAltaBaja  {
    idProfesional:number;
    idPaciente:number;
    fechaAlta: string;
    fechaBaja: string;
    motivo:string;
    metrica?: Metrica;  
  }
 
export interface Metrica {
  idMetrica: number;
  idPaciente: number;
  signoVital: string;
  valor: string | number;
  fecha: string | Date;
  obs: string;
  paciente?: UserPaciente;
  ubicacion?: string;
}

  export interface ProfesionalData {
    apellido: string;
    nombre: string;
  }
  