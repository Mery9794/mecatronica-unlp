# Electromedicina

Electromedicina es una aplicación web desarrollada con Angular y Firebase, diseñada para facilitar la gestión de información médica. Su objetivo es centralizar los datos de pacientes y profesionales de la salud, permitiendo administrar información personal, historiales clínicos y métricas de signos vitales.

## Funcionalidades principales

La aplicación contempla tres sectores principales:

### 1. Sector Médico

Permite a los profesionales de la salud:

- Iniciar sesión mediante autenticación.
- Registrar pacientes.
- Consultar y gestionar su lista de pacientes.
- Visualizar y actualizar información personal de los pacientes.
- Consultar historiales clínicos.
- Registrar y consultar métricas de signos vitales.
- Gestionar observaciones generales de los pacientes.
- Consultar la ubicación de los pacientes mediante un mapa.

### 2. Sector Paciente

Sector destinado a permitir que los pacientes consulten su información médica y los datos registrados en el sistema. Su implementación y funcionalidades se encuentran sujetas al desarrollo del proyecto.

### 3. Sector Administrador

Sector destinado a la administración general del sistema. Contempla la gestión de profesionales de la salud y pacientes, así como operaciones de alta y baja y visualización de estadísticas generales.

## Tecnologías utilizadas

- **Angular:** desarrollo de la interfaz y lógica de la aplicación.
- **TypeScript:** lenguaje de programación.
- **Firebase Authentication:** autenticación de usuarios.
- **Cloud Firestore:** almacenamiento y sincronización de información.
- **AngularFire:** integración de Firebase con Angular.
- **Google Maps:** visualización de ubicaciones geográficas.

## Servidor de desarrollo

Para iniciar el servidor local, ejecutar:

```bash
ng serve
```

Luego ingresar desde el navegador a:

http://localhost:4200/

La aplicación se recargará automáticamente cuando se realicen cambios en los archivos fuente.

## Construcción del proyecto

Para compilar la aplicación, ejecutar:

```bash
ng build
```

Los archivos generados se almacenarán en el directorio `dist/`, preparados para su posterior despliegue.

## Servicios y componentes implementados

### Autenticación y gestión de datos

El servicio `AuthService` permite:

- Gestionar la autenticación de profesionales.
- Recuperar la información del profesional autenticado.
- Obtener el identificador del profesional asociado a cada cuenta.

### Registro y gestión de pacientes

En el componente `registro-paciente.component.ts` se implementó un formulario para registrar pacientes.

Este formulario permite:

- Validar los datos ingresados.
- Generar identificadores consecutivos para los pacientes.
- Almacenar la información personal.
- Crear las estructuras iniciales para las métricas de signos vitales.
- Vincular cada paciente con el profesional responsable.

### Historial clínico y signos vitales

El sistema permite consultar el historial clínico de cada paciente y acceder a los registros de:

- Temperatura.
- Presión arterial.
- Oxígeno.

También permite consultar y actualizar los datos correspondientes a cada paciente.

### Visualización geográfica

La aplicación incorpora una sección de mapas para visualizar las ubicaciones asociadas a los pacientes registrados.

A futuro, se contempla la integración con dispositivos ESP32 y sensores médicos para incorporar lecturas de signos vitales y datos de ubicación al sistema.

## Almacenamiento de datos en Firebase

El proyecto utiliza Firebase como infraestructura de almacenamiento y autenticación.

Cloud Firestore permite almacenar:

- Información de pacientes.
- Información de profesionales.
- Historiales clínicos.
- Métricas de signos vitales.
- Registros de altas y bajas.

Firebase Authentication gestiona el acceso de los usuarios al sistema.

## Estado del proyecto

Electromedicina se encuentra en desarrollo. Se continúa trabajando en la ampliación de funcionalidades, la integración de nuevos módulos y la incorporación de dispositivos de monitoreo médico.