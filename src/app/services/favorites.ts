import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface FavoriteCity {
  query: string;
  label: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private favoritesKey = 'weatherApp_favorites';

  private favoritesSubject = new BehaviorSubject<FavoriteCity[]>([]);

  public favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  private normalizeQuery(query: string): string {

    return query
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private normalizeCity(city: FavoriteCity): FavoriteCity {

    return {
      ...city,
      query: city.query.trim().replace(/\s+/g, ' ')
    };
  }

  private dedupeFavorites(favorites: FavoriteCity[]): FavoriteCity[] {

    const seen = new Set<string>();

    return favorites.filter((city) => {

      const normalized = this.normalizeQuery(city.query);

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);

      return true;
    });
  }

  private saveFavorites(favorites: FavoriteCity[] = []): void {

    const safeFavorites = Array.isArray(favorites)
      ? favorites
      : [];

    const uniqueFavorites = this.dedupeFavorites(
      safeFavorites.map(city => this.normalizeCity(city))
    );

    this.favoritesSubject.next(uniqueFavorites);

    localStorage.setItem(
      this.favoritesKey,
      JSON.stringify(uniqueFavorites)
    );
  }

  private loadFavorites(): void {

    try {

      const stored = localStorage.getItem(this.favoritesKey);

      if (!stored) {
        this.saveFavorites([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        this.saveFavorites([]);
        return;
      }

      this.saveFavorites(parsed);

    } catch {

      this.saveFavorites([]);

    }
  }

  addFavorite(city: FavoriteCity): void {

    const current = this.favoritesSubject.value;

    const cityQueryNormalized =
      this.normalizeQuery(city.query);

    if (
      !current.some(
        c => this.normalizeQuery(c.query) === cityQueryNormalized
      )
    ) {

      this.saveFavorites([...current, city]);

    }
  }

  removeFavorite(query: string): void {

    const current = this.favoritesSubject.value;

    const normalizedQuery =
      this.normalizeQuery(query);

    const updated = current.filter(
      c => this.normalizeQuery(c.query) !== normalizedQuery
    );

    this.saveFavorites(updated);
  }

  isFavorite(query: string): boolean {

    const normalizedQuery =
      this.normalizeQuery(query);

    return this.favoritesSubject.value.some(
      c => this.normalizeQuery(c.query) === normalizedQuery
    );
  }

  getFavorites(): FavoriteCity[] {

    return this.favoritesSubject.value;
  }

  toggleFavorite(city: FavoriteCity): void {

    if (this.isFavorite(city.query)) {

      this.removeFavorite(city.query);

    } else {

      this.addFavorite(city);

    }
  }
}