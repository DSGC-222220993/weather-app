# Weather Con Consumo De Apis Reales

Esta practica es una aplicación web de clima desarrollada con Angular que permite consultar el estado del tiempo en cualquier ciudad del mundo utilizando la API real de OpenWeatherMap.

La aplicación muestra información meteorológica en tiempo real, incluyendo temperatura actual, sensación térmica, humedad, velocidad del viento y pronóstico extendido de 5 días. Además, integra funcionalidades modernas como autocompletado de ciudades, favoritos persistentes y cache de búsquedas recientes para mejorar la experiencia del usuario.

## Funcionalidades

- Búsqueda de ciudades en tiempo real

- Autocompletado inteligente utilizando la API Geocoding de OpenWeatherMap

- Consulta del clima actual:
  
    -Temperatura actual
    -Sensación térmica
    -Humedad
    -Velocidad del viento
    -Presión atmosférica
    -Visibilidad
    -Ícono dinámico según el clima

- Pronóstico extendido de 5 días

- Pronóstico por horas para el día actual

- Sistema de favoritos:
  
    Persistencia usando LocalStorage

- Cache de búsquedas recientes para mejorar rendimiento

- Manejo de errores

- Loading states con spinner durante las peticiones HTTP

- Interceptor HTTP para logging basico de solicitudes

- Pipe personalizado para conversión de Kelvin a Celsius

- Interfaz responsive adaptable a diferentes tamaños de pantalla


## Tecnologías utilizadas

- Angular
- TypeScript
- RxJS
- Angular HttpClient
- Angular Pipes
- Angular Interceptors
- CSS3
- OpenWeatherMap API
- LocalStorage


## Notas

- Para que el proyecto funcione correctamente es necesario contar con una API Key válida de OpenWeatherMap

- Los íconos del clima son cargados directamente desde OpenWeatherMap

- Las imágenes de favoritos utilizadas en la interfaz deben existir en la carpeta: public/imagenes/

- La aplicación está desarrollada únicamente para fines académicos y demostrativos

## Preparación del entorno

- Antes de empezar, asegúrate de tener instalado Node.js (versión 18 o superior).
- Angular CLI instalada de forma global:
npm install -g @angular/cli

- Ejecutar servidor del desarrollo
ng serve

- Acceder a la app
Abre tu navegador en http://localhost:4200/.
