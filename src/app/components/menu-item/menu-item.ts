import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="page-header">
        <h1>Restaurant Menu Items</h1>
        <p>Manage recipes, dishes, beverages, their pricing, and tax structures</p>
      </div>

      <div class="grid-container">
        <!-- Add Menu Item Form -->
        <div class="glass-panel form-card">
          <h3>Create Menu Item</h3>
          
          <form (submit)="handleAddMenuItem($event)">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Category</label>
                <select name="category" [(ngModel)]="category" class="input-control" required>
                  <option value="" disabled selected>Select Category</option>
                  @for (cat of categories(); track cat._id) {
                    <option [value]="cat._id">{{ cat.cate_name }}</option>
                  }
                </select>
              </div>

              <div class="form-group flex-1">
                <label class="form-label">Item Type</label>
                <select name="itemType" [(ngModel)]="itemType" class="input-control">
                  <option value="veg">Veg 🌱</option>
                  <option value="non-veg">Non-Veg 🍗</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Item Name</label>
              <input 
                type="text" 
                name="item_name" 
                [(ngModel)]="item_name" 
                class="input-control" 
                placeholder="e.g. Masala Dosa, Butter Chicken" 
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description (Optional)</label>
              <input 
                type="text" 
                name="description" 
                [(ngModel)]="description" 
                class="input-control" 
                placeholder="Briefly describe the item details..." 
              />
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Selling Price (Rs)</label>
                <input 
                  type="number" 
                  name="selling_price" 
                  [(ngModel)]="selling_price" 
                  class="input-control" 
                  placeholder="e.g. 180" 
                  required
                />
              </div>

              <div class="form-group flex-1">
                <label class="form-label">MRP (Rs)</label>
                <input 
                  type="number" 
                  name="mrp" 
                  [(ngModel)]="mrp" 
                  class="input-control" 
                  placeholder="e.g. 200" 
                  required
                />
              </div>
            </div>

            <div class="form-row align-center">
              <div class="form-group flex-1">
                <label class="form-label">GST Tax Category</label>
                <select name="gstRate" [(ngModel)]="gstRate" class="input-control">
                  <option value="" selected>Default (Direct 5%)</option>
                  @for (rate of gstRates(); track rate._id) {
                    <option [value]="rate._id">{{ rate.gstName }} ({{ rate.percentage }}%)</option>
                  }
                </select>
              </div>

              <div class="form-group flex-1 checkbox-group">
                <label class="checkbox-container">
                  <input type="checkbox" name="isGSTincluded" [(ngModel)]="isGSTincluded" />
                  <span class="checkbox-text">GST Included in Price</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading()">
              {{ isLoading() ? 'Saving...' : 'Add Menu Item' }}
            </button>
          </form>
        </div>

        <!-- Menu Items List -->
        <div class="glass-panel list-card">
          <h3>Menu Directory</h3>
          
          <div class="table-container mt-20">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Dish / Drink</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Selling Price</th>
                  <th>MRP</th>
                  <th>Tax Mode</th>
                </tr>
              </thead>
              <tbody>
                @for (item of menuItems(); track item._id) {
                  <tr>
                    <td>
                      <div class="item-cell">
                        <span class="bold">{{ item.item_name }}</span>
                        <span class="item-sub">{{ item.description || 'No desc' }}</span>
                      </div>
                    </td>
                    <td>{{ item.category?.cate_name || 'Unassigned' }}</td>
                    <td>
                      <span class="badge" [class.badge-veg]="item.itemType === 'veg'" [class.badge-nonveg]="item.itemType !== 'veg'">
                        {{ item.itemType === 'veg' ? 'Veg' : 'Non-Veg' }}
                      </span>
                    </td>
                    <td class="bold text-cyan">Rs {{ item.selling_price }}</td>
                    <td class="text-muted text-through">Rs {{ item.mrp }}</td>
                    <td>
                      <span class="tax-badge" [class.tax-inc]="item.isGSTincluded !== false" [class.tax-exc]="item.isGSTincluded === false">
                        {{ item.isGSTincluded !== false ? 'GST Inc' : 'GST Ext' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="center-text py-20 text-muted">No menu items configured yet.</td>
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
      grid-template-columns: 1fr 1.8fr;
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
    .form-row {
      display: flex;
      gap: 20px;
    }
    .flex-1 {
      flex: 1;
    }
    .align-center {
      align-items: center;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      padding-top: 15px;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 13px;
      user-select: none;
      color: var(--color-text-muted);
    }
    .checkbox-container input {
      accent-color: var(--color-primary);
      width: 16px;
      height: 16px;
    }
    .checkbox-text {
      font-weight: 500;
    }
    .w-full {
      width: 100%;
      margin-top: 10px;
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
    .text-through {
      text-decoration: line-through;
      font-size: 13px;
    }
    .bold {
      font-weight: 600;
    }
    .text-cyan {
      color: var(--color-primary);
    }
    .item-cell {
      display: flex;
      flex-direction: column;
    }
    .item-sub {
      font-size: 11px;
      color: var(--color-text-muted);
      margin-top: 2px;
    }
    .tax-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .tax-inc {
      background: rgba(0, 242, 254, 0.1);
      color: var(--color-primary);
      border: 1px solid rgba(0, 242, 254, 0.2);
    }
    .tax-exc {
      background: rgba(245, 158, 11, 0.1);
      color: var(--color-warning);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    @media (max-width: 1200px) {
      .grid-container {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 576px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .checkbox-group {
        padding-top: 0;
        margin-bottom: 20px;
      }
    }
  `]
})
export class MenuItemComponent implements OnInit {
  category = '';
  itemType = 'veg';
  item_name = '';
  description = '';
  selling_price?: number;
  mrp?: number;
  gstRate = '';
  isGSTincluded = true;

  readonly categories = signal<any[]>([]);
  readonly gstRates = signal<any[]>([]);
  readonly menuItems = signal<any[]>([]);
  readonly isLoading = signal(false);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  async loadInitialData() {
    try {
      const [cats, taxes, items] = await Promise.all([
        this.api.getCategories(),
        this.api.getGstRates(),
        this.api.getMenuItems()
      ]);
      this.categories.set(cats);
      this.gstRates.set(taxes);
      this.menuItems.set(items);
    } catch (e: any) {
      this.showToast('Failed to load menu setup data', 'danger');
    }
  }

  async handleAddMenuItem(event: Event) {
    event.preventDefault();
    if (!this.category || !this.item_name || this.selling_price === undefined || this.mrp === undefined) return;

    this.isLoading.set(true);
    try {
      const payload: any = {
        category: this.category,
        itemType: this.itemType,
        item_name: this.item_name,
        description: this.description,
        selling_price: this.selling_price,
        mrp: this.mrp,
        isGSTincluded: this.isGSTincluded
      };

      if (this.gstRate) {
        payload.gstRate = this.gstRate;
      }

      await this.api.addMenuItem(payload);
      this.showToast('Menu item added successfully', 'success');
      
      // Reset fields
      this.item_name = '';
      this.description = '';
      this.selling_price = undefined;
      this.mrp = undefined;
      this.isGSTincluded = true;
      
      // Reload list
      const items = await this.api.getMenuItems();
      this.menuItems.set(items);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to save menu item', 'danger');
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
