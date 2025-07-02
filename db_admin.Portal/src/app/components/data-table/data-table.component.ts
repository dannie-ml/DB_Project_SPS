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
  templateUrl: "data-table.component.html",
  styleUrl: "data-table.component.css"
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
  // 1) calcula nuevo estado de columna/dirección
  if (this.sortColumn === columnIndex) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = columnIndex;
    this.sortDirection = 'asc';
  }

  // 2) reordena displayedRows según tipo de columna
  const type = this.columnTypes[columnIndex] || 'text';
  this.displayedRows = [...this.rows].sort((a, b) => {
    let aVal = a[columnIndex];
    let bVal = b[columnIndex];

    // convierte según tipo
    if (type === 'number') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    } else if (type === 'percentage') {
      aVal = parseFloat(String(aVal).replace('%', ''));
      bVal = parseFloat(String(bVal).replace('%', ''));
    } else if (type === 'date') {
      aVal = new Date(String(aVal)).getTime();
      bVal = new Date(String(bVal)).getTime();
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    // compara numérico o lex
    let cmp = 0;
    if (aVal == null)        cmp = -1;
    else if (bVal == null)   cmp =  1;
    else if (aVal < bVal)    cmp = -1;
    else if (aVal > bVal)    cmp =  1;
    return this.sortDirection === 'asc' ? cmp : -cmp;
  });

  // 3) emite evento al padre si es necesario
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
