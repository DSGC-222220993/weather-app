import { Component } from '@angular/core';
import { WeatherService } from './services/weather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {

  city: string = '';
  weatherData: any = null;
  forecastData: any = null;
  loading = false;
  error = '';

  constructor(private weatherService: WeatherService) {}

  searchWeather() {
    if (!this.city) return;

    this.loading = true;
    this.error = '';
    this.weatherData = null;
    this.forecastData = null;

    this.weatherService.getWeather(this.city).subscribe({
      next: (data) => {
        this.weatherData = data;
      },
      error: () => {
        this.error = 'Ciudad no encontrada';
        this.loading = false;
      }
    });

    this.weatherService.getForecast(this.city).subscribe({
      next: (data) => {
        this.forecastData = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al obtener pronóstico';
        this.loading = false;
      }
    });
  }
}