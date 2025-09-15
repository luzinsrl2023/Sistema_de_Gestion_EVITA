import React from 'react'
import { useTable, useSortBy, usePagination } from 'react-table'

export default function Table({ columns, data, onRowClick }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    useSortBy,
    usePagination
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full text-left">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} className="bg-gray-800/50">
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    <div className="flex items-center">
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-gray-800">
            {page.map((row, i) => {
              prepareRow(row)
              return (
                <tr 
                  {...row.getRowProps()} 
                  className={`hover:bg-gray-800/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()} className="px-4 py-4 text-sm">
                        {cell.render('Cell')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filas por página:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
            }}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Página{' '}
            <span className="font-medium text-white">{pageIndex + 1}</span> de{' '}
            <span className="font-medium text-white">{pageOptions.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Primero
            </button>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Siguiente
            </button>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Último
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}import React from 'react'
import { useTable, useSortBy, usePagination } from 'react-table'

export default function Table({ columns, data, onRowClick }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    useSortBy,
    usePagination
  )

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full text-left">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} className="bg-gray-800/50">
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-400"
                  >
                    <div className="flex items-center">
                      {column.render('Header')}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()} className="divide-y divide-gray-800">
            {page.map((row, i) => {
              prepareRow(row)
              return (
                <tr 
                  {...row.getRowProps()} 
                  className={`hover:bg-gray-800/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()} className="px-4 py-4 text-sm">
                        {cell.render('Cell')}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filas por página:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
            }}
            className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Página{' '}
            <span className="font-medium text-white">{pageIndex + 1}</span> de{' '}
            <span className="font-medium text-white">{pageOptions.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Primero
            </button>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Siguiente
            </button>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
              className="px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Último
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}