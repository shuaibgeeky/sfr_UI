import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { BillingComponent } from './components/billing/billing';
import { CategoryComponent } from './components/category/category';
import { MenuItemComponent } from './components/menu-item/menu-item';
import { GstComponent } from './components/gst/gst';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'billing', component: BillingComponent },
  { path: 'categories', component: CategoryComponent },
  { path: 'menu-items', component: MenuItemComponent },
  { path: 'gst', component: GstComponent },
  { path: '', redirectTo: 'billing', pathMatch: 'full' },
  { path: '**', redirectTo: 'billing' }
];
