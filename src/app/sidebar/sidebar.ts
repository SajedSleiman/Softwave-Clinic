import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  sidebarCollapsed: boolean = false;
  remindersExpanded: boolean = false;
  usersExpanded: boolean = false;

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleReminders(): void {
    this.remindersExpanded = !this.remindersExpanded;
  }

  toggleUsers(): void {
    this.usersExpanded = !this.usersExpanded;
  }
}