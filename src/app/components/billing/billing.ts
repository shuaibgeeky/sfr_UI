import { Component, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

interface CartItem {
  _id: string;
  item_name: string;
  selling_price: number;
  gstPercentage: number;
  isGSTincluded: boolean;
  quantity: number;
  category: any;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="pos-layout">
        
        <!-- Left Side: Menu Item Selection -->
        <div class="menu-section">
          <div class="pos-header">
            <div class="title-search">
              <h2>Billing Terminal (POS)</h2>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                class="input-control search-bar" 
                placeholder="🔍 Search dishes, drinks..." 
              />
            </div>
            
            <!-- Category Tabs -->
            <div class="category-tabs">
              <button 
                (click)="selectedCategory.set('all')" 
                class="tab-btn" 
                [class.active]="selectedCategory() === 'all'"
              >
                All Items
              </button>
              @for (cat of categories(); track cat._id) {
                <button 
                  (click)="selectedCategory.set(cat._id)" 
                  class="tab-btn" 
                  [class.active]="selectedCategory() === cat._id"
                >
                  {{ cat.cate_name }}
                </button>
              }
            </div>
          </div>

          <!-- Items Grid -->
          <div class="items-grid">
            @for (item of filteredItems(); track item._id) {
              <div 
                (click)="addToCart(item)" 
                class="glass-panel item-card" 
                [class.veg-border]="item.itemType === 'veg'" 
                [class.nonveg-border]="item.itemType !== 'veg'"
              >
                <div class="item-type-badge">
                  <span class="type-dot" [class.veg-dot]="item.itemType === 'veg'" [class.nonveg-dot]="item.itemType !== 'veg'"></span>
                  <span class="type-text">{{ item.itemType === 'veg' ? 'Veg' : 'Non-veg' }}</span>
                </div>
                <h4 class="item-title">{{ item.item_name }}</h4>
                <p class="item-desc">{{ item.description || 'Tasty and fresh dish' }}</p>
                <div class="item-footer">
                  <span class="item-price">Rs {{ item.selling_price }}</span>
                  <button class="add-btn">+</button>
                </div>
              </div>
            } @empty {
              <div class="center-text py-40 text-muted full-width">No menu items found. Add items in the Menu portal first.</div>
            }
          </div>
        </div>

        <!-- Right Side: Cart Panel (Collapsible Drawer on Mobile) -->
        <div class="cart-section" [class.mobile-open]="isCartOpen()">
          <div class="cart-header">
            <h3>Current Order</h3>
            <button class="close-cart-btn" (click)="isCartOpen.set(false)">✖ Close</button>
            <button (click)="clearCart()" class="clear-btn">Clear Cart</button>
          </div>

          <!-- Cart Items Scroll Area -->
          <div class="cart-items">
            @for (item of cart(); track item._id) {
              <div class="cart-item-row">
                <div class="item-info">
                  <span class="item-name bold">{{ item.item_name }}</span>
                  <span class="item-price-unit">Rs {{ item.selling_price }}</span>
                </div>
                <div class="item-actions">
                  <button (click)="decrementQty(item)" class="qty-btn">-</button>
                  <span class="qty-count">{{ item.quantity }}</span>
                  <button (click)="addToCart(item)" class="qty-btn">+</button>
                  <button (click)="removeFromCart(item)" class="delete-btn">🗑️</button>
                </div>
              </div>
            } @empty {
              <div class="cart-empty-state">
                <span class="cart-icon">🛒</span>
                <p>Cart is empty. Click dishes to add them!</p>
              </div>
            }
          </div>

          <!-- Invoice Details / Customer Inputs -->
          <div class="cart-meta glass-panel">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Table Number</label>
                <input type="text" [(ngModel)]="tableNumber" class="input-control font-sm" placeholder="e.g. Table 5" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Discount (Rs)</label>
                <input type="number" [(ngModel)]="discount" class="input-control font-sm" placeholder="0" min="0" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Customer Name</label>
                <input type="text" [(ngModel)]="customerName" class="input-control font-sm" placeholder="Guest" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Mobile Number</label>
                <input type="text" [(ngModel)]="customerMobile" class="input-control font-sm" placeholder="Optional" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">Payment Mode</label>
                <select [(ngModel)]="paymentMode" class="input-control font-sm">
                  <option value="upi">UPI / Scanner</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Status</label>
                <select [(ngModel)]="status" class="input-control font-sm">
                  <option value="paid">Paid ✅</option>
                  <option value="pending">Pending ⏳</option>
                  <option value="cancelled">Cancelled ❌</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Total Calculation Details Panel -->
          <div class="cart-summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>Rs {{ calculatedSubTotal() }}</span>
            </div>
            @if (calculatedGst() > 0) {
              <div class="summary-row font-sm text-muted">
                <span>CGST (2.5%):</span>
                <span>Rs {{ calculatedCgst() }}</span>
              </div>
              <div class="summary-row font-sm text-muted">
                <span>SGST (2.5%):</span>
                <span>Rs {{ calculatedSgst() }}</span>
              </div>
              <div class="summary-row">
                <span>Total GST (5%):</span>
                <span>Rs {{ calculatedGst() }}</span>
              </div>
            }
            @if (discount > 0) {
              <div class="summary-row text-danger">
                <span>Discount:</span>
                <span>-Rs {{ discount }}</span>
              </div>
            }
            <div class="summary-row grand-total bold text-cyan">
              <span>Grand Total:</span>
              <span>Rs {{ calculatedGrandTotal() }}</span>
            </div>

            <button 
              (click)="handlePlaceOrder()" 
              class="btn btn-primary place-order-btn" 
              [disabled]="cart().length === 0 || !tableNumber || isLoading()"
            >
              {{ isLoading() ? 'Generating Bill...' : '⚡ Generate & Print Bill' }}
            </button>
          </div>
        </div>

        <!-- Floating Cart Bar for Mobile View -->
        <div (click)="isCartOpen.set(true)" class="mobile-cart-bar">
          <div class="mobile-cart-left">
            <span>🛒 {{ cartItemCount() }} items</span>
            <span class="divider-dot"></span>
            <span class="bold">Rs {{ calculatedGrandTotal() }}</span>
          </div>
          <span class="bold">View Cart ➡️</span>
        </div>
      </div>

      <!-- Receipt Print Modal -->
      @if (activeBillReceipt()) {
        <div class="modal-backdrop">
          <div class="glass-panel modal-content">
            <div class="modal-header">
              <h3>Bill Invoice Print</h3>
              <button (click)="closeModal()" class="close-btn">✖</button>
            </div>
            
            <!-- Dual Receipt Preview (Thermal text & HTML) -->
            <div class="receipt-tabs">
              <button (click)="previewMode.set('html')" class="preview-tab" [class.active]="previewMode() === 'html'">HTML Receipt</button>
              <button (click)="previewMode.set('text')" class="preview-tab" [class.active]="previewMode() === 'text'">58mm POS Receipt (Thermal)</button>
            </div>

            <div class="receipt-preview-container">
              @if (previewMode() === 'text') {
                <pre class="text-receipt-preview">{{ activeBillReceipt().rawText }}</pre>
              } @else {
                <div class="html-receipt-preview-wrapper">
                  <iframe 
                    #receiptFrame 
                    [srcdoc]="activeBillReceipt().htmlReceipt" 
                    class="html-receipt-iframe"
                  ></iframe>
                </div>
              }
            </div>

            <div class="modal-footer">
              <button (click)="triggerPrint()" class="btn btn-success flex-1">🖨️ Direct Print</button>
              <button (click)="closeModal()" class="btn btn-secondary">Done</button>
            </div>
          </div>
        </div>
      }

      <!-- Toast Alert -->
      @if (toastMessage()) {
        <div class="alert-toast" [class.alert-toast-success]="toastType() === 'success'" [class.alert-toast-danger]="toastType() === 'danger'">
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </app-layout>
  `,
  styles: [`
    .pos-layout {
      display: grid;
      grid-template-columns: 1.8fr 1.2fr;
      gap: 30px;
      height: calc(100vh - 100px);
      align-items: stretch;
    }
    .menu-section {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .pos-header {
      margin-bottom: 24px;
    }
    .title-search {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 20px;
    }
    .title-search h2 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .search-bar {
      max-width: 320px;
    }
    .category-tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .tab-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--glass-border);
      color: var(--color-text-muted);
      border-radius: 30px;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      white-space: nowrap;
      transition: var(--transition-smooth);
    }
    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-text-main);
    }
    .tab-btn.active {
      background: var(--color-primary);
      color: var(--color-text-dark);
      box-shadow: var(--shadow-neon);
      border-color: var(--color-primary);
    }
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      overflow-y: auto;
      flex: 1;
      padding-right: 5px;
    }
    .item-card {
      padding: 18px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: var(--transition-smooth);
    }
    .item-card:hover {
      transform: translateY(-4px);
      background: var(--surface-hover);
    }
    .veg-border {
      border-left: 4px solid var(--color-success);
    }
    .nonveg-border {
      border-left: 4px solid var(--color-danger);
    }
    .item-type-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      color: var(--color-text-muted);
      margin-bottom: 10px;
    }
    .type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .veg-dot { background: var(--color-success); }
    .nonveg-dot { background: var(--color-danger); }
    
    .item-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--color-text-main);
    }
    .item-desc {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-price {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-primary);
    }
    .add-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--glass-border);
      color: var(--color-primary);
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .item-card:hover .add-btn {
      background: var(--color-primary);
      color: var(--color-text-dark);
      border-color: var(--color-primary);
    }

    /* Cart Section styles */
    .cart-section {
      background: rgba(11, 14, 20, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .close-cart-btn {
      display: none;
    }
    .clear-btn {
      font-size: 12px;
      background: transparent;
      border: none;
      color: var(--color-danger);
      cursor: pointer;
      font-weight: 500;
    }
    .cart-items {
      flex: 1;
      overflow-y: auto;
      margin-bottom: 20px;
      padding-right: 5px;
    }
    .cart-item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .item-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .item-price-unit {
      font-size: 12px;
      color: var(--color-text-muted);
      margin-top: 2px;
    }
    .item-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qty-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--glass-border);
      color: var(--color-text-main);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .qty-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .qty-count {
      font-size: 14px;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
    }
    .delete-btn {
      background: transparent;
      border: none;
      font-size: 16px;
      cursor: pointer;
      margin-left: 6px;
      opacity: 0.7;
      transition: var(--transition-smooth);
    }
    .delete-btn:hover {
      opacity: 1;
      transform: scale(1.1);
    }
    .cart-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--color-text-muted);
      gap: 10px;
    }
    .cart-icon {
      font-size: 40px;
      opacity: 0.3;
    }

    .cart-meta {
      padding: 14px;
      margin-bottom: 16px;
      border-radius: 12px;
    }
    .form-row {
      display: flex;
      gap: 12px;
    }
    .flex-1 { flex: 1; }
    .font-sm {
      font-size: 12px;
      padding: 8px 12px;
      border-radius: 8px;
    }
    .font-sm::placeholder {
      font-size: 11px;
    }

    .cart-summary {
      border-top: 1px solid var(--glass-border);
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
    }
    .font-sm { font-size: 12px; }
    .text-muted { color: var(--color-text-muted); }
    .text-danger { color: var(--color-danger); }
    .grand-total {
      font-size: 18px;
      border-top: 1px dashed var(--glass-border);
      border-bottom: 1px dashed var(--glass-border);
      padding: 8px 0;
      margin: 4px 0;
    }
    .text-cyan { color: var(--color-primary); }
    .place-order-btn {
      width: 100%;
      margin-top: 10px;
    }

    .mobile-cart-bar {
      display: none;
    }

    /* Modal dialog styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(10px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-content {
      width: 100%;
      max-width: 520px;
      background: rgba(22, 28, 39, 0.95);
      padding: 24px;
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 18px;
      cursor: pointer;
    }
    .receipt-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
    }
    .preview-tab {
      flex: 1;
      padding: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--glass-border);
      color: var(--color-text-muted);
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: var(--transition-smooth);
    }
    .preview-tab.active {
      background: rgba(0, 242, 254, 0.1);
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    .receipt-preview-container {
      flex: 1;
      overflow-y: auto;
      background: #000;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid var(--glass-border);
      min-height: 250px;
      max-height: 400px;
    }
    .text-receipt-preview {
      color: #00FF00; /* Retro matrix neon */
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      white-space: pre-wrap;
    }
    .html-receipt-preview-wrapper {
      height: 350px;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
    }
    .html-receipt-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: #fff;
    }
    .modal-footer {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    /* POS-specific responsive rules */
    @media (max-width: 992px) {
      .pos-layout {
        grid-template-columns: 1.3fr 1.2fr;
        gap: 15px;
      }
    }

    @media (max-width: 768px) {
      .pos-layout {
        grid-template-columns: 1fr;
        height: calc(100vh - 120px);
      }
      .title-search {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .search-bar {
        max-width: 100%;
      }
      
      /* Mobile Cart Sheet Mechanism */
      .cart-section {
        position: fixed;
        top: 0;
        right: -100%;
        width: 100%;
        max-width: 400px;
        height: 100vh;
        z-index: 500;
        border-radius: 0;
        box-shadow: -10px 0 30px rgba(0, 0, 0, 0.5);
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .cart-section.mobile-open {
        right: 0;
      }
      .close-cart-btn {
        display: block;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid var(--glass-border);
        color: var(--color-text-main);
        padding: 6px 12px;
        font-size: 11px;
        border-radius: 6px;
        cursor: pointer;
      }
      .mobile-cart-bar {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        height: 60px;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        border-radius: 30px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        color: var(--color-text-dark);
        z-index: 400;
        cursor: pointer;
        box-shadow: var(--shadow-neon-glow);
        font-size: 14px;
        animation: pulse 2s infinite;
      }
      .divider-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--color-text-dark);
        display: inline-block;
        margin: 0 10px;
      }
      .mobile-cart-left {
        display: flex;
        align-items: center;
      }
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(0, 242, 254, 0.7);
      }
      70% {
        box-shadow: 0 0 0 15px rgba(0, 242, 254, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(0, 242, 254, 0);
      }
    }
  `]
})
export class BillingComponent implements OnInit {
  searchQuery = '';
  selectedCategory = signal<string>('all');
  
  tableNumber = '';
  discount = 0;
  customerName = '';
  customerMobile = '';
  paymentMode = 'upi';
  status = 'paid';

  // Signals
  readonly categories = signal<any[]>([]);
  readonly menuItems = signal<any[]>([]);
  readonly cart = signal<CartItem[]>([]);
  readonly isCartOpen = signal(false);
  readonly isLoading = signal(false);
  
  readonly previewMode = signal<'html' | 'text'>('html');
  readonly activeBillReceipt = signal<any | null>(null);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');

  // Computed Properties for real-time reactive billing calculations
  readonly cartItemCount = computed(() => {
    return this.cart().reduce((sum, item) => sum + item.quantity, 0);
  });

  readonly calculatedSubTotal = computed(() => {
    let sub = 0;
    this.cart().forEach(item => {
      const isGstInc = item.isGSTincluded !== false;
      const gstPct = item.gstPercentage || 5;
      const totalCost = item.selling_price * item.quantity;
      
      if (isGstInc) {
        sub += totalCost / (1 + (gstPct / 100));
      } else {
        sub += totalCost;
      }
    });
    return Number(sub.toFixed(2));
  });

  readonly calculatedGst = computed(() => {
    let gst = 0;
    this.cart().forEach(item => {
      const isGstInc = item.isGSTincluded !== false;
      const gstPct = item.gstPercentage || 5;
      const totalCost = item.selling_price * item.quantity;

      if (isGstInc) {
        const base = totalCost / (1 + (gstPct / 100));
        gst += totalCost - base;
      } else {
        gst += totalCost * (gstPct / 100);
      }
    });
    return Number(gst.toFixed(2));
  });

  readonly calculatedCgst = computed(() => {
    return Number((this.calculatedGst() / 2).toFixed(2));
  });

  readonly calculatedSgst = computed(() => {
    return Number((this.calculatedGst() / 2).toFixed(2));
  });

  readonly calculatedGrandTotal = computed(() => {
    const total = this.calculatedSubTotal() + this.calculatedGst() - (this.discount || 0);
    return Math.round(Math.max(0, total));
  });

  // Filtered menu items based on selected category tab and search query
  readonly filteredItems = computed(() => {
    let list = this.menuItems();
    
    // Filter Category
    const cat = this.selectedCategory();
    if (cat !== 'all') {
      list = list.filter(item => item.category?._id === cat);
    }

    // Filter Query
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(item => item.item_name.toLowerCase().includes(query));
    }

    return list;
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPOSData();
  }

  async loadPOSData() {
    try {
      const [cats, items] = await Promise.all([
        this.api.getCategories(),
        this.api.getMenuItems()
      ]);
      this.categories.set(cats);
      this.menuItems.set(items);
    } catch (e: any) {
      this.showToast('Failed to load menu items', 'danger');
    }
  }

  addToCart(item: any) {
    const currentCart = [...this.cart()];
    const existIndex = currentCart.findIndex(cartItem => cartItem._id === item._id);

    if (existIndex > -1) {
      currentCart[existIndex] = {
        ...currentCart[existIndex],
        quantity: currentCart[existIndex].quantity + 1
      };
    } else {
      currentCart.push({
        _id: item._id,
        item_name: item.item_name,
        selling_price: item.selling_price,
        gstPercentage: item.gstPercentage || 5,
        isGSTincluded: item.isGSTincluded !== false,
        category: item.category,
        quantity: 1
      });
    }
    this.cart.set(currentCart);
    this.showToast(`Added ${item.item_name} to cart`, 'success');
  }

  decrementQty(item: CartItem) {
    const currentCart = [...this.cart()];
    const existIndex = currentCart.findIndex(cartItem => cartItem._id === item._id);

    if (existIndex > -1) {
      if (currentCart[existIndex].quantity > 1) {
        currentCart[existIndex] = {
          ...currentCart[existIndex],
          quantity: currentCart[existIndex].quantity - 1
        };
        this.cart.set(currentCart);
      } else {
        this.removeFromCart(item);
      }
    }
  }

  removeFromCart(item: CartItem) {
    const filtered = this.cart().filter(cartItem => cartItem._id !== item._id);
    this.cart.set(filtered);
    this.showToast(`Removed ${item.item_name} from cart`, 'success');
  }

  clearCart() {
    this.cart.set([]);
    this.showToast('Cart cleared', 'success');
  }

  async handlePlaceOrder() {
    if (this.cart().length === 0 || !this.tableNumber) return;

    this.isLoading.set(true);
    try {
      const orderItems = this.cart().map(item => ({
        menuItemId: item._id,
        quantity: item.quantity
      }));

      const payload = {
        tableNumber: this.tableNumber,
        customerName: this.customerName || 'Guest',
        customerMobile: this.customerMobile || '',
        items: orderItems,
        discount: this.discount || 0,
        paymentMode: this.paymentMode,
        status: this.status
      };

      const response = await this.api.createBill(payload);
      this.showToast('Bill invoice created!', 'success');

      // Fetch printable receipts formats
      const billId = response.data._id;
      const receiptData = await this.api.getPrintableBill(billId);
      
      // Clear inputs
      this.clearCart();
      this.tableNumber = '';
      this.discount = 0;
      this.customerName = '';
      this.customerMobile = '';
      
      // Close mobile cart drawer if open
      this.isCartOpen.set(false);

      // Open print review modal
      this.activeBillReceipt.set(receiptData);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to place order', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  triggerPrint() {
    const iframe = document.querySelector('.html-receipt-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  }

  closeModal() {
    this.activeBillReceipt.set(null);
  }

  showToast(message: string, type: 'success' | 'danger' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 2500);
  }
}
