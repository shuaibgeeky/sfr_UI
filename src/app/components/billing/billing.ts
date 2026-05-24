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

interface PendingBill {
  id: string;
  tableNumber: string;
  discount: number;
  customerName: string;
  customerMobile: string;
  paymentMode: string;
  status: string;
  items: CartItem[];
  createdAt: string;
}

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [FormsModule, LayoutComponent],
  templateUrl: './billing.html',
  styleUrls: ['./billing.css']
})
export class BillingComponent implements OnInit {
  searchQuery = signal('');
  selectedCategory = signal('all');
  
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
  readonly pendingBills = signal<PendingBill[]>([]);
  readonly editingBillId = signal<string | null>(null);
  readonly isCartOpen = signal(false);
  readonly isLoading = signal(false);
  
  readonly previewMode = signal<'html' | 'text'>('html');
  readonly activeBillReceipt = signal<any | null>(null);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');
  readonly pendingBillCount = computed(() => this.pendingBills().length);
  readonly isEditingSavedBill = computed(() => !!this.editingBillId());

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
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      list = list.filter(item => item.item_name.toLowerCase().includes(query));
    }

    return list;
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSavedPendingBills();
    this.loadPOSData();
  }

  loadSavedPendingBills() {
    try {
      const saved = localStorage.getItem('sfr_pending_bills');
      if (saved) {
        const bills = JSON.parse(saved) as PendingBill[];
        this.pendingBills.set(Array.isArray(bills) ? bills : []);
      }
    } catch {
      this.pendingBills.set([]);
    }
  }

  persistPendingBills() {
    localStorage.setItem('sfr_pending_bills', JSON.stringify(this.pendingBills()));
  }

  generatePendingBillId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `pending-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
      
      if (this.editingBillId()) {
        this.pendingBills.set(this.pendingBills().filter(bill => bill.id !== this.editingBillId()));
        this.persistPendingBills();
      }

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

  async saveCurrentBill() {
    if (this.cart().length === 0) {
      this.showToast('Add items to cart before saving.', 'danger');
      return;
    }

    const draftBill: PendingBill = {
      id: this.editingBillId() || this.generatePendingBillId(),
      tableNumber: this.tableNumber,
      discount: this.discount || 0,
      customerName: this.customerName,
      customerMobile: this.customerMobile,
      paymentMode: this.paymentMode,
      status: this.status,
      items: [...this.cart()],
      createdAt: this.editingBillId() ? this.pendingBills().find(b => b.id === this.editingBillId())?.createdAt || new Date().toISOString() : new Date().toISOString()
    };

    if (this.editingBillId()) {
      this.pendingBills.set(this.pendingBills().map(bill => bill.id === this.editingBillId() ? draftBill : bill));
      this.showToast('Saved bill updated successfully.', 'success');
    } else {
      this.pendingBills.set([...this.pendingBills(), draftBill]);
      this.showToast('Bill saved to cart. You can create another bill now.', 'success');
    }

    this.persistPendingBills();
    this.clearCurrentBill();
  }

  clearCurrentBill() {
    this.cart.set([]);
    this.tableNumber = '';
    this.discount = 0;
    this.customerName = '';
    this.customerMobile = '';
    this.paymentMode = 'upi';
    this.status = 'paid';
    this.editingBillId.set(null);
    this.isCartOpen.set(false);
  }

  loadPendingBill(bill: PendingBill) {
    this.cart.set([...bill.items]);
    this.tableNumber = bill.tableNumber;
    this.discount = bill.discount;
    this.customerName = bill.customerName;
    this.customerMobile = bill.customerMobile;
    this.paymentMode = bill.paymentMode;
    this.status = bill.status;
    this.editingBillId.set(bill.id);
    this.isCartOpen.set(true);
    this.showToast('Loaded saved bill. You can now edit items in the cart.', 'success');
  }

  cancelPendingBillEdit() {
    if (!this.editingBillId()) return;
    this.clearCurrentBill();
    this.showToast('Edit canceled. Current cart cleared.', 'danger');
  }

  removePendingBill(billId: string) {
    this.pendingBills.set(this.pendingBills().filter(bill => bill.id !== billId));
    this.persistPendingBills();
    this.showToast('Saved bill removed from cart.', 'success');
  }

  getPendingBillTotal(bill: PendingBill) {
    return bill.items.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  }

  formatPendingBillDate(value: string) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }

  async generateSavedBill(bill: PendingBill) {
    if (bill.items.length === 0) {
      this.showToast('Saved bill is empty.', 'danger');
      return;
    }

    this.isLoading.set(true);
    try {
      const orderItems = bill.items.map(item => ({
        menuItemId: item._id,
        quantity: item.quantity
      }));

      const payload = {
        tableNumber: bill.tableNumber,
        customerName: bill.customerName || 'Guest',
        customerMobile: bill.customerMobile || '',
        items: orderItems,
        discount: bill.discount || 0,
        paymentMode: bill.paymentMode,
        status: bill.status
      };

      const response = await this.api.createBill(payload);
      const billId = response.data._id;
      const receiptData = await this.api.getPrintableBill(billId);

      this.pendingBills.set(this.pendingBills().filter(saved => saved.id !== bill.id));
      this.persistPendingBills();
      this.activeBillReceipt.set(receiptData);
      this.editingBillId.set(null);
      this.showToast('Generated bill and removed it from saved cart.', 'success');
    } catch (e: any) {
      this.showToast(e?.message || 'Failed to generate saved bill', 'danger');
    } finally {
      this.isLoading.set(false);
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
