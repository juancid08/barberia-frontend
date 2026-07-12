import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hg_token';
  private readonly USER_KEY  = 'hg_user';
  private readonly apiUrl    = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient) {
    const saved = sessionStorage.getItem(this.USER_KEY);
    if (saved) this.currentUser.set(JSON.parse(saved));
  }

  register(payload: RegisterPayload) {
    return this.http.post<{ status: string; message: string; data: { user: User } }>(
      `${this.apiUrl}/register`,
      payload
    );
    // No guardamos sesión al registrar — redirigimos al login
  }

  login(email: string, password: string) {
    return this.http.post<{ data: { user: User; token: string } }>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(res => {
        sessionStorage.setItem(this.TOKEN_KEY, res.data.token);
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
        this.currentUser.set(res.data.user);
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }
}