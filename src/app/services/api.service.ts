import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://localhost:4000/api';

  // Signals for global reactive state
  readonly token = signal<string | null>(localStorage.getItem('sfr_token'));
  readonly currentUser = signal<any | null>(null);
  readonly isAuthenticated = computed(() => !!this.token());

  constructor(private http: HttpClient) {
    // Try to load user profile if token is present
    const savedUser = localStorage.getItem('sfr_user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        this.logout();
      }
    }
  }

  // Helper to construct headers with JWT
  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const currentToken = this.token();
    if (currentToken) {
      headers = headers.set('Authorization', `Bearer ${currentToken}`);
    }
    return headers;
  }

  // ================= AUTHENTICATION =================
  async login(credentials: any): Promise<any> {
    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/users/login`, credentials)
      );
      if (response.success && response.token) {
        this.token.set(response.token);
        this.currentUser.set(response.data);
        localStorage.setItem('sfr_token', response.token);
        localStorage.setItem('sfr_user', JSON.stringify(response.data));
      }
      return response;
    } catch (error: any) {
      throw error.error || { message: 'Failed to connect to server' };
    }
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('sfr_token');
    localStorage.removeItem('sfr_user');
  }

  // ================= CATEGORIES =================
  async getCategories(): Promise<any[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/categories`, { headers: this.getHeaders() })
    );
    // Note: If backend category list isn't fully defined yet, we handle fallback or direct data
    return response.data || response;
  }

  async addCategory(categoryData: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/categories`, categoryData, { headers: this.getHeaders() })
    );
  }

  // ================= MENU ITEMS =================
  async getMenuItems(): Promise<any[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/menu-items`, { headers: this.getHeaders() })
    );
    return response.data || [];
  }

  async addMenuItem(menuItemData: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/menu-items`, menuItemData, { headers: this.getHeaders() })
    );
  }

  // ================= GST RATES =================
  async getGstRates(): Promise<any[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/gst`, { headers: this.getHeaders() })
    );
    return response.data || [];
  }

  async addGstRate(gstData: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/gst`, gstData, { headers: this.getHeaders() })
    );
  }

  // ================= BILLS =================
  async getBills(): Promise<any[]> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/bills`, { headers: this.getHeaders() })
    );
    return response.data || [];
  }

  async createBill(billData: any): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/bills`, billData, { headers: this.getHeaders() })
    );
  }

  async getPrintableBill(billId: string): Promise<any> {
    const response: any = await firstValueFrom(
      this.http.get(`${this.apiUrl}/bills/${billId}/print`, { headers: this.getHeaders() })
    );
    return response.data;
  }
}
