import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_URL, apiInterceptor } from './api.interceptor';

describe('apiInterceptor', () => {
  function setup(apiUrl: string): { http: HttpClient; controller: HttpTestingController } {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_URL, useValue: apiUrl },
      ],
    });

    return { http: TestBed.inject(HttpClient), controller: TestBed.inject(HttpTestingController) };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('prefixes the request url with the api url', () => {
    const { http, controller } = setup('http://localhost:3000');

    http.get('/api/v1/menu').subscribe();

    controller.expectOne('http://localhost:3000/api/v1/menu').flush({});
  });

  it('leaves the url relative when the api url is empty', () => {
    const { http, controller } = setup('');

    http.get('/api/v1/menu').subscribe();

    controller.expectOne('/api/v1/menu').flush({});
  });

  it('keeps the method, body and headers', () => {
    const { http, controller } = setup('http://localhost:3000');

    http
      .post('/api/v1/menu/categories', { name: 'Soups' }, { headers: { 'X-Test': '1' } })
      .subscribe();

    const request = controller.expectOne('http://localhost:3000/api/v1/menu/categories').request;

    expect(request.method).toBe('POST');
    expect(request.body).toEqual({ name: 'Soups' });
    expect(request.headers.get('X-Test')).toBe('1');
  });
});
