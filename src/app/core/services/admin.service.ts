import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Service } from './barber.service';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'CLIENT' | 'ADMIN';
  created_at: string;
}

export interface ServicePayload {
  name: string;
  description: string;
  price: number;
  duration_min: number;
  image_url?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  role?: 'CLIENT' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly usersUrl    = `${environment.apiUrl}/users`;
  private readonly servicesUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  // ─── Usuarios ─────────────────────────────────────────────────────────────
  getUsers(): Observable<AdminUser[]> {
    return this.http
      .get<{ data: { users: AdminUser[] } }>(this.usersUrl)
      .pipe(map(res => res.data.users));
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<AdminUser> {
    return this.http
      .put<{ data: { user: AdminUser } }>(`${this.usersUrl}/${id}`, payload)
      .pipe(map(res => res.data.user));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.usersUrl}/${id}`);
  }

  // ─── Servicios ────────────────────────────────────────────────────────────
  getAllServices(): Observable<Service[]> {
    return this.http
      .get<{ data: { services: Service[] } }>(this.servicesUrl)
      .pipe(map(res => res.data.services));
  }

  createService(payload: ServicePayload): Observable<Service> {
    return this.http
      .post<{ data: { service: Service } }>(this.servicesUrl, payload)
      .pipe(map(res => res.data.service));
  }

  updateService(id: number, payload: Partial<ServicePayload & { is_active: boolean }>): Observable<Service> {
    return this.http
      .put<{ data: { service: Service } }>(`${this.servicesUrl}/${id}`, payload)
      .pipe(map(res => res.data.service));
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.servicesUrl}/${id}`);
  }
}