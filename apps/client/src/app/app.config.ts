import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideBrowserGlobalErrorListeners, type ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { API_URL, apiInterceptor } from '@restaurant-ordering/web/infrastructure/http';
import { provideIcons } from '@restaurant-ordering/web/ui/icon';

import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    { provide: API_URL, useValue: environment.API_URL },
    provideIcons(),
  ],
};
