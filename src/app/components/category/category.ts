import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="page-header">
        <h1>Food Categories</h1>
        <p>Manage and group food items into breakfast, lunch, dinners, and others</p>
      </div>

      <div class="grid-container">
        <!-- Add Category Form -->
        <div class="glass-panel form-card">
          <h3>Create Food Category</h3>
          
          <form (submit)="handleAddCategory($event)">
            <div class="form-group">
              <label class="form-label">Category Name</label>
              <input 
                type="text" 
                name="cate_name" 
                [(ngModel)]="cate_name" 
                class="input-control" 
                placeholder="e.g. Breakfast, Lunch, Desserts" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <textarea 
                name="description" 
                [(ngModel)]="description" 
                class="input-control" 
                placeholder="Describe this food category..." 
                rows="3"
              ></textarea>
            </div>

            <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading()">
              {{ isLoading() ? 'Saving...' : 'Create Category' }}
            </button>
          </form>
        </div>

        <!-- Categories List -->
        <div class="glass-panel list-card">
          <h3>Active Food Categories</h3>
          
          <div class="table-container mt-20">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (cat of categories(); track cat._id) {
                  <tr>
                    <td class="bold">{{ cat.cate_name }}</td>
                    <td class="desc-col">{{ cat.description || 'No description' }}</td>
                    <td>
                      <span class="badge" [class.badge-veg]="cat.status" [class.badge-nonveg]="!cat.status">
                        {{ cat.status ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" class="center-text py-20 text-muted">No food categories configured yet.</td>
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
    textarea {
      resize: none;
    }
    .desc-col {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--color-text-muted);
    }

    @media (max-width: 992px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CategoryComponent implements OnInit {
  cate_name = '';
  description = '';
  
  readonly categories = signal<any[]>([]);
  readonly isLoading = signal(false);
  
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      const data = await this.api.getCategories();
      this.categories.set(data);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to fetch categories', 'danger');
    }
  }

  async handleAddCategory(event: Event) {
    event.preventDefault();
    if (!this.cate_name) return;

    this.isLoading.set(true);
    try {
      await this.api.addCategory({
        cate_name: this.cate_name,
        description: this.description
      });
      this.showToast('Food category created successfully', 'success');
      this.cate_name = '';
      this.description = '';
      this.loadCategories();
    } catch (e: any) {
      this.showToast(e.message || 'Failed to save food category', 'danger');
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
