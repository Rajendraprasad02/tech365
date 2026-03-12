import { useState, useEffect, useMemo } from 'react';
import {
    Search, Filter, ChevronLeft, ChevronRight, Download, Info, Calendar,
    User, Activity, Server, CheckCircle2, XCircle, Clock, ShieldCheck
} from 'lucide-react';
import { getAuditLogs, getAuditLogDetails, getUsers } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import { format } from 'date-fns';
import Pagination from '@/components/ui/Pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const LOG_TYPE_COLORS = {
    'audit': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'service': 'bg-amber-100 text-amber-700 border-amber-200'
};

const STATUS_COLORS = {
    'success': 'text-green-600 bg-green-50 border-green-100',
    'failed': 'text-red-600 bg-red-50 border-red-100',
    'error': 'text-red-600 bg-red-50 border-red-100',
    'warning': 'text-amber-600 bg-amber-50 border-amber-100'
};

export default function AuditLogsPage() {
    const { toast } = useToast();
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);

    // Filters and Pagination
    const [filters, setFilters] = useState({
        logType: 'all',
        module: 'all',
        userId: 'all',
        status: 'all',
        startDate: '',
        endDate: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        sortBy: 'timestamp',
        sortOrder: 'desc'
    });

    useEffect(() => {
        fetchUsers();
        fetchLogs();
    }, [pagination.page, pagination.limit, pagination.sortBy, pagination.sortOrder]);

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data || []);
        } catch (error) {
            console.error("Failed to fetch users for filters:", error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: filters.search,
                logType: filters.logType === 'all' ? '' : filters.logType,
                module: filters.module === 'all' ? '' : filters.module,
                user_name: filters.userId === 'all' ? '' : filters.userId,
                status: filters.status === 'all' ? '' : filters.status,
                startDate: filters.startDate,
                endDate: filters.endDate,
                sortBy: pagination.sortBy,
                sortOrder: pagination.sortOrder
            };
            const data = await getAuditLogs(params);

            // Backend might return logs:[], results:[], or just []
            const logEntries = data?.logs || data?.results || (Array.isArray(data) ? data : []);
            const totalCount = data?.total || data?.count || logEntries.length;

            setLogs(logEntries);
            setPagination(prev => ({ ...prev, total: totalCount }));
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field) => {
        setPagination(prev => ({
            ...prev,
            page: 1,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ field }) => {
        if (pagination.sortBy !== field) return <Activity size={12} className="opacity-20 ml-1 inline" />;
        return pagination.sortOrder === 'asc' ? <ChevronLeft size={12} className="ml-1 rotate-90 inline text-primary" /> : <ChevronRight size={12} className="ml-1 rotate-90 inline text-primary" />;
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const handleApplyFilters = () => {
        fetchLogs();
    };

    const handleLogClick = async (log) => {
        setSelectedLog(log);
        setDetailsModalOpen(true);
        // Optionally fetch fresh details if the summary isn't enough
        try {
            const details = await getAuditLogDetails(log.id);
            if (details) setSelectedLog(details);
        } catch (e) {
            console.warn("Could not fetch full details, using table data.");
        }
    };

    const handleExport = () => {
        if (!logs.length) return;

        const headers = ["Timestamp", "Type", "Module", "Action", "User", "Status", "IP Address"];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
                log.log_type,
                `"${log.module}"`,
                log.action,
                log.user,
                log.status,
                log.ip_address
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Extract unique modules for filter dropdown
    const modulesList = useMemo(() => {
        const staticModules = [
            'AUTH', 'USERS', 'ROLES', 'CONTACTS', 'CONVERSATIONS', 
            'CAMPAIGNS', 'TEMPLATES', 'FORMS', 'SYSTEM', 'SIDEBAR'
        ];
        const mods = new Set([...staticModules, ...logs.map(l => l.module).filter(Boolean)]);
        return Array.from(mods).sort();
    }, [logs]);

    return (
        <div className="flex-1 flex flex-col bg-[#F8FAFC] min-h-screen overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-primary" />
                        Audit Monitoring
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Unified view of system activity and service logs</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 border-gray-200"
                        onClick={handleExport}
                        disabled={logs.length === 0}
                    >
                        <Download size={16} /> Export Logs
                    </Button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex flex-wrap gap-3 items-center shadow-sm">
                <div className="relative min-w-[280px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Search by module, description or user..."
                        className="pl-10 h-10 border-gray-200 focus:ring-primary/20"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                    />
                </div>

                <Select value={filters.logType} onValueChange={(val) => handleFilterChange('logType', val)}>
                    <SelectTrigger className="w-[130px] h-10 border-gray-200">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="AUDIT">AUDIT</SelectItem>
                        <SelectItem value="SERVICE">SERVICE</SelectItem>
                    </SelectContent>
                </Select>


                <Select value={filters.userId} onValueChange={(val) => handleFilterChange('userId', val)}>
                    <SelectTrigger className="w-[160px] h-10 border-gray-200">
                        <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {Array.isArray(users) && users.map(u => (
                            <SelectItem key={u.id} value={u.username}>{u.username}</SelectItem>
                        ))}
                        {(!Array.isArray(users) || users.length === 0) && (
                            <div className="px-2 py-3 text-xs text-center text-gray-400 italic">No users found</div>
                        )}
                    </SelectContent>
                </Select>

                <Select value={filters.status} onValueChange={(val) => handleFilterChange('status', val)}>
                    <SelectTrigger className="w-[130px] h-10 border-gray-200">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        className="h-10 w-36 border-gray-200 text-sm"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                        type="date"
                        className="h-10 w-36 border-gray-200 text-sm"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>

                <Button onClick={handleApplyFilters} className="bg-primary hover:bg-primary-600 h-10 px-6">
                    Apply
                </Button>

                <Button 
                    variant="ghost" 
                    onClick={() => {
                        setFilters({
                            logType: 'all',
                            module: 'all',
                            userId: 'all',
                            status: 'all',
                            startDate: '',
                            endDate: '',
                            search: ''
                        });
                        setPagination(prev => ({ ...prev, page: 1 }));
                        fetchLogs();
                    }}
                    className="h-10 text-gray-500 hover:text-gray-700"
                >
                    Clear
                </Button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-8">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('timestamp')}>
                                        Timestamp <SortIcon field="timestamp" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('log_type')}>
                                        Type <SortIcon field="log_type" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('module')}>
                                        Module <SortIcon field="module" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('action')}>
                                        Action <SortIcon field="action" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('user')}>
                                        User <SortIcon field="user" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('status')}>
                                        Status <SortIcon field="status" />
                                    </th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 relative">
                                {loading && (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-gray-500">
                                            <Activity className="animate-spin mx-auto mb-2 text-primary" size={32} />
                                            Fetching logs...
                                        </td>
                                    </tr>
                                )}

                                {!loading && logs.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-20 text-center text-gray-400 italic">
                                            No logs found matching your criteria.
                                        </td>
                                    </tr>
                                )}

                                {!loading && logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        onClick={() => handleLogClick(log)}
                                        className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                                <Clock size={14} className="text-gray-400" />
                                                {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${LOG_TYPE_COLORS[(log.log_type || 'audit').toLowerCase()] || LOG_TYPE_COLORS['audit']}`}>
                                                {log.log_type || 'AUDIT'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Server size={14} className="text-gray-400" />
                                                {log.module}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-800 uppercase">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <User size={12} />
                                                </div>
                                                <span className="text-gray-700">{log.user || 'System'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[(log.status || 'success').toLowerCase()] || STATUS_COLORS['success']}`}>
                                                {(log.status || 'success').toLowerCase() === 'success' || (log.status || 'success').toLowerCase() === 'captured' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                                {(log.status || 'success').toUpperCase()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                                            {log.ip_address || '0.0.0.0'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                        page={pagination.page - 1}
                        pageSize={pagination.limit}
                        total={pagination.total}
                        onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage + 1 }))}
                        onPageSizeChange={(newSize) => setPagination(prev => ({ ...prev, limit: newSize, page: 1 }))}
                    />
                </div>
            </div>

            {/* Details Modal */}
            {isDetailsModalOpen && selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${LOG_TYPE_COLORS[(selectedLog.type || 'audit').toLowerCase()] || ''}`}>
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Log Details</h2>
                                    <p className="text-sm text-gray-500">Resource: {selectedLog.module} - {selectedLog.action}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Timestamp</label>
                                        <p className="text-gray-900 font-medium">{selectedLog.timestamp ? format(new Date(selectedLog.timestamp), 'MMMM dd yyyy, HH:mm:ss OOOO') : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Module</label>
                                        <p className="text-gray-900 font-medium">{selectedLog.module}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Action</label>
                                        <p className="text-gray-900 font-medium uppercase">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Status</label>
                                        <p className="text-gray-900 font-medium">{selectedLog.status?.toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">User</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <User size={14} />
                                            </div>
                                            <p className="text-gray-900 font-medium">{selectedLog.user || 'System'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Resource ID</label>
                                        <p className="text-gray-900 font-medium">{selectedLog.resource_id || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">IP Address</label>
                                        <p className="text-gray-900 font-mono text-sm">{selectedLog.ip_address || 'Internal'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Log Type</label>
                                        <p className="text-gray-500 text-xs leading-relaxed uppercase">{selectedLog.log_type}</p>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Request Metadata</label>
                                <div className="mt-3 bg-gray-900 rounded-xl p-6 overflow-hidden">
                                    <pre className="text-indigo-300 text-xs font-mono overflow-auto max-h-48 leading-relaxed">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <Button onClick={() => setDetailsModalOpen(false)} className="bg-primary hover:bg-primary-600 min-w-[100px]">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
