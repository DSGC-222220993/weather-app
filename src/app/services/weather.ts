import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiKey = '04017153b94554614d6fd844f1da6678';
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private geoUrl = 'https://api.openweathermap.org/geo/1.0';

  constructor(private http: HttpClient) {}

  getWeather(city: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  getForecast(city: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}`
    ).pipe(catchError(err => throwError(() => err)));
  }

  // 🔥 NUEVO: AUTOCOMPLETE REAL
  searchCities(query: string): Observable<any> {
    return this.http.get(
      `${this.geoUrl}/direct?q=${query}&limit=5&appid=${this.apiKey}`
    ).pipe(catchError(err => throwError(() => err)));
  }
}