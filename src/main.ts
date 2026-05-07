import { bootstrapApplication } from '@angular/platform-browser';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { AppComponent } from './app/app';

import { weatherInterceptor } from './app/interceptors/weather.interceptor';

bootstrapApplication(AppComponent, {

  providers: [

    provideHttpClient(
      withInterceptors([
        weatherInterceptor
      ])
    )

  ]

}).catch(err => console.error(err));