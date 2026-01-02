'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/admin/AdminHeader';
import ManageDataModal from '@/components/admin/ManageDataModal';
import SuccessPopup from '@/components/admin/SuccessPopup';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
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
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchLeadsList();
  }, [user, leadPage, statusFilter, assignedToFilter]);

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

  const fetchDashboardData = async () => {
    try {
      const token = Cookies.get('admin_token');
      const res = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsList = async ({ pageOverride }: { pageOverride?: number } = {}) => {
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
  };

  const totalLeads = stats?.total || 0;
  const hotRate = totalLeads ? ((stats?.hot || 0) / totalLeads * 100).toFixed(1) : '0.0';
  const warmRate = totalLeads ? ((stats?.warm || 0) / totalLeads * 100).toFixed(1) : '0.0';
  const coldRate = totalLeads ? ((stats?.lost || 0) / totalLeads * 100).toFixed(1) : '0.0';

  const filteredLeads = leads.filter((lead: any) => {
    const statusMatch = statusFilter === 'ALL' || lead.status === statusFilter;
    const stageMatch = stageFilter === 'ALL' || (lead.sales_stage || 'New Inquiry') === stageFilter;
    return statusMatch && stageMatch;
  });

  const formatPrice = (price: any) => {
    if (!price) return 'N/A';
    const num = Number(price);
    if (num >= 1000000) {
      return `AED ${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `AED ${(num / 1000).toFixed(0)}K`;
    }
    return `AED ${num.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
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
  };

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
      <div className="min-h-screen bg-white flex items-center justify-center font-manrope">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-50 font-manrope">
        <AdminHeader />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 font-manrope">Dashboard Overview</h1>
              <p className="text-gray-600 font-manrope">
                Manage leads, clients, and track performance metrics
              </p>
            </div>
            <Link
              href="/admin/enquiries"
              className="inline-flex items-center justify-center bg-gray-900 hover:bg-black text-white font-semibold px-5 py-3 rounded-lg shadow-md hover:shadow-lg transition-transform hover:scale-105 font-manrope"
            >
              Manage Enquiries
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div 
              onClick={() => { setStatusFilter('ALL'); setStageFilter('ALL'); setLeadPage(1); }}
              className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <p className="text-blue-700 text-sm font-semibold mb-2 font-manrope">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900 font-manrope">{stats?.total || 0}</p>
              <p className="text-xs text-blue-700 mt-2 font-manrope">All leads in pipeline</p>
            </div>
            <div 
              onClick={() => setStatusFilter('HOT')}
              className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <p className="text-green-700 text-sm font-semibold mb-2 font-manrope">Hot Leads</p>
              <p className="text-3xl font-bold text-gray-900 font-manrope">{stats?.hot || 0}</p>
              <p className="text-xs text-green-700 mt-2 font-manrope">{hotRate}% of total</p>
            </div>
            <div 
              onClick={() => setStatusFilter('WARM')}
              className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <p className="text-amber-700 text-sm font-semibold mb-2 font-manrope">Warm Leads</p>
              <p className="text-3xl font-bold text-gray-900 font-manrope">{stats?.warm || 0}</p>
              <p className="text-xs text-amber-700 mt-2 font-manrope">{warmRate}% of total</p>
            </div>
            <div 
              onClick={() => setStatusFilter('COLD')}
              className="rounded-lg border border-red-200 bg-gradient-to-br from-red-50 to-white shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <p className="text-red-700 text-sm font-semibold mb-2 font-manrope">Cold Leads</p>
              <p className="text-3xl font-bold text-gray-900 font-manrope">{stats?.lost || 0}</p>
              <p className="text-xs text-red-700 mt-2 font-manrope">{coldRate}% of total</p>
            </div>
          </div>

          {/* Lead Management */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 relative min-h-[70vh]">
            {leadTableLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-30">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-manrope">Lead Management</h2>
                <p className="text-sm text-gray-500 font-manrope">Sorted by latest, paginated</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  onClick={() => {
                    fetchLeadsList();
                    fetchDashboardData();
                  }}
                  disabled={leadTableLoading}
                  className="px-3 py-1 bg-transparent hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium rounded text-sm transition-colors flex items-center gap-1 border border-gray-300 font-manrope"
                >
                  🔄 {leadTableLoading ? 'Refreshing...' : 'Refresh'}
                </button>
                <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 font-manrope">Filter by Status:</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setLeadPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-manrope"
                >
                  <option value="ALL">All Leads</option>
                  <option value="HOT">Hot</option>
                  <option value="WARM">Warm</option>
                  <option value="COLD">Cold</option>
                </select>
                <label htmlFor="stage-filter" className="text-sm font-medium text-gray-700 font-manrope">Filter by Stage:</label>
                <select
                  id="stage-filter"
                  value={stageFilter}
                  onChange={(e) => {
                    setStageFilter(e.target.value);
                    setLeadPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-manrope"
                >
                  <option value="ALL">All Stages</option>
                  {salesStages.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
                {user?.role === 'ADMIN' && (
                  <>
                    <label htmlFor="assigned-filter" className="text-sm font-medium text-gray-700 font-manrope">Assigned To:</label>
                    <select
                      id="assigned-filter"
                      value={assignedToFilter}
                      onChange={(e) => {
                        setAssignedToFilter(e.target.value);
                        setLeadPage(1);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-manrope"
                    >
                      <option value="all">All Leads</option>
                      <option value="unassigned">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id.toString()}>
                          {member.name || member.email}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-manrope">{statusFilter === 'ALL' ? 'No leads yet' : `No ${statusFilter.toLowerCase()} leads`}</p>
              </div>
            ) : (
              <div>
              <div className="overflow-x-auto overflow-y-visible -mx-6 sm:mx-0">
                <div className="w-full min-h-[360px] sm:min-h-[440px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Name</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Email</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Phone</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Status</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Sales Stage</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Assigned To</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Project</th>
                      <th className="text-left text-xs sm:text-sm font-semibold text-gray-900 px-3 sm:px-4 py-2 sm:py-3 font-manrope">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead: any) => (
                      <tr 
                        key={lead.id} 
                        onClick={() => handleOpenManageModal(lead)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium text-xs sm:text-sm font-manrope">{lead.name}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm font-manrope">{lead.email || '—'}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm font-manrope">{lead.phone || '—'}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusModal(lead);
                            }}
                            className={`text-xs px-2 py-1 rounded border font-medium cursor-pointer hover:shadow-sm transition inline-flex items-center gap-1 ${getStatusColor(lead.status)} font-manrope`}
                            title="Click to change status"
                          >
                            {lead.status}
                            <span className="text-gray-500">✏️</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStageModal(lead);
                            }}
                            className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 border border-blue-300 font-medium cursor-pointer hover:bg-blue-200 hover:shadow-sm transition inline-flex items-center gap-1 font-manrope"
                            title="Click to change sales stage"
                          >
                            {lead.sales_stage || 'New Inquiry'}
                            <span className="text-blue-600">✏️</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm font-manrope">
                          {lead.assigned_user_name ? (
                            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                              {lead.assigned_user_name}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 text-xs sm:text-sm font-manrope">{lead.project_name || 'N/A'}</td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 text-xs sm:text-sm font-manrope">{formatPrice(lead.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
                <div className="text-sm text-gray-600 font-manrope">
                  Showing {leads.length ? (leadPage - 1) * leadPageSize + 1 : 0}–
                  {leads.length ? (leadPage - 1) * leadPageSize + leads.length : 0} of {leadTotal}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLeadPageChange(-1)}
                    disabled={leadPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-manrope"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 font-manrope">
                    Page {leadPage} of {leadTotalPages}
                  </span>
                  <button
                    onClick={() => handleLeadPageChange(1)}
                    disabled={leadPage === leadTotalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 font-manrope"
                  >
                    Next
                  </button>
                </div>
              </div>
              </div>
            )}
          </div>
        </main>

        {/* Quick Status Modal */}
        {showStatusModal && editingStatusLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 px-4" onClick={() => { if (!actionLoading) { setShowStatusModal(false); setEditingStatusLead(null); } }}>
            <div className="bg-white rounded-lg w-full max-w-md overflow-hidden border border-gray-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">Change Lead Status</h3>
                  <p className="text-sm text-gray-600 mt-1 font-manrope">
                    {editingStatusLead.name}
                  </p>
                </div>
                <button
                  onClick={() => { if (!actionLoading) { setShowStatusModal(false); setEditingStatusLead(null); } }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-3">
                {['HOT', 'WARM', 'COLD'].map((status) => {
                  const isCurrent = editingStatusLead.status === status;
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
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all font-manrope ${
                        isCurrent ? getStatusColor(status) + ' font-semibold cursor-default' : 'bg-white border-gray-200 text-gray-700 hover:shadow-sm hover:border-gray-300'
                      } ${actionLoading ? 'opacity-60 cursor-wait' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{status}</span>
                        {isCurrent && <span className="text-xs bg-white/70 px-2 py-1 rounded font-manrope">Current</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Quick Sales Stage Modal */}
        {showStageModal && editingStageLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 px-4" onClick={() => { if (!actionLoading) { setShowStageModal(false); setEditingStageLead(null); } }}>
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-200 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 font-manrope">Change Sales Stage</h3>
                  <p className="text-sm text-gray-600 mt-1 truncate font-manrope">{editingStageLead.name}</p>
                </div>
                <button
                  onClick={() => { if (!actionLoading) { setShowStageModal(false); setEditingStageLead(null); } }}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-1 gap-2">
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
                        className={`text-left px-4 py-3 rounded-lg border transition-all font-manrope ${
                          isCurrent
                            ? 'bg-blue-100 border-blue-300 text-blue-900 font-semibold cursor-default'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                        } ${actionLoading ? 'opacity-60 cursor-wait' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm flex-1">{stage}</span>
                          {isCurrent && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded flex-shrink-0 font-manrope">Current</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end flex-shrink-0">
                <button
                  onClick={() => { setShowStageModal(false); setEditingStageLead(null); }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors font-manrope"
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
              <p className="text-gray-700 font-medium font-manrope">Processing...</p>
            </div>
          </div>
        )}

        {/* Success Popup */}
        {showSuccess && <SuccessPopup message={successMessage} />}
      </div>
    </>
  );
}

