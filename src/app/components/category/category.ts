import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LayoutComponent } from '../layout/layout';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './category.html',
  styleUrls: ['./category.css']
})
export class CategoryComponent implements OnInit {
  cate_name = '';
  description = '';
  
  readonly categories = signal<any[]>([]);
  readonly isLoading = signal(false);
  readonly editingId = signal<string | null>(null);
  
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

  startEdit(category: any) {
    this.editingId.set(category._id);
    this.cate_name = category.cate_name;
    this.description = category.description || '';
  }

  cancelEdit() {
    this.editingId.set(null);
    this.cate_name = '';
    this.description = '';
  }

  async handleAddCategory(event: Event) {
    event.preventDefault();
    if (!this.cate_name) return;

    this.isLoading.set(true);
    try {
      const id = this.editingId();
      
      if (id) {
        // Update existing category
        await this.api.updateCategory(id, {
          cate_name: this.cate_name,
          description: this.description
        });
        this.showToast('Food category updated successfully', 'success');
        this.editingId.set(null);
      } else {
        // Add new category
        await this.api.addCategory({
          cate_name: this.cate_name,
          description: this.description
        });
        this.showToast('Food category created successfully', 'success');
      }
      
      this.cate_name = '';
      this.description = '';
      await this.loadCategories();
    } catch (e: any) {
      this.showToast(e.message || 'Failed to save food category', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleDeleteCategory(categoryId: string, categoryName: string) {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) return;

    this.isLoading.set(true);
    try {
      await this.api.deleteCategory(categoryId);
      this.showToast('Food category deleted successfully', 'success');
      await this.loadCategories();
    } catch (e: any) {
      this.showToast(e.message || 'Failed to delete category', 'danger');
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
