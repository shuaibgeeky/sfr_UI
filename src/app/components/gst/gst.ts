import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-gst',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  templateUrl: './gst.html',
  styleUrls: ['./gst.css']
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
