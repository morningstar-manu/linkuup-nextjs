import { forwardRef, type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';

// Table Root
export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={`w-full text-sm ${className}`}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

// Table Head
export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <thead ref={ref} className={className} {...props} />
  )
);
TableHead.displayName = 'TableHead';

// Table Body
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tbody
      ref={ref}
      className={`divide-y divide-slate-200 dark:divide-slate-700 ${className}`}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

// Table Row
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ hoverable = true, className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        ${hoverable ? 'transition-colors hover:bg-indigo-50/50 dark:hover:bg-slate-800/50' : ''}
        ${className}
      `}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

// Table Header Row
export const TableHeaderRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
      {...props}
    />
  )
);
TableHeaderRow.displayName = 'TableHeaderRow';

// Table Header Cell
interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | false;
  onSort?: () => void;
}

export const TableHeaderCell = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ sortable, sorted, onSort, className = '', children, ...props }, ref) => (
    <th
      ref={ref}
      className={`
        px-4 py-3.5 text-left font-semibold text-slate-600 dark:text-slate-400
        ${sortable ? 'cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200' : ''}
        ${className}
      `}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && sorted && (
          <svg
            className={`h-4 w-4 transition-transform ${sorted === 'desc' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  )
);
TableHeaderCell.displayName = 'TableHeaderCell';

// Table Cell
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  truncate?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ truncate, className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`
        px-4 py-3 text-slate-600 dark:text-slate-400
        ${truncate ? 'max-w-[200px] truncate' : ''}
        ${className}
      `}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';
