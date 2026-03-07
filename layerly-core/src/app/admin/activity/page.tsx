'use client';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';

import { Modal } from '@/components/ui/Modal';

type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [userNameFilter, setUserNameFilter] = useState(''); // Display name for filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        action: actionFilter === 'ALL' ? '' : actionFilter,
        entity: entityFilter === 'ALL' ? '' : entityFilter,
        userId: userIdFilter,
        startDate,
        endDate,
        sort,
        order,
      });

      const res = await fetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error('Failed to fetch logs');

      const data = await res.json();
      setLogs(data.data);
      setTotalPages(data.meta.pages);
      setTotalRecords(data.meta.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, entityFilter, userIdFilter, startDate, endDate, sort, order]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('desc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sort !== field) return <i className="fa-solid fa-sort text-slate-300 ml-1"></i>;
    return order === 'asc' ? (
      <i className="fa-solid fa-sort-up text-blue-500 ml-1"></i>
    ) : (
      <i className="fa-solid fa-sort-down text-blue-500 ml-1"></i>
    );
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'User', 'Email', 'Action', 'Object', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.id,
          new Date(log.createdAt).toISOString(),
          `"${log.user.name || ''}"`,
          log.user.email,
          log.action,
          log.entity,
          `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Activity log', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 22);

    const tableData = logs.map((log) => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm'),
      log.user.email,
      log.action,
      log.entity,
      JSON.stringify(log.details || {}).substring(0, 50) +
        (JSON.stringify(log.details || {}).length > 50 ? '...' : ''),
    ]);

    autoTable(doc, {
      head: [['Date', 'User', 'Action', 'Object', 'Details']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
    });

    doc.save(`activity_log_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const actionOptions = [
    { value: 'ALL', label: 'All actions' },
    { value: 'CREATE', label: 'CREATE' },
    { value: 'UPDATE', label: 'UPDATE' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'LOGIN', label: 'LOGIN' },
    { value: 'LOGOUT', label: 'LOGOUT' },
    { value: 'PRINT_CREATED', label: 'PRINT_CREATED' },
    { value: 'USER_JOINED', label: 'USER_JOINED' },
  ];

  const entityOptions = [
    { value: 'ALL', label: 'All objects' },
    { value: 'PRINTER', label: 'PRINTER' },
    { value: 'FILAMENT', label: 'FILAMENT' },
    { value: 'USER', label: 'USER' },
    { value: 'ORDER', label: 'ORDER' },
  ];

  const fromRecord = (page - 1) * 20 + 1;
  const toRecord = Math.min(page * 20, totalRecords);

  const resetFilters = () => {
    setSearch('');
    setActionFilter('');
    setEntityFilter('');
    setUserIdFilter('');
    setUserNameFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity log</h1>
          <p className="text-slate-600">History of events and operations in the system</p>
        </div>
        <div className="flex gap-2">
          {(search || actionFilter || entityFilter || userIdFilter || startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <i className="fa-solid fa-times mr-2"></i> Reset filters
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <i className="fa-solid fa-file-csv mr-2"></i> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <i className="fa-solid fa-file-pdf mr-2"></i> PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <CustomSelect
              options={actionOptions}
              value={actionFilter || 'ALL'}
              onChange={(val) => setActionFilter(val)}
              placeholder="Filter by action"
            />
          </div>
          <div>
            <CustomSelect
              options={entityOptions}
              value={entityFilter || 'ALL'}
              onChange={(val) => setEntityFilter(val)}
              placeholder="Filter by object"
            />
          </div>
          <div>
            {userIdFilter ? (
              <div className="flex items-center h-[42px] px-3 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-700 justify-between">
                <span className="truncate">
                  User: {userNameFilter || userIdFilter.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUserIdFilter('');
                    setUserNameFilter('');
                  }}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            ) : (
              <div className="flex items-center h-[42px] px-3 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-400 italic">
                Click a user in the table to filter
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From date"
              leftIcon={<i className="fa-solid fa-calendar text-xs"></i>}
            />
          </div>
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To date"
              leftIcon={<i className="fa-solid fa-calendar text-xs"></i>}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th
                  className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Date
                    {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('user')}
                >
                  <div className="flex items-center">
                    User
                    {renderSortIcon('user')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center">
                    Action
                    {renderSortIcon('action')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort('entity')}
                >
                  <div className="flex items-center">
                    Object
                    {renderSortIcon('entity')}
                  </div>
                </th>
                <th className="px-6 py-3 border-b border-slate-200">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <i className="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-blue-500"></i>
                    <p>Loading logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No results.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="flex items-center gap-3 cursor-pointer group text-left w-full"
                        onClick={() => {
                          setUserIdFilter(log.user.id);
                          setUserNameFilter(log.user.name || log.user.email);
                        }}
                        title="Click to filter by user"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all relative">
                          {log.user.image ? (
                            <Image
                              src={log.user.image}
                              alt={log.user.name || ''}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            (log.user.name?.[0] || log.user.email[0]).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {log.user.name || 'No name'}
                          </div>
                          <div className="text-slate-500 text-xs">{log.user.email}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${
                          log.action === 'CREATE' || log.action === 'PRINT_CREATED'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : ''
                        }
                        ${log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                        ${log.action === 'DELETE' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                        ${log.action === 'LOGIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                        ${log.action === 'LOGOUT' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                        ${
                          log.action === 'USER_JOINED'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : ''
                        }
                      `}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.entity}</td>
                    <td className="px-6 py-4 max-w-xs text-slate-500 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-6 px-2 text-xs"
                        >
                          <i className="fa-solid fa-eye mr-1"></i> Show
                        </Button>
                        <span
                          className="truncate max-w-[150px]"
                          title={JSON.stringify(log.details, null, 2)}
                        >
                          {JSON.stringify(log.details)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing {fromRecord}-{toRecord} of {totalRecords}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Event details"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  Date
                </span>
                <span className="text-slate-900 font-medium">
                  {format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  Action
                </span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold
                  ${
                    selectedLog.action === 'CREATE' || selectedLog.action === 'PRINT_CREATED'
                      ? 'text-green-700 bg-green-100'
                      : ''
                  }
                  ${selectedLog.action === 'UPDATE' ? 'text-blue-700 bg-blue-100' : ''}
                  ${selectedLog.action === 'DELETE' ? 'text-red-700 bg-red-100' : ''}
                  ${selectedLog.action === 'LOGIN' ? 'text-purple-700 bg-purple-100' : ''}
                  ${selectedLog.action === 'LOGOUT' ? 'text-slate-700 bg-slate-100' : ''}
                  ${selectedLog.action === 'USER_JOINED' ? 'text-teal-700 bg-teal-100' : ''}
                `}
                >
                  {selectedLog.action}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  User
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 overflow-hidden relative">
                    {selectedLog.user.image ? (
                      <Image
                        src={selectedLog.user.image}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      (selectedLog.user.name?.[0] || selectedLog.user.email[0]).toUpperCase()
                    )}
                  </div>
                  <span className="text-slate-900">
                    {selectedLog.user.name || selectedLog.user.email}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  Object
                </span>
                <span className="text-slate-900 font-mono">
                  {selectedLog.entity}{' '}
                  {selectedLog.entityId && (
                    <span className="text-slate-400 text-xs">({selectedLog.entityId})</span>
                  )}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  IP address
                </span>
                <span className="text-slate-900 font-mono text-xs">
                  {selectedLog.ipAddress || 'No data'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                <span className="block text-xs text-slate-500 font-medium uppercase mb-1">
                  User Agent
                </span>
                <span className="text-slate-700 text-xs break-all">
                  {selectedLog.userAgent || 'No data'}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">JSON details</span>
              <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono shadow-inner">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
