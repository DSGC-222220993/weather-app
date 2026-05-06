import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  private apiKey = '04017153b94554614d6fd844f1da6678'; // 👈 
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) {}

  getWeather(city: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}`
    );
  }

  getForecast(city: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}`
    );
  }
}