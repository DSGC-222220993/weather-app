import { Component, OnInit } from '@angular/core';
import { Subject, Observable, of, forkJoin } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap
} from 'rxjs/operators';

import { WeatherService } from './services/weather';
import { FavoritesService } from './services/favorites';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { KelvinToCelsiusPipe } from './pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    KelvinToCelsiusPipe
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {

  city = '';

  weatherData: any = null;

  forecastData: any = null;

  loading = false;

  error = '';

  cache: { [key: string]: any } = {};

  recentSearches: string[] = [];

  suggestions: any[] = [];

  suggestionCache: { [key: string]: any[] } = {};

  private searchSubject = new Subject<string>();

  activeTab: 'weather' | 'cities' = 'weather';

  citiesLoading = false;

  favoriteCities: any[] = [];

  showCityModal = false;

  selectedCityForModal: any = null;

  modalWeatherData: any = null;

  modalForecastData: any = null;

  modalLoading = false;

  currentSearchQuery = '';

  currentSearchItem: any = null;

  initialLoad = true;

  constructor(
    private weatherService: WeatherService,
    public favoritesService: FavoritesService
  ) {}

  ngOnInit() {

    this.loadFavorites();

    this.searchSubject.pipe(

      debounceTime(150),

      distinctUntilChanged(),

      switchMap(value => {

        if (this.suggestionCache[value]) {

          return of(this.suggestionCache[value]);

        }

        return this.weatherService.searchCities(value);

      })

    ).subscribe(data => {

      if (!data?.length) {

        this.suggestions = [];

        return;

      }

      const filtered = this.filterSuggestions(
        data,
        this.city
      );

      const sorted = this.sortSuggestions(
        filtered,
        this.city
      ).slice(0, 5);

      this.suggestions = sorted;

      this.suggestionCache[
        this.city.toLowerCase()
      ] = sorted;

    });

    this.city = 'Hermosillo,mx';

    this.searchWeather(
      'Hermosillo,mx',
      true
    );

  }

  setActiveTab(tab: 'weather' | 'cities') {

    this.activeTab = tab;

    if (tab === 'cities') {

      this.loadFavoriteCities();

    }

  }

  private loadFavorites() {

    this.favoritesService.favorites$.subscribe(() => {

      if (this.activeTab === 'cities') {

        this.loadFavoriteCities();

      }

    });

  }

  private loadFavoriteCities() {

    const favorites =
      this.favoritesService.getFavorites();

    if (!favorites.length) {

      this.favoriteCities = [];

      this.citiesLoading = false;

      return;

    }

    this.citiesLoading = true;

    this.favoriteCities = favorites.map(city => ({
      ...city,
      loading: true,
    }));

    let finished = 0;

    const checkpoint = () => {

      finished++;

      if (finished === favorites.length) {

        this.citiesLoading = false;

      }

    };

    favorites.forEach((city, index) => {

      this.weatherService.getWeather(city.query)
        .subscribe({

          next: (data) => {

            this.favoriteCities[index] = {
              ...data,
              label: city.label,
              query: city.query,
            };

            checkpoint();

          },

          error: () => {

            this.favoriteCities[index] = {
              label: city.label,
              query: city.query,
              error: true,
            };

            checkpoint();

          }

        });

    });

  }

  searchWeather(
    cityParam?: string,
    silent = false
  ) {

    const city = (cityParam || this.city)
      .trim()
      .toLowerCase();

    if (!city) return;

    this.city = city;

    this.currentSearchQuery = city;

    this.error = '';

    this.suggestions = [];

    if (this.cache[city]) {

      this.weatherData =
        this.cache[city].weather;

      this.forecastData =
        this.cache[city].forecast;

      this.loading = false;

      this.addToRecent(city);

      return;

    }

    if (!silent) {

      this.loading = true;

    }

    this.weatherService.getWeather(city)
      .subscribe({

        next: (weather) => {

          this.weatherData = weather;

          this.loading = false;

          this.initialLoad = false;

          this.addToRecent(city);

          this.cache[city] = {
            weather,
            forecast: null
          };

          this.weatherService.getForecast(city)
            .subscribe({

              next: (forecast) => {

                this.forecastData = forecast;

                this.cache[city].forecast =
                  forecast;

              },

              error: () => {

                this.forecastData = null;

              }

            });

        },

        error: (err) => {

          this.loading = false;

          this.initialLoad = false;

          this.error =
            err.status === 404
              ? 'Ciudad no encontrada'
              : 'Error de conexión';

        }

      });

  }

  onInputChange() {

    const value =
      this.city.trim().toLowerCase();

    if (value.length < 2) {

      this.suggestions = [];

      return;

    }

    if (
      value ===
      this.currentSearchQuery.toLowerCase()
    ) {

      return;

    }

    if (this.suggestionCache[value]) {

      this.suggestions =
        this.suggestionCache[value];

      return;

    }

    this.searchSubject.next(value);

  }

  private filterSuggestions(
    data: any[],
    query: string
  ) {

    const q =
      query.toLowerCase().trim();

    const unique = new Map();

    data.forEach(item => {

      const name =
        item.name?.toLowerCase() || '';

      if (!name.startsWith(q)) {

        return;

      }

      const key =
        `${item.name}-${item.country}`;

      if (!unique.has(key)) {

        unique.set(key, item);

      }

    });

    return Array.from(unique.values());

  }

  private sortSuggestions(
    data: any[],
    query: string
  ): any[] {

    const q = query.toLowerCase();

    return data.sort((a, b) => {

      const aName = a.name.toLowerCase();

      const bName = b.name.toLowerCase();

      if (aName === q) return -1;

      if (bName === q) return 1;

      if (
        a.country === 'MX' &&
        b.country !== 'MX'
      ) {

        return -1;

      }

      if (
        a.country !== 'MX' &&
        b.country === 'MX'
      ) {

        return 1;

      }

      return aName.length - bName.length;

    });

  }

  getDisplayName(item: any) {

    const localName =
      item.local_names?.es ||
      item.local_names?.en ||
      item.name;

    return item.state
      ? `${localName}, ${item.state}, ${item.country}`
      : `${localName}, ${item.country}`;

  }

  getItemQuery(item: any): string {

    return item.state
      ? `${item.name}, ${item.state}, ${item.country}`
      : `${item.name}, ${item.country}`;

  }

  selectSuggestion(item: any) {

    const cityName = item.state
      ? `${item.name}, ${item.state}, ${item.country}`
      : `${item.name}, ${item.country}`;

    this.currentSearchQuery = cityName;

    this.currentSearchItem = item;

    this.city = cityName;

    this.searchWeather(cityName);

  }

  getIconUrl(icon: string | undefined) {

    if (!icon) {

      return 'https://openweathermap.org/img/wn/01d@2x.png';

    }

    return `https://openweathermap.org/img/wn/${icon}@2x.png`;

  }

  getDayLabel(date: string) {

    return new Date(date)
      .toLocaleDateString('en-US', {
        weekday: 'short',
      });

  }

  formatTime(date: string) {

    return new Date(date)
      .toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

  }

  get todayForecast() {

    if (!this.forecastData?.list?.length) {

      return [];

    }

    const todayKey =
      new Date().toISOString().slice(0, 10);

    const todayItems =
      this.forecastData.list.filter(
        (item: any) =>
          item.dt_txt.startsWith(todayKey)
      );

    const targetTimes = [
      '06:00:00',
      '09:00:00',
      '12:00:00',
      '15:00:00',
      '18:00:00',
      '21:00:00'
    ];

    return targetTimes.map((time) => {

      return (
        todayItems.find(
          (item: any) =>
            item.dt_txt.endsWith(time)
        ) ||
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

      const date =
        item.dt_txt.split(' ')[0];

      groups[date] =
        groups[date] || [];

      groups[date].push(item);

    });

    return Object.keys(groups)
      .slice(0, 5)
      .map((date) => {

        const dayItems = groups[date];

        const highlight =
          dayItems.find(
            (item) =>
              item.dt_txt.includes('12:00:00')
          ) || dayItems[0];

        return {
          date,
          icon: highlight.weather[0]?.icon,
          desc: highlight.weather[0]?.main,
          temp: highlight.main.temp,
        };

      });

  }

  toggleFavoriteFromSearch() {

    if (
      !this.currentSearchQuery ||
      !this.weatherData
    ) return;

    const displayName =
      `${this.weatherData.name}, ${this.weatherData.sys?.country}`;

    this.favoritesService.toggleFavorite({
      query: this.currentSearchQuery,
      label: displayName,
      name: this.weatherData.name,
    });

  }

  isFavoritedInSearch(): boolean {

    if (!this.currentSearchQuery) {

      return false;

    }

    return this.favoritesService.isFavorite(
      this.currentSearchQuery
    );

  }

  toggleFavoriteCity(
    query: string,
    item: any
  ) {

    const displayName =
      item.label || query;

    this.favoritesService.toggleFavorite({
      query,
      label: displayName,
      name: item.name,
    });

  }

  openCityModal(city: any) {

    this.selectedCityForModal = city;

    this.showCityModal = true;

    this.loadModalWeather(city.query);

  }

  private loadModalWeather(cityQuery: string) {

    this.modalLoading = true;

    forkJoin({
      weather:
        this.weatherService.getWeather(cityQuery),

      forecast:
        this.weatherService.getForecast(cityQuery)
    }).subscribe({

      next: ({ weather, forecast }) => {

        this.modalWeatherData = weather;

        this.modalForecastData = forecast;

        this.modalLoading = false;

      },

      error: () => {

        this.modalLoading = false;

      }

    });

  }

  closeModal() {

    this.showCityModal = false;

    this.selectedCityForModal = null;

    this.modalWeatherData = null;

    this.modalForecastData = null;

  }

  addToRecent(city: string) {

    this.recentSearches =
      this.recentSearches.filter(
        c => c !== city
      );

    this.recentSearches.unshift(city);

    if (this.recentSearches.length > 5) {

      this.recentSearches.pop();

    }

  }

  toggleFavoriteModal() {

    if (!this.selectedCityForModal) return;

    this.favoritesService.toggleFavorite({
      query: this.selectedCityForModal.query,
      label: this.selectedCityForModal.label,
      name: this.selectedCityForModal.name,
    });

    this.loadFavoriteCities();

    if (!this.isFavoriteModal()) {

      this.closeModal();

    }

  }

  isFavoriteModal(): boolean {

    if (!this.selectedCityForModal) {

      return false;

    }

    return this.favoritesService.isFavorite(
      this.selectedCityForModal.query
    );

  }

  getModalTodayForecast() {

    if (!this.modalForecastData?.list?.length) {

      return [];

    }

    const todayKey = new Date()
      .toISOString()
      .slice(0, 10);

    const todayItems =
      this.modalForecastData.list.filter(
        (item: any) =>
          item.dt_txt.startsWith(todayKey)
      );

    const targetTimes = [
      '06:00:00',
      '09:00:00',
      '12:00:00',
      '15:00:00',
      '18:00:00',
      '21:00:00'
    ];

    return targetTimes.map((time) => {

      return (
        todayItems.find(
          (item: any) =>
            item.dt_txt.endsWith(time)
        ) ||

        todayItems.find(
          (item: any) =>
            item.dt_txt.includes('12:00:00')
        ) ||

        todayItems[0]
      );

    }).filter(Boolean);

  }
}