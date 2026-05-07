import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';

import { Observable, tap } from 'rxjs';

export const weatherInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const start = Date.now();

  console.log('HTTP Request:', req.method, req.url);

  return next(req).pipe(

    tap({

      next: () => {

        const time = Date.now() - start;

        console.log(
          `HTTP Success: ${req.url} (${time}ms)`
        );

      },

      error: (error) => {

        const time = Date.now() - start;

        console.error(
          `HTTP Error: ${req.url} (${time}ms)`,
          error
        );

      }

    })

  );
};