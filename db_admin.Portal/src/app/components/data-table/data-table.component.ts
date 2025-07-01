// src/app/components/data-table/data-table.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'percentage';
}

export interface PaginationEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="data-table-container">
      <!-- Table Header -->
      <div class="table-header" *ngIf="title">
        <h3 class="table-title">{{ title }}</h3>
        <div class="table-actions">
          <button
            class="refresh-btn"
            (click)="onRefresh()"
            [disabled]="loading">
            <span class="refresh-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="loading">
        <div class="loading-spinner"></div>
        <span>Loading data...</span>
      </div>

      <!-- Error State -->
      <div class="error-container" *ngIf="error && !loading">
        <div class="error-icon">⚠️</div>
        <span>{{ error }}</span>
        <button class="retry-btn" (click)="onRefresh()">Retry</button>
      </div>

      <!-- Table Content -->
      <div class="table-wrapper" *ngIf="!loading && !error">
        <table class="data-table">
          <thead>
            <tr>
              <th
                *ngFor="let header of headers; let i = index"
                [class.sortable]="sortable"
                (click)="sortable ? onSort(i) : null">
                {{ header }}
                <span class="sort-icon" *ngIf="sortable && sortColumn === i">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of displayedRows; let i = index"
                [class.even]="i % 2 === 0"
                [class.odd]="i % 2 === 1">
              <td *ngFor="let cell of row; let j = index"
                  [class]="getCellClass(j)">
                {{ formatCell(cell, j) }}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="rows.length === 0">
          <div class="empty-icon">📊</div>
          <h4>No data available</h4>
          <p>There is no data to display at the moment.</p>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" *ngIf="!loading && !error && totalCount > pageSize">
        <div class="pagination-info">
          Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalCount }} entries
        </div>
        <div class="pagination-controls">
          <button
            class="page-btn"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)">
            Previous
          </button>

          <button
            *ngFor="let page of visiblePages"
            class="page-btn"
            [class.active]="page === currentPage"
            (click)="goToPage(page)">
            {{ page }}
          </button>

          <button
            class="page-btn"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)">
            Next
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .table-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      font-family: 'DM Sans', sans-serif;
    }

    .table-actions {
      display: flex;
      gap: 0.75rem;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
    }

    .refresh-btn:hover:not(:disabled) {
      border-color: #9ca3af;
      background: #f9fafb;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .refresh-icon {
      font-size: 0.875rem;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #6b7280;
    }

    .loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f4f6;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-container {
      color: #ef4444;
    }

    .error-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .retry-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ef4444;
      border-radius: 6px;
      background: white;
      color: #ef4444;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      background: #ef4444;
      color: white;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      background: #f9fafb;
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      background: #f3f4f6;
    }

    .sort-icon {
      margin-left: 0.5rem;
      color: #6b7280;
    }

    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }

    .data-table tr.even {
      background: #ffffff;
    }

    .data-table tr.odd {
      background: #f9fafb;
    }

    .data-table tr:hover {
      background: #f3f4f6;
    }

    .cell-number {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }

    .cell-percentage {
      text-align: right;
      font-weight: 600;
    }

    .cell-date {
      font-family: 'JetBrains Mono', monospace;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h4 {
      margin: 0 0 0.5rem 0;
      color: #374151;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .pagination-info {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .pagination-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-btn {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      min-width: 2.5rem;
      text-align: center;
    }

    .page-btn:hover:not(:disabled):not(.active) {
      border-color: #9ca3af;
      background: #f9fafb;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    @media (max-width: 768px) {
      .table-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .pagination-container {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }

      .data-table {
        font-size: 0.75rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class DataTableComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() headers: string[] = [];
  @Input() rows: any[][] = [];
  @Input() loading: boolean = false;
  @Input() error: string = '';
  @Input() totalCount: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 20;
  @Input() sortable: boolean = false;
  @Input() columnTypes: string[] = []; // 'text', 'number', 'date', 'percentage'

  @Output() refresh = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<PaginationEvent>();
  @Output() sort = new EventEmitter<{ column: number; direction: 'asc' | 'desc' }>();

  displayedRows: any[][] = [];
  sortColumn: number = -1;
  sortDirection: 'asc' | 'desc' = 'asc';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.updateDisplayedRows();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.updateDisplayedRows();
  }

  private updateDisplayedRows(): void {
    this.displayedRows = [...this.rows];
  }

  onRefresh(): void {
    this.refresh.emit();
  }

  onSort(columnIndex: number): void {
    if (this.sortColumn === columnIndex) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnIndex;
      this.sortDirection = 'asc';
    }

    this.sort.emit({ column: columnIndex, direction: this.sortDirection });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit({ page, pageSize: this.pageSize });
    }
  }

  getCellClass(columnIndex: number): string {
    const type = this.columnTypes[columnIndex] || 'text';
    return `cell-${type}`;
  }

  formatCell(value: any, columnIndex: number): string {
    const type = this.columnTypes[columnIndex] || 'text';

    if (value === null || value === undefined) {
      return '-';
    }

    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'percentage':
        return typeof value === 'string' && value.includes('%') ? value : `${value}%`;
      case 'date':
        return value;
      default:
        return value.toString();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const totalPages = this.totalPages;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }
}
