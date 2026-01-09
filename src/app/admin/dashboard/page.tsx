'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  DollarSign,
  Target,
  Zap,
  Bell,
  Phone,
  Mail
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [leadsNeedingAttention, setLeadsNeedingAttention] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadPage, setLeadPage] = useState(1);
  const [leadTotalPages, setLeadTotalPages] = useState(1);
  const [leadTotal, setLeadTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const leadPageSize = 10;
  const [leadTableLoading, setLeadTableLoading] = useState(false);
  const [manageModal, setManageModal] = useState({ show: false, lead: null as any });
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStatusLead, setEditingStatusLead] = useState<any>(null);
  const [editingStageLead, setEditingStageLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const salesStages = [
    'New Inquiry',
    'Contacted',
    'Requirements Captured',
    'Qualified Lead',
    'Property Shared',
    'Shortlisted',
    'Site Visit Scheduled',
    'Site Visit Done',
    'Negotiation',
    'Offer Made',
    'Offer Accepted',
    'Booking / Reservation',
    'SPA Issued',
    'SPA Signed',
    'Mortgage Approved',
    'Oqood Registered / Title Deed Issued',
    'Deal Closed – Won',
    'Deal Lost',
    'Post-Sale Follow-up'
  ];

  const handleOpenManageModal = (lead: any) => {
    // Agents can only view/edit leads assigned to them
    if (user?.role === 'AGENT' && lead.assigned_to !== user.id) {
      return;
    }
    setManageModal({ show: true, lead });
  };

  const handleCloseManageModal = () => {
    setManageModal({ show: false, lead: null });
  };

  const handleOpenStatusModal = (lead: any) => {
    setEditingStatusLead(lead);
    setShowStatusModal(true);
  };

  const handleOpenStageModal = (lead: any) => {
    setEditingStageLead(lead);
    setShowStageModal(true);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      // Fetch dashboard data and leads list in parallel for faster loading
      fetchDashboardData();
      fetchLeadsList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchLeadsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadPage, statusFilter, assignedToFilter]);

  useEffect(() => {
    if (user) {
      const fetchTeamMembers = async () => {
        try {
          const token = Cookies.get('admin_token');
          const res = await fetch('/api/admin/team-members', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            setTeamMembers(data.teamMembers || []);
          }
        } catch (error) {
          console.error('Failed to fetch team members:', error);
        }
      };
      fetchTeamMembers();
    }
  }, [user]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Add cache control for better performance
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentLeads(data.recentLeads || []);
        setLeadsNeedingAttention(data.leadsNeedingAttention || []);
      } else {
        console.error('Failed to fetch dashboard data:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadsList = useCallback(async ({ pageOverride }: { pageOverride?: number } = {}) => {
    try {
      setLeadTableLoading(true);
      const currentPage = pageOverride ?? leadPage;
      const token = Cookies.get('admin_token');
      let url = `/api/admin/leads?page=${currentPage}&pageSize=${leadPageSize}`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (assignedToFilter !== 'all') {
        url += `&assignedTo=${assignedToFilter}`;
      }
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) return;

      const data = await res.json();
      setLeads(data.leads || []);
      if (data.pagination) {
        setLeadPage(data.pagination.page || currentPage);
        setLeadTotalPages(data.pagination.totalPages || 1);
        setLeadTotal(data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch leads list', error);
    } finally {
      setLeadTableLoading(false);
    }
  }, [leadPage, statusFilter, assignedToFilter, leadPageSize]);

  // Memoize expensive calculations
  const totalLeads = useMemo(() => stats?.total || 0, [stats?.total]);
  const hotRate = useMemo(() => totalLeads ? ((stats?.hot || 0) / totalLeads * 100).toFixed(1) : '0.0', [totalLeads, stats?.hot]);
  const warmRate = useMemo(() => totalLeads ? ((stats?.warm || 0) / totalLeads * 100).toFixed(1) : '0.0', [totalLeads, stats?.warm]);
  const coldRate = useMemo(() => totalLeads ? ((stats?.lost || 0) / totalLeads * 100).toFixed(1) : '0.0', [totalLeads, stats?.lost]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead: any) => {
      const statusMatch = statusFilter === 'ALL' || lead.status === statusFilter;
      const stageMatch = stageFilter === 'ALL' || (lead.sales_stage || 'New Inquiry') === stageFilter;
      return statusMatch && stageMatch;
    });
  }, [leads, statusFilter, stageFilter]);

  const formatPrice = useCallback((price: any) => {
    if (!price) return 'N/A';
    const num = Number(price);
    if (num >= 1000000) {
      return `AED ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `AED ${(num / 1000).toFixed(0)}K`;
    }
    return `AED ${num.toLocaleString()}`;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'HOT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'WARM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'COLD':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  const handleLeadPageChange = (direction: number) => {
    setLeadPage((prev) => {
      const next = prev + direction;
      if (next < 1) return 1;
      if (next > leadTotalPages) return leadTotalPages;
      return next;
    });
  };

  const updateLeadStatus = async (id: number, status: string) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) return false;

      fetchLeadsList();
      fetchDashboardData();
      setActionLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to update lead status', error);
      setActionLoading(false);
      return false;
    }
  };

  const updateLeadSalesStage = async (id: number, sales_stage: string) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, sales_stage }),
      });

      if (!res.ok) return false;

      fetchLeadsList();
      setActionLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to update sales stage', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleSaveLead = async (leadId: number | null, formData: any) => {
    setActionLoading(true);
    try {
      const basePrice = parseFloat(formData.price);
      const finalPrice = Number.isNaN(basePrice)
        ? null
        : basePrice * (formData.priceUnit === 'M' ? 1_000_000 : formData.priceUnit === 'K' ? 1_000 : 1);

      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: leadId,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone,
          job_title: formData.jobTitle,
          employer: formData.employer,
          property_interests: formData.propertyInterests,
          nationality: formData.nationality,
          date_of_birth: formData.dateOfBirth || null,
          home_address: formData.homeAddress,
          notes: formData.notes,
          client_folder_link: formData.clientFolderLink,
          project_name: formData.projectName,
          price: finalPrice,
          type: formData.type,
          intent: formData.intent,
          status: formData.status,
          sales_stage: formData.salesStage,
          assigned_to: formData.assignedTo || null,
        }),
      });

      if (res.ok) {
        fetchLeadsList();
        fetchDashboardData();
        setSuccessMessage('Lead updated successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to update lead:', error);
      setActionLoading(false);
      return false;
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    setActionLoading(true);
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch(`/api/admin/leads?id=${leadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const isLastOnPage = leads.length === 1 && leadPage > 1;
        const nextPage = isLastOnPage ? leadPage - 1 : leadPage;
        setLeadPage(nextPage);
        await fetchLeadsList({ pageOverride: nextPage });
        await fetchDashboardData();
        setSuccessMessage('Lead deleted successfully');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setActionLoading(false);
        return true;
      }
      setActionLoading(false);
      return false;
    } catch (error) {
      console.error('Failed to delete lead', error);
      setActionLoading(false);
      return false;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center font-manrope">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-gray-900"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 font-manrope">
        <AdminHeader />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-16">
          {/* Page Header */}
          <div className="mb-8 sm:mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 font-manrope tracking-tight">Dashboard Overview</h1>
              <p className="text-gray-600 text-sm sm:text-base font-manrope">
                Manage leads, clients, and track performance metrics
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/enquiries"
                className="inline-flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] font-manrope"
              >
                <FileText className="w-5 h-5 mr-2" />
                Manage Enquiries
              </Link>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div 
              onClick={() => { setStatusFilter('ALL'); setStageFilter('ALL'); setLeadPage(1); }}
              className="group relative rounded-2xl border border-blue-100/50 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-blue-700 text-xs font-bold font-manrope uppercase tracking-wider">Total Leads</p>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 font-manrope mb-2">{stats?.total || 0}</p>
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium font-manrope">
                  <BarChart3 className="w-3 h-3" />
                  <span>All leads in pipeline</span>
                </div>
              </div>
            </div>
            <div 
              onClick={() => setStatusFilter('HOT')}
              className="group relative rounded-2xl border border-emerald-100/50 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-emerald-700 text-xs font-bold font-manrope uppercase tracking-wider">Hot Leads</p>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 font-manrope mb-2">{stats?.hot || 0}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium font-manrope">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{hotRate}% of total</span>
                </div>
              </div>
            </div>
            <div 
              onClick={() => setStatusFilter('WARM')}
              className="group relative rounded-2xl border border-amber-100/50 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-amber-700 text-xs font-bold font-manrope uppercase tracking-wider">Warm Leads</p>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 font-manrope mb-2">{stats?.warm || 0}</p>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-medium font-manrope">
                  <Clock className="w-3 h-3" />
                  <span>{warmRate}% of total</span>
                </div>
              </div>
            </div>
            <div 
              onClick={() => setStatusFilter('COLD')}
              className="group relative rounded-2xl border border-rose-100/50 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer transform hover:-translate-y-1.5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-rose-700 text-xs font-bold font-manrope uppercase tracking-wider">Cold Leads</p>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 font-manrope mb-2">{stats?.lost || 0}</p>
                <div className="flex items-center gap-1 text-xs text-rose-600 font-medium font-manrope">
                  <XCircle className="w-3 h-3" />
                  <span>{coldRate}% of total</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Widgets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Leads Needing Attention */}
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 font-manrope">Leads Needing Attention</h3>
                    <p className="text-xs text-gray-500 font-manrope mt-0.5">Hot & Warm leads requiring follow-up</p>
                  </div>
                </div>
                {leadsNeedingAttention.length > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {leadsNeedingAttention.length}
                  </span>
                )}
              </div>
              {leadsNeedingAttention.length > 0 ? (
                <div className="space-y-3">
                  {leadsNeedingAttention.map((lead: any) => (
                    <div
                      key={lead.id}
                      onClick={() => handleOpenManageModal(lead)}
                      className="group p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 cursor-pointer bg-gradient-to-r from-white to-amber-50/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm font-manrope truncate">{lead.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              lead.status === 'HOT' 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            {lead.phone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </span>
                            )}
                          </div>
                          {lead.project_name && (
                            <p className="text-xs text-gray-500 mt-2 font-manrope">Project: {lead.project_name}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManageModal(lead);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-amber-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4 text-amber-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-manrope text-sm font-medium">All leads are up to date!</p>
                  <p className="font-manrope text-xs mt-1">No immediate action needed</p>
                </div>
              )}
            </div>

            {/* Revenue Pipeline & Key Metrics */}
            <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">Revenue Pipeline</h3>
                  <p className="text-xs text-gray-500 font-manrope mt-0.5">Total potential value</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Pipeline Value */}
                <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-emerald-700 font-manrope uppercase tracking-wide">Total Pipeline Value</span>
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 font-manrope">
                    {stats?.pipelineValue ? formatPrice(stats.pipelineValue) : 'AED 0'}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-2 font-manrope">
                    Across {stats?.total || 0} active leads
                  </p>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 font-manrope">Conversion Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 font-manrope">
                      {stats?.conversionRate || '0'}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1 font-manrope">Hot leads ratio</p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-semibold text-purple-700 font-manrope">Total Enquiries</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 font-manrope">
                      {stats?.enquiries || 0}
                    </p>
                    <p className="text-xs text-purple-600 mt-1 font-manrope">Potential leads</p>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-indigo-700 font-manrope">Hot Leads</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 font-manrope">
                      {stats?.hot || 0}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1 font-manrope">High priority</p>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-semibold text-rose-700 font-manrope">Lost Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 font-manrope">
                      {stats?.lostRate || '0'}%
                    </p>
                    <p className="text-xs text-rose-600 mt-1 font-manrope">Cold leads</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Management */}
          <div className="bg-white rounded-2xl border border-gray-200/50 shadow-xl p-6 lg:p-8 relative min-h-[70vh]">
            {leadTableLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-200 border-t-gray-900"></div>
                  <p className="text-sm text-gray-600 font-manrope">Loading leads...</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-manrope mb-1">Lead Management</h2>
                <p className="text-sm text-gray-500 font-manrope">Sorted by latest, paginated</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    fetchLeadsList();
                    fetchDashboardData();
                  }}
                  disabled={leadTableLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium rounded-xl text-sm transition-all duration-200 border border-gray-200 hover:border-gray-300 font-manrope"
                >
                  <RefreshCw className={`w-4 h-4 ${leadTableLoading ? 'animate-spin' : ''}`} />
                  {leadTableLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <label htmlFor="status-filter" className="text-xs font-medium text-gray-600 font-manrope">Status:</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setLeadPage(1);
                    }}
                    className="px-2 py-1 border-0 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-0 font-manrope cursor-pointer"
                  >
                    <option value="ALL">All</option>
                    <option value="HOT">Hot</option>
                    <option value="WARM">Warm</option>
                    <option value="COLD">Cold</option>
                  </select>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <label htmlFor="stage-filter" className="text-xs font-medium text-gray-600 font-manrope">Stage:</label>
                  <select
                    id="stage-filter"
                    value={stageFilter}
                    onChange={(e) => {
                      setStageFilter(e.target.value);
                      setLeadPage(1);
                    }}
                    className="px-2 py-1 border-0 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-0 font-manrope cursor-pointer"
                  >
                    <option value="ALL">All Stages</option>
                    {salesStages.map((stage) => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label htmlFor="assigned-filter" className="text-xs font-medium text-gray-600 font-manrope">Assigned:</label>
                    <select
                      id="assigned-filter"
                      value={assignedToFilter}
                      onChange={(e) => {
                        setAssignedToFilter(e.target.value);
                        setLeadPage(1);
                      }}
                      className="px-2 py-1 border-0 bg-transparent text-sm text-gray-700 focus:outline-none focus:ring-0 font-manrope cursor-pointer"
                    >
                      <option value="all">All Leads</option>
                      <option value="unassigned">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id.toString()}>
                          {member.name || member.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium font-manrope text-lg">{statusFilter === 'ALL' ? 'No leads yet' : `No ${statusFilter.toLowerCase()} leads`}</p>
                <p className="text-gray-400 text-sm font-manrope mt-2">Start by creating your first lead</p>
              </div>
            ) : (
              <div>
              <div className="overflow-x-auto overflow-y-visible -mx-6 sm:mx-0">
                <div className="w-full min-h-[360px] sm:min-h-[440px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Name</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Email</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Phone</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Status</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Sales Stage</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Assigned To</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Project</th>
                      <th className="text-left text-xs sm:text-sm font-bold text-gray-700 px-4 sm:px-6 py-4 font-manrope uppercase tracking-wider">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map((lead: any) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleOpenManageModal(lead)}
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 cursor-pointer group"
                      >
                        <td className="px-4 sm:px-6 py-4 text-gray-900 font-semibold text-sm font-manrope group-hover:text-gray-900">{lead.name}</td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm font-manrope">{lead.email || <span className="text-gray-400">—</span>}</td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm font-manrope">{lead.phone || <span className="text-gray-400">—</span>}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusModal(lead);
                            }}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 ${getStatusColor(lead.status)} font-manrope`}
                            title="Click to change status"
                          >
                            {lead.status}
                            <Edit2 className="w-3 h-3 opacity-70" />
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStageModal(lead);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold cursor-pointer hover:bg-blue-100 hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 font-manrope"
                            title="Click to change sales stage"
                          >
                            {lead.sales_stage || 'New Inquiry'}
                            <Edit2 className="w-3 h-3 opacity-70" />
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm font-manrope">
                          {lead.assigned_user_name ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200">
                              <Users className="w-3 h-3 mr-1.5" />
                              {lead.assigned_user_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-gray-600 text-sm font-manrope">{lead.project_name || <span className="text-gray-400">N/A</span>}</td>
                        <td className="px-4 sm:px-6 py-4 text-gray-900 text-sm font-semibold font-manrope">{formatPrice(lead.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-5 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50/50 to-transparent">
                <div className="text-sm text-gray-600 font-medium font-manrope">
                  Showing <span className="font-bold text-gray-900">{leads.length ? (leadPage - 1) * leadPageSize + 1 : 0}</span>–
                  <span className="font-bold text-gray-900">{leads.length ? (leadPage - 1) * leadPageSize + leads.length : 0}</span> of <span className="font-bold text-gray-900">{leadTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeadPageChange(-1)}
                    disabled={leadPage === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-manrope font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 font-medium font-manrope px-4">
                    Page {leadPage} of {leadTotalPages}
                  </span>
                  <button
                    onClick={() => handleLeadPageChange(1)}
                    disabled={leadPage === leadTotalPages}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-manrope font-medium"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </main>

        {/* Quick Status Modal */}
        {showStatusModal && editingStatusLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 px-4" onClick={() => { if (!actionLoading) { setShowStatusModal(false); setEditingStatusLead(null); } }}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-gray-200/50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-white">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">Change Lead Status</h3>
                  <p className="text-sm text-gray-600 mt-1 font-manrope">
                    {editingStatusLead.name}
                  </p>
                </div>
                <button
                  onClick={() => { if (!actionLoading) { setShowStatusModal(false); setEditingStatusLead(null); } }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-3">
                {['HOT', 'WARM', 'COLD'].map((status) => {
                  const isCurrent = editingStatusLead.status === status;
                  const statusIcons = {
                    'HOT': <CheckCircle2 className="w-5 h-5" />,
                    'WARM': <Clock className="w-5 h-5" />,
                    'COLD': <AlertCircle className="w-5 h-5" />
                  };
                  return (
                    <button
                      key={status}
                      onClick={async () => {
                        if (actionLoading || isCurrent) return;
                        const ok = await updateLeadStatus(editingStatusLead.id, status);
                        if (ok) {
                          setShowStatusModal(false);
                          setEditingStatusLead(null);
                        }
                      }}
                      disabled={actionLoading || isCurrent}
                      className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 font-manrope flex items-center justify-between ${
                        isCurrent ? getStatusColor(status) + ' font-semibold cursor-default shadow-md' : 'bg-white border-gray-200 text-gray-700 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5'
                      } ${actionLoading ? 'opacity-60 cursor-wait' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {statusIcons[status as keyof typeof statusIcons]}
                        <span className="font-semibold">{status}</span>
                      </div>
                      {isCurrent && <span className="text-xs bg-white/80 px-3 py-1 rounded-full font-bold font-manrope">Current</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Sales Stage Modal */}
        {showStageModal && editingStageLead && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 px-4" onClick={() => { if (!actionLoading) { setShowStageModal(false); setEditingStageLead(null); } }}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200/50 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50/50 via-white to-white flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">Change Sales Stage</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate font-manrope">{editingStageLead.name}</p>
                </div>
                <button
                  onClick={() => { if (!actionLoading) { setShowStageModal(false); setEditingStageLead(null); } }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-1 gap-2.5">
                  {salesStages.map((stage) => {
                    const isCurrent = (editingStageLead.sales_stage || 'New Inquiry') === stage;
                    return (
                      <button
                        key={stage}
                        onClick={async () => {
                          if (actionLoading || isCurrent) return;
                          const ok = await updateLeadSalesStage(editingStageLead.id, stage);
                          if (ok) {
                            setShowStageModal(false);
                            setEditingStageLead(null);
                          }
                        }}
                        disabled={actionLoading || isCurrent}
                        className={`text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 font-manrope ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold cursor-default shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5'
                        } ${actionLoading ? 'opacity-60 cursor-wait' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium flex-1">{stage}</span>
                          {isCurrent && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded-full flex-shrink-0 font-bold font-manrope">Current</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50/50 to-transparent flex justify-end flex-shrink-0">
                <button
                  onClick={() => { setShowStageModal(false); setEditingStageLead(null); }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-200 hover:shadow-md font-manrope"
                  disabled={actionLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Manage Modal */}
        <ManageDataModal
          show={manageModal.show}
          data={manageModal.lead}
          type="lead"
          onClose={handleCloseManageModal}
          onSave={handleSaveLead}
          onDelete={user?.role === 'ADMIN' ? handleDeleteLead : undefined}
          loading={actionLoading}
          salesStages={salesStages}
        />

        {/* Action Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center gap-5 shadow-2xl border border-gray-200/50">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-200 border-t-gray-900"></div>
              <p className="text-gray-700 font-semibold text-lg font-manrope">Processing...</p>
              <p className="text-gray-500 text-sm font-manrope">Please wait</p>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccess && <SuccessPopup message={successMessage} />}
      </div>
    </>
  );
}

