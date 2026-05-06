import { Component } from '@angular/core';
import { Subscription, forkJoin } from 'rxjs';
import { WeatherService } from './services/weather';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { KelvinToCelsiusPipe } from './pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, KelvinToCelsiusPipe],
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
  private suggestionTimer: number | null = null;
  private suggestionSubscription: Subscription | null = null;

  activeTab: 'weather' | 'cities' = 'weather';
  citiesLoading = false;

  topCities = [
    { query: 'Barcelona, ES', label: 'Barcelona, Spain' },
    { query: 'San Francisco, US', label: 'San Francisco, USA' },
    { query: 'Lisbon, PT', label: 'Lisbon, Portugal' },
    { query: 'Sydney, AU', label: 'Sydney, Australia' },
    { query: 'Cape Town, ZA', label: 'Cape Town, South Africa' },
  ];

  topCitiesWeather: any[] = [];

  constructor(private weatherService: WeatherService) {}

  setActiveTab(tab: 'weather' | 'cities') {
    this.activeTab = tab;
    if (tab === 'cities' && !this.topCitiesWeather.length) {
      this.loadTopCities();
    }
  }

  private loadTopCities() {
    this.citiesLoading = true;
    this.topCitiesWeather = this.topCities.map(city => ({
      label: city.label,
      loading: true,
      query: city.query,
    }));

    let finished = 0;
    const checkpoint = () => {
      finished += 1;
      if (finished === this.topCities.length) {
        this.citiesLoading = false;
      }
    };

    this.topCities.forEach((city, index) => {
      this.weatherService.getWeather(city.query).subscribe({
        next: (data) => {
          this.topCitiesWeather[index] = {
            ...data,
            label: city.label,
            query: city.query,
          };
          checkpoint();
        },
        error: () => {
          this.topCitiesWeather[index] = {
            label: city.label,
            query: city.query,
            error: true,
          };
          checkpoint();
        },
        complete: () => {}
      });
    });
  }

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

    forkJoin({
      weather: this.weatherService.getWeather(city),
      forecast: this.weatherService.getForecast(city)
    }).subscribe({
      next: ({ weather, forecast }) => {
        this.weatherData = weather;
        this.forecastData = forecast;

        this.cache[city] = {
          weather: weather,
          forecast: forecast
        };

        this.addToRecent(city);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.status === 404 
          ? 'Ciudad no encontrada' 
          : 'Error de conexión';
        this.loading = false;
      }
    });
  }

  getIconUrl(icon: string | undefined) {
    if (!icon) {
      return 'https://openweathermap.org/img/wn/01d@2x.png';
    }
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  getDayLabel(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
    });
  }

  formatTime(date: string) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  get todayForecast() {
    if (!this.forecastData?.list?.length) {
      return [];
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayItems = this.forecastData.list.filter((item: any) => item.dt_txt.startsWith(todayKey));
    const targetTimes = ['06:00:00', '09:00:00', '12:00:00', '15:00:00', '18:00:00', '21:00:00'];

    return targetTimes.map((time) => {
      return (
        todayItems.find((item: any) => item.dt_txt.endsWith(time)) ||
        todayItems.find((item: any) => item.dt_txt.includes('12:00:00')) ||
        todayItems[0]
      );
    }).filter(Boolean);
  }

  get dailyForecasts() {
    if (!this.forecastData?.list?.length) {
      return [];
    }

    const groups: Record<string, any[]> = {};
    this.forecastData.list.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0];
      groups[date] = groups[date] || [];
      groups[date].push(item);
    });

    return Object.keys(groups).slice(0, 5).map((date) => {
      const dayItems = groups[date];
      const highlight = dayItems.find((item) => item.dt_txt.includes('12:00:00')) || dayItems[Math.floor(dayItems.length / 2)];
      const minTemp = Math.min(...dayItems.map((item: any) => item.main.temp_min));
      const maxTemp = Math.max(...dayItems.map((item: any) => item.main.temp_max));

      return {
        date,
        icon: highlight.weather[0]?.icon,
        desc: highlight.weather[0]?.main,
        temp: highlight.main.temp,
        min: minTemp,
        max: maxTemp,
      };
    });
  }

  // AUTOCOMPLETE 
  onInputChange() {
    const value = this.city.trim();

    if (!value) {
      this.suggestions = [];
      this.clearSuggestionQuery();
      return;
    }

    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
    }

    this.suggestionTimer = window.setTimeout(() => {
      this.loadSuggestions(value);
    }, 250);
  }

  private loadSuggestions(value: string) {
    if (this.suggestionSubscription) {
      this.suggestionSubscription.unsubscribe();
      this.suggestionSubscription = null;
    }

    this.suggestionSubscription = this.weatherService.searchCities(value).subscribe({
      next: (data) => {
        const filtered = this.filterSuggestions(data, value);
        this.suggestions = this.sortSuggestions(filtered, value);
      },
      error: () => {
        this.suggestions = [];
      }
    });
  }

  private clearSuggestionQuery() {
    if (this.suggestionTimer) {
      clearTimeout(this.suggestionTimer);
      this.suggestionTimer = null;
    }

    if (this.suggestionSubscription) {
      this.suggestionSubscription.unsubscribe();
      this.suggestionSubscription = null;
    }
  }

  private filterSuggestions(data: any[], query: string) {
    const q = query.toLowerCase();

    const exactPrefix = data.filter(item => {
      const matchKeys = this.getSuggestionKeys(item);
      return matchKeys.some(key => key.startsWith(q));
    });

    if (exactPrefix.length) {
      return exactPrefix;
    }

    return data.filter(item => {
      const matchKeys = this.getSuggestionKeys(item);
      return matchKeys.some(key => key.includes(q));
    });
  }

  private getSuggestionKeys(item: any) {
    const keys = [] as string[];
    const name = item.name?.toLowerCase() ?? '';
    const state = item.state?.toLowerCase() ?? '';
    const country = item.country?.toLowerCase() ?? '';

    keys.push(name, state, country);
    Object.values(item.local_names ?? {}).forEach((value: any) => {
      if (typeof value === 'string') {
        keys.push(value.toLowerCase());
      }
    });

    return keys;
  }

  private sortSuggestions(data: any[], query: string) {
    const q = query.toLowerCase();
    return [...data].sort((a, b) => {
      const aScore = this.suggestionScore(a, q);
      const bScore = this.suggestionScore(b, q);
      return aScore - bScore;
    });
  }

  private suggestionScore(item: any, query: string) {
    const keys = this.getSuggestionKeys(item);
    if (keys.some(key => key.startsWith(query))) {
      return 0;
    }
    if (keys.some(key => key.includes(` ${query}`))) {
      return 1;
    }
    return 2;
  }

  getDisplayName(item: any) {
    const localName = item.local_names?.es || item.local_names?.en || item.name;
    return item.state
      ? `${localName}, ${item.state}, ${item.country}`
      : `${localName}, ${item.country}`;
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

  viewCityWeather(cityQuery: string) {
    this.setActiveTab('weather');
    this.searchWeather(cityQuery);
  }
}