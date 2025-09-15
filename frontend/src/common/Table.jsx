import React from 'react'
import { useTable, useSortBy, usePagination } from 'react-table'

// Lightweight building blocks (kept for compatibility)
export function Table({ children }) {
  return <table className="w-full text-left">{children}</table>
}
export function THead({ children }) {
  return <thead className="bg-gray-800/50">{children}</thead>
}
export function TBody({ children }) {
  return <tbody className="divide-y divide-gray-800">{children}</tbody>
}
export function TR({ children, hover = true }) {
  return <tr className={hover ? 'hover:bg-gray-800/30 transition-colors' : ''}>{children}</tr>
}
export function TH({ children, right, center }) {
  return (
    <th className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 ${right ? 'text-right' : ''} ${center ? 'text-center' : ''}`}>
      {children}
    </th>
  )
}
export function TD({ children, right, center }) {
  return <td className={`px-4 py-4 ${right ? 'text-right' : ''} ${center ? 'text-center' : ''}`}>{children}</td>
}

// DataTable (react-table v7) with sorting + pagination
export default function DataTable({ columns, data, initialState, pageSize = 10 }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    state: { pageIndex },
    nextPage,
    previousPage,
    gotoPage,
    setPageSize,
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize, ...(initialState || {}) },
    },
    useSortBy,
    usePagination
  )

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full text-left">
          <thead className="bg-gray-800/50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps?.())}
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {column.render('Header')}
                      {column.isSorted ? (
                        column.isSortedDesc ? <span>▼</span> : <span>▲</span>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-gray-800">
            {page.map(row => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()} className="hover:bg-gray-800/30 transition-colors">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} className="px-4 py-4 text-sm text-gray-300">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Página <span className="text-white font-medium">{pageIndex + 1}</span> de{' '}
          <span className="text-white font-medium">{pageOptions.length || 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="px-2 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">«</button>
          <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">‹</button>
          <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">›</button>
          <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="px-2 py-1 bg-gray-800 text-gray-300 rounded disabled:opacity-40">»</button>
          <select
            className="ml-3 bg-gray-800 text-gray-300 rounded px-2 py-1"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50].map(size => (
              <option key={size} value={size}>
                Mostrar {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
