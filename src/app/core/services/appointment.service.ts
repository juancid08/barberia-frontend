import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Appointment {
  id: number;
  serviceId: number;
  date_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  service: { name: string; price: number; duration_min: number };
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  getAvailableSlots(date: string, serviceId: number): Observable<string[]> {
    return this.http
      .get<{ data: { slots: string[] } }>(`${this.apiUrl}/available`, {
        params: { date, serviceId: serviceId.toString() },
      })
      .pipe(map(res => res.data.slots));
  }

  book(payload: { serviceId: number; date: string; time: string; notes?: string }): Observable<Appointment> {
    return this.http
      .post<{ data: { appointment: Appointment } }>(this.apiUrl, payload)
      .pipe(map(res => res.data.appointment));
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http
      .get<{ data: { appointments: Appointment[] } }>(`${this.apiUrl}/my`)
      .pipe(map(res => res.data.appointments));
  }

  cancel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}