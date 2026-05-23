import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './menu-item.html',
  styleUrls: ['./menu-item.css']
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
  readonly editingId = signal<string | null>(null);

  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'danger'>('success');

  // Bulk upload signals
  readonly uploadMode = signal<'single' | 'bulk'>('single');
  readonly csvParsedItems = signal<any[]>([]);
  readonly csvErrors = signal<any[]>([]);
  readonly isBulkUploading = signal(false);
  readonly bulkUploadProgress = signal(0);
  readonly showBulkErrors = signal(false);

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

      const id = this.editingId();
      if (id) {
        // Update existing item
        await this.api.updateMenuItem(id, payload);
        this.showToast('Menu item updated successfully', 'success');
        this.editingId.set(null);
      } else {
        // Add new item
        await this.api.addMenuItem(payload);
        this.showToast('Menu item added successfully', 'success');
      }
      
      // Reset fields
      this.item_name = '';
      this.description = '';
      this.selling_price = undefined;
      this.mrp = undefined;
      this.isGSTincluded = true;
      this.category = '';
      this.gstRate = '';
      
      // Reload list
      const items = await this.api.getMenuItems();
      this.menuItems.set(items);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to save menu item', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  startEditMenuItem(item: any) {
    this.editingId.set(item._id);
    this.category = item.category?._id || '';
    this.itemType = item.itemType || 'veg';
    this.item_name = item.item_name;
    this.description = item.description || '';
    this.selling_price = item.selling_price;
    this.mrp = item.mrp;
    this.gstRate = item.gstRate || '';
    this.isGSTincluded = item.isGSTincluded !== false;
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditMenuItem() {
    this.editingId.set(null);
    this.item_name = '';
    this.description = '';
    this.selling_price = undefined;
    this.mrp = undefined;
    this.category = '';
    this.gstRate = '';
    this.isGSTincluded = true;
  }

  async handleDeleteMenuItem(menuItemId: string, itemName: string) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    this.isLoading.set(true);
    try {
      await this.api.deleteMenuItem(menuItemId);
      this.showToast('Menu item deleted successfully', 'success');
      const items = await this.api.getMenuItems();
      this.menuItems.set(items);
    } catch (e: any) {
      this.showToast(e.message || 'Failed to delete menu item', 'danger');
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

  // ================= BULK UPLOAD METHODS =================
  
  /**
   * Parse CSV file and extract menu items
   * Expected CSV columns: item_name, category, itemType, description, selling_price, mrp, gstRate, isGSTincluded
   */
  parseCsvFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event: any) => {
        try {
          const csv = event.target.result;
          const lines = csv.split('\n').filter((line: string) => line.trim());
          
          if (lines.length < 2) {
            reject({ message: 'CSV file is empty or has only headers' });
            return;
          }

          // Parse headers
          const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
          const requiredHeaders = ['item_name', 'category', 'itemtype', 'selling_price', 'mrp'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

          if (missingHeaders.length > 0) {
            reject({ message: `Missing required columns: ${missingHeaders.join(', ')}` });
            return;
          }

          // Parse rows
          const items: any[] = [];
          const errors: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v: string) => v.trim());
            
            if (values.join('').length === 0) continue; // Skip empty rows

            const rowObj: any = {};
            headers.forEach((header:any, index: number) => {
              rowObj[header] = values[index] || '';
            });

            // Validate row data
            const rowErrors: string[] = [];

            if (!rowObj['item_name']) rowErrors.push('item_name is required');
            if (!rowObj['category']) rowErrors.push('category is required');
            if (!rowObj['selling_price'] || isNaN(parseFloat(rowObj['selling_price']))) rowErrors.push('selling_price must be a valid number');
            if (!rowObj['mrp'] || isNaN(parseFloat(rowObj['mrp']))) rowErrors.push('mrp must be a valid number');

            if (rowErrors.length > 0) {
              errors.push({ row: i + 1, item: rowObj['item_name'] || 'Unknown', errors: rowErrors });
              continue;
            }

            // Map GST rate if provided
            let gstRateId = '';
            if (rowObj['gstrate']) {
              const gstMatch = this.gstRates().find(g => 
                g.gstName.toLowerCase() === rowObj['gstrate'].toLowerCase() ||
                g.percentage === parseFloat(rowObj['gstrate'])
              );
              if (gstMatch) {
                gstRateId = gstMatch._id;
              }
            }

            // Create item object
            const item = {
              item_name: rowObj['item_name'],
              category: rowObj['category'],
              itemType: (rowObj['itemtype'] || 'veg').toLowerCase(),
              description: rowObj['description'] || '',
              selling_price: parseFloat(rowObj['selling_price']),
              mrp: parseFloat(rowObj['mrp']),
              gstRate: gstRateId,
              isGSTincluded: rowObj['isgstincluded'] ? rowObj['isgstincluded'].toLowerCase() === 'true' : true
            };

            items.push(item);
          }

          if (errors.length > 0) {
            this.csvErrors.set(errors);
          }

          resolve(items);
        } catch (error: any) {
          reject({ message: `Error parsing CSV: ${error.message}` });
        }
      };

      reader.onerror = () => {
        reject({ message: 'Failed to read file' });
      };

      reader.readAsText(file);
    });
  }

  /**
   * Map category names/IDs in parsed items to actual category IDs
   */
  mapCategoriesToIds(items: any[]): any[] {
    return items.map(item => {
      let categoryId = item.category;
      
      // If category is a string name, find the matching ID
      if (typeof item.category === 'string' && !categoryId.startsWith('_')) {
        const catMatch = this.categories().find(c => 
          c.cate_name.toLowerCase() === item.category.toLowerCase()
        );
        if (catMatch) {
          categoryId = catMatch._id;
        }
      }
      
      return { ...item, category: categoryId };
    });
  }

  async handleCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      this.showToast('Please select a valid CSV file', 'danger');
      return;
    }

    try {
      this.csvParsedItems.set([]);
      this.csvErrors.set([]);
      this.showBulkErrors.set(false);

      const parsedItems = await this.parseCsvFile(file);
      const mappedItems = this.mapCategoriesToIds(parsedItems);

      if (mappedItems.length === 0) {
        this.showToast('No valid items found in CSV file', 'danger');
        return;
      }

      this.csvParsedItems.set(mappedItems);
      this.showToast(`Parsed ${mappedItems.length} menu items from CSV (click "Upload" to confirm)`, 'success');
    } catch (error: any) {
      this.showToast(error.message || 'Failed to parse CSV file', 'danger');
    } finally {
      // Clear file input
      input.value = '';
    }
  }

  async handleBulkUpload() {
    const items = this.csvParsedItems();
    if (items.length === 0) {
      this.showToast('No items to upload', 'danger');
      return;
    }

    this.isBulkUploading.set(true);
    this.bulkUploadProgress.set(0);

    try {
      await this.api.addMenuItemsBulk(items);
      this.showToast(`Successfully uploaded ${items.length} menu items!`, 'success');
      
      // Reset upload state
      this.csvParsedItems.set([]);
      this.csvErrors.set([]);
      this.showBulkErrors.set(false);
      this.uploadMode.set('single');
      
      // Reload menu items list
      const updatedItems = await this.api.getMenuItems();
      this.menuItems.set(updatedItems);
    } catch (error: any) {
      this.showToast(error.message || 'Failed to upload menu items', 'danger');
    } finally {
      this.isBulkUploading.set(false);
    }
  }

  cancelBulkUpload() {
    this.csvParsedItems.set([]);
    this.csvErrors.set([]);
    this.showBulkErrors.set(false);
    this.uploadMode.set('single');
  }

  downloadCsvTemplate() {
    const template = `item_name,category,itemType,description,selling_price,mrp,gstRate,isGSTincluded
    Masala Dosa,Breakfast,veg,Crispy dosa with spicy potato filling,180,200,5%,true
    Butter Chicken,Main Course,non-veg,Tender chicken in creamy tomato sauce,320,380,,true
    Paneer Tikka,Starters,veg,Grilled paneer with Indian spices,240,280,,true`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menu-items-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

}
