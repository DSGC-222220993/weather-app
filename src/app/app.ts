import { Component } from '@angular/core';
import { WeatherService } from './services/weather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KelvinToCelsiusPipe } from './pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, KelvinToCelsiusPipe],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {

  city: string = '';
  weatherData: any = null;
  forecastData: any = null;
  loading = false;
  error = '';

  cache: { [key: string]: any } = {};
  recentSearches: string[] = [];

  suggestions: any[] = [];

  constructor(private weatherService: WeatherService) {}

  // BUSCAR CLIMA
  searchWeather(cityParam?: string) {
    const city = (cityParam || this.city).trim().toLowerCase();
    if (!city) return;

    this.city = city;
    this.error = '';
    this.suggestions = [];

    if (this.cache[city]) {
      this.loading = false;
      this.weatherData = this.cache[city].weather;
      this.forecastData = this.cache[city].forecast;
      this.addToRecent(city);
      return;
    }

    this.loading = true;
    this.weatherData = null;
    this.forecastData = null;

    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        this.weatherData = data;

        this.weatherService.getForecast(city).subscribe({
          next: (forecast) => {
            this.forecastData = forecast;

            this.cache[city] = {
              weather: data,
              forecast: forecast
            };

            this.addToRecent(city);
            this.loading = false;
          },
          error: () => {
            this.error = 'Error al obtener pronóstico';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err.status === 404 
          ? 'Ciudad no encontrada' 
          : 'Error de conexión';
        this.loading = false;
      }
    });
  }

  // AUTOCOMPLETE 
  onInputChange() {
    const value = this.city.trim();

    if (!value) {
      this.suggestions = [];
      return;
    }

    this.weatherService.searchCities(value).subscribe({
      next: (data) => {
        this.suggestions = this.filterSuggestions(data, value);
      },
      error: () => {
        this.suggestions = [];
      }
    });
  }

  private filterSuggestions(data: any[], query: string) {
    const q = query.toLowerCase();
    const filtered = data.filter(item => {
      const name = item.name?.toLowerCase() ?? '';
      const state = item.state?.toLowerCase() ?? '';
      const country = item.country?.toLowerCase() ?? '';

      return name.startsWith(q) || state.startsWith(q) || country.startsWith(q);
    });

    return filtered.length ? filtered : data;
  }

  // SELECCIONAR SUGERENCIA
  selectSuggestion(item: any) {
    const cityName = item.state
      ? `${item.name}, ${item.state}, ${item.country}`
      : `${item.name}, ${item.country}`;

    this.city = cityName;
    this.searchWeather(cityName);
  }

  addToRecent(city: string) {
    this.recentSearches = this.recentSearches.filter(c => c !== city);
    this.recentSearches.unshift(city);

    if (this.recentSearches.length > 5) {
      this.recentSearches.pop();
    }
  }
}