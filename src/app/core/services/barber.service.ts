import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_min: number;
  image_url: string | null;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class BarberService {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Service[]> {
    return this.http
      .get<{ data: { services: Service[] } }>(this.apiUrl)
      .pipe(map(res => res.data.services));
  }

  getById(id: number): Observable<Service> {
    return this.http
      .get<{ data: { service: Service } }>(`${this.apiUrl}/${id}`)
      .pipe(map(res => res.data.service));
  }
}