import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-gst',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="page-header">
        <h1>GST Tax Management</h1>
        <p>Set up and configure GST categories for menu items</p>
      </div>

      <div class="grid-container">
        <!-- Add GST Rate Form -->
        <div class="glass-panel form-card">
          <h3>Add New GST Rate</h3>
          
          <form (submit)="handleAddGst($event)">
            <div class="form-group">
              <label class="form-label">GST Category Name</label>
              <input 
                type="text" 
                name="gstName" 
                [(ngModel)]="gstName" 
                class="input-control" 
                placeholder="e.g. GST 5% or GST 18%" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Percentage (%)</label>
              <input 
                type="number" 
                name="percentage" 
                [(ngModel)]="percentage" 
                class="input-control" 
                placeholder="e.g. 5" 
                min="0" 
                max="100" 
                required
              />
            </div>

            <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading()">
              {{ isLoading() ? 'Saving...' : 'Add GST Rate' }}
            </button>
          </form>
        </div>

        <!-- GST Rates List -->
        <div class="glass-panel list-card">
          <h3>Active GST Categories</h3>
          
          <div class="table-container mt-20">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Total GST</th>
                  <th>CGST (Split)</th>
                  <th>SGST (Split)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (rate of gstRates(); track rate._id) {
                  <tr>
                    <td class="bold">{{ rate.gstName }}</td>
                    <td>{{ rate.percentage }}%</td>
                    <td>{{ rate.cgstPercentage }}%</td>
                    <td>{{ rate.sgstPercentage }}%</td>
                    <td>
                      <span class="badge" [class.badge-veg]="rate.status" [class.badge-nonveg]="!rate.status">
                        {{ rate.status ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="center-text py-20 text-muted">No GST rates configured yet.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Toast Alert -->
      @if (toastMessage()) {
        <div class="alert-toast" [class.alert-toast-success]="toastType() === 'success'" [class.alert-toast-danger]="toastType() === 'danger'">
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </app-layout>
  `,
  styles: [`
    .page-header {
      margin-bottom: 30px;
    }
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .page-header p {
      color: var(--color-text-muted);
      font-size: 14px;
    }
    .grid-container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 30px;
      align-items: start;
    }
    .form-card, .list-card {
      padding: 24px;
    }
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }
    .w-full {
      width: 100%;
    }
    .mt-20 {
      margin-top: 20px;
    }
    .py-20 {
      padding: 20px 0;
    }
    .center-text {
      text-align: center;
    }
    .text-muted {
      color: var(--color-text-muted);
    }
    .bold {
      font-weight: 600;
    }

    @media (max-width: 992px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GstComponent implements OnInit {
  gstName = '';
  percentage?: number;
  
  readonly gstRates = signal<any[]>([]);
  readonly isLoading = signal(false);
  
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadGstRates();
  }

  async loadGstRates() {
    try {
      const data = await this.api.getGstRates();
      this.gstRates.set(data);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to fetch GST categories', 'danger');
    }
  }

  async handleAddGst(event: Event) {
    event.preventDefault();
    if (!this.gstName || this.percentage === undefined) return;

    this.isLoading.set(true);
    try {
      await this.api.addGstRate({
        gstName: this.gstName,
        percentage: this.percentage
      });
      this.showToast('GST tax category added successfully', 'success');
      this.gstName = '';
      this.percentage = undefined;
      this.loadGstRates();
    } catch (e: any) {
      this.showToast(e.message || 'Failed to save GST rate', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  showToast(message: string, type: 'success' | 'danger' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3000);
  }
}
