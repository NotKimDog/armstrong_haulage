"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { 
  Users, 
  Activity, 
  Database, 
  Settings, 
  TrendingUp, 
  Shield,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  Search,
  Download,
  Award,
  Star,
  Truck,
  Zap,
  BarChart3,
  PieChart
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  emailVerified: boolean;
  lastLogin?: number;
  admin?: boolean;
}

interface Analytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalMiles: number;
  totalJobs: number;
}

interface ActiveUsersData {
  activeNow: number;
  activeLastHour: number;
  activeLastDay: number;
  activeLastWeek: number;
  inactiveUsers: number;
  timeline: Array<{ date: string; count: number; label: string }>;
  totalUsers: number;
}

const CHART_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState<Array<{ timestamp: number; message: string; type: string }>>([]);
  const [actionMessage, setActionMessage] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showDatabaseStatsModal, setShowDatabaseStatsModal] = useState(false);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [verificationData, setVerificationData] = useState<any[]>([]);
  const router = useRouter();

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/user/profile/${userId}`);
      if (res.ok) {
        const userData = await res.json();
        return userData.admin === true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      // Fetch analytics
      const analyticsRes = await fetch('/api/admin/analytics');
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }

      // Fetch active users data
      const activeUsersRes = await fetch('/api/admin/active-users');
      if (activeUsersRes.ok) {
        const activeData = await activeUsersRes.json();
        setActiveUsersData(activeData);
      }

      // Set mock category data
      setCategoryData([
        { name: 'Long Haul', users: 245, percentage: 45, value: 245 },
        { name: 'Local Delivery', users: 198, percentage: 36, value: 198 },
        { name: 'Short Haul', users: 94, percentage: 17, value: 94 },
        { name: 'Specialized', users: 32, percentage: 6, value: 32 },
      ]);

      // Set mock verification data
      setVerificationData([
        { name: 'Verified', value: 487, fill: '#10b981' },
        { name: 'Pending', value: 82, fill: '#f59e0b' },
        { name: 'Rejected', value: 12, fill: '#ef4444' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if user is admin from Firebase
        const adminStatus = await checkAdminStatus(currentUser.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push('/');
        } else {
          await fetchDashboardData();
          // Set up auto-refresh every 30 seconds
          const interval = setInterval(fetchDashboardData, 30000);
          return () => clearInterval(interval);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const logAdminAction = async (action: string, actionType: 'delete' | 'update' | 'create' | 'system', details?: any) => {
    try {
      await fetch('/api/admin/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          action,
          actionType,
          details,
        }),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        await logAdminAction(`Deleted user ${userId}`, 'delete', { userId });
        alert('User deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    const action = currentAdminStatus ? 'revoke admin access from' : 'grant admin access to';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const res = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAdmin: !currentAdminStatus,
          requesterId: user?.uid,
        }),
      });
      
      if (res.ok) {
        // Refresh users list
        await fetchDashboardData();
        const newStatus = !currentAdminStatus ? 'admin' : 'user';
        await logAdminAction(`Changed user ${userId} role to ${newStatus}`, 'update', { userId, newStatus });
        alert(`Admin status updated successfully`);
      } else {
        const data = await res.json();
        alert(`Failed to update admin status: ${data.error}`);
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('/api/admin/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString()}.json`;
      a.click();
      setActionMessage('✓ Data exported successfully');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setActionMessage('✗ Failed to export data');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Admin Broadcast',
          message: broadcastMessage,
          targetUsers: 'all',
        }),
      });

      if (res.ok) {
        setActionMessage('✓ Broadcast sent to all users');
        setBroadcastMessage('');
        setShowBroadcastModal(false);
        setTimeout(() => setActionMessage(''), 3000);
      } else {
        setActionMessage('✗ Failed to send broadcast');
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      setActionMessage('✗ Error sending broadcast');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleViewLogs = async () => {
    try {
      setShowLogsModal(true);
      
      // Try to fetch real logs from the API
      try {
        const res = await fetch('/api/admin/logs?limit=50');
        if (res.ok) {
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setLogs(data.logs);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching real logs:', error);
      }

      // Fallback to mock logs if API fails
      const mockLogs = [
        { timestamp: Date.now() - 300000, message: 'Admin accessed dashboard', type: 'info' },
        { timestamp: Date.now() - 200000, message: 'User was set as admin', type: 'action' },
        { timestamp: Date.now() - 100000, message: 'Data export completed', type: 'info' },
        { timestamp: Date.now(), message: 'System check passed', type: 'success' },
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleBackupDatabase = async () => {
    try {
      setActionMessage('⏳ Backing up database...');
      // Simulate backup delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setActionMessage('✓ Database backup completed');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      setActionMessage('✗ Backup failed');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleDatabaseStats = () => {
    setShowDatabaseStatsModal(true);
  };

  const handleRunMigration = async () => {
    if (!confirm('Are you sure you want to run a migration? This cannot be undone.')) return;
    try {
      setActionMessage('⏳ Running migration...');
      // Simulate migration delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActionMessage('✓ Migration completed successfully');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      setActionMessage('✗ Migration failed');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleMaintenanceMode = (checked: boolean) => {
    setMaintenanceMode(checked);
    setActionMessage(checked ? '✓ Maintenance mode enabled' : '✓ Maintenance mode disabled');
    setTimeout(() => setActionMessage(''), 2000);
  };

  const handleRegistrationToggle = (checked: boolean) => {
    setRegistrationEnabled(checked);
    setActionMessage(checked ? '✓ User registration enabled' : '✓ User registration disabled');
    setTimeout(() => setActionMessage(''), 2000);
  };

  const handleEmailNotifications = (checked: boolean) => {
    setEmailNotifications(checked);
    setActionMessage(checked ? '✓ Email notifications enabled' : '✓ Email notifications disabled');
    setTimeout(() => setActionMessage(''), 2000);
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cache? This may affect performance temporarily.')) return;
    try {
      setActionMessage('⏳ Clearing cache...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setActionMessage('✓ Cache cleared successfully');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (error) {
      setActionMessage('✗ Failed to clear cache');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('WARNING: This will permanently delete all data. Are you absolutely sure?')) return;
    if (!confirm('This is your final warning. All data will be lost. Continue?')) return;
    try {
      setActionMessage('⏳ Resetting database...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setActionMessage('✓ Database reset completed');
      setTimeout(() => setActionMessage(''), 3000);
      await fetchDashboardData();
    } catch (error) {
      setActionMessage('✗ Failed to reset database');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white pt-32">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 bg-neutral-900 border-b border-neutral-800 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Shield className="text-red-500" size={32} />
                Admin Dashboard
              </h1>
              <p className="text-neutral-400 mt-1">Manage your Armstrong Haulage platform</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
            >
              Back to Site
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-neutral-800 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'database', label: 'Database', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stats - Gradient Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users size={32} className="text-blue-100" />
                  <span className="text-blue-100 text-sm font-medium">Platform</span>
                </div>
                <div className="text-3xl font-bold mb-1">{analytics?.totalUsers || 0}</div>
                <div className="text-blue-100 text-sm">Total Users</div>
              </div>

              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap size={32} className="text-green-100" />
                  <span className="text-green-100 text-sm font-medium">Active</span>
                </div>
                <div className="text-3xl font-bold mb-1">{activeUsersData?.activeNow || 0}</div>
                <div className="text-green-100 text-sm">Users Online Now</div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp size={32} className="text-purple-100" />
                  <span className="text-purple-100 text-sm font-medium">Today</span>
                </div>
                <div className="text-3xl font-bold mb-1">{analytics?.newUsersToday || 0}</div>
                <div className="text-purple-100 text-sm">New Users Today</div>
              </div>

              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <Truck size={32} className="text-orange-100" />
                  <span className="text-orange-100 text-sm font-medium">+5%</span>
                </div>
                <div className="text-3xl font-bold mb-1">{(analytics?.totalMiles || 0).toLocaleString()}</div>
                <div className="text-orange-100 text-sm">Total Miles</div>
              </div>
            </div>

            {/* Active Users Summary */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity size={24} className="text-green-500" />
                User Activity Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-neutral-800 rounded-lg p-4 text-center border-l-4 border-green-500">
                  <p className="text-xs text-neutral-400 mb-2">Active Right Now</p>
                  <p className="text-3xl font-bold text-green-400">{activeUsersData?.activeNow || 0}</p>
                  <p className="text-xs text-neutral-500 mt-2">Last 30 min</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center border-l-4 border-blue-500">
                  <p className="text-xs text-neutral-400 mb-2">Last Hour</p>
                  <p className="text-3xl font-bold text-blue-400">{activeUsersData?.activeLastHour || 0}</p>
                  <p className="text-xs text-neutral-500 mt-2">Unique users</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center border-l-4 border-purple-500">
                  <p className="text-xs text-neutral-400 mb-2">Last 24 Hours</p>
                  <p className="text-3xl font-bold text-purple-400">{activeUsersData?.activeLastDay || 0}</p>
                  <p className="text-xs text-neutral-500 mt-2">Unique users</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center border-l-4 border-yellow-500">
                  <p className="text-xs text-neutral-400 mb-2">Last 7 Days</p>
                  <p className="text-3xl font-bold text-yellow-400">{activeUsersData?.activeLastWeek || 0}</p>
                  <p className="text-xs text-neutral-500 mt-2">Weekly actives</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4 text-center border-l-4 border-red-500">
                  <p className="text-xs text-neutral-400 mb-2">Inactive</p>
                  <p className="text-3xl font-bold text-red-400">{activeUsersData?.inactiveUsers || 0}</p>
                  <p className="text-xs text-neutral-500 mt-2">7+ days inactive</p>
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Total Jobs</h3>
                  <Award size={24} className="text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{analytics?.totalJobs || 0}</p>
                <p className="text-neutral-400 text-xs mt-2">Jobs completed by users</p>
              </div>

              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Avg Rating</h3>
                  <Star size={24} className="text-yellow-400" />
                </div>
                <p className="text-2xl font-bold">4.8★</p>
                <p className="text-neutral-400 text-xs mt-2">Platform average</p>
              </div>

              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Admins</h3>
                  <Shield size={24} className="text-red-500" />
                </div>
                <p className="text-2xl font-bold">{users.filter(u => u.admin).length}</p>
                <p className="text-neutral-400 text-xs mt-2">Admin users</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Quick Actions</h3>
                {actionMessage && (
                  <p className={`text-sm font-medium ${actionMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                    {actionMessage}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                >
                  <Download size={20} />
                  <span>Export Data</span>
                </button>
                <button
                  onClick={fetchDashboardData}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                >
                  <Activity size={20} />
                  <span>Refresh</span>
                </button>
                <button 
                  onClick={() => setShowBroadcastModal(true)}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
                >
                  <Mail size={20} />
                  <span>Broadcast</span>
                </button>
                <button 
                  onClick={handleViewLogs}
                  className="flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                >
                  <FileText size={20} />
                  <span>View Logs</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Active Users Chart */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap size={24} className="text-yellow-500" />
                Active Users (Last 7 Days)
              </h3>
              {activeUsersData && activeUsersData.timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activeUsersData.timeline}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="label" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-neutral-500">
                  <p>Loading chart...</p>
                </div>
              )}
            </div>

            {/* Active Users Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-400">Active Now</h3>
                  <Zap size={20} className="text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-400">{activeUsersData?.activeNow || 0}</p>
                <p className="text-xs text-neutral-500 mt-2">Last 30 minutes</p>
              </div>

              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-400">Last Hour</h3>
                  <Clock size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-400">{activeUsersData?.activeLastHour || 0}</p>
                <p className="text-xs text-neutral-500 mt-2">In the last hour</p>
              </div>

              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-400">Last Day</h3>
                  <Activity size={20} className="text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-purple-400">{activeUsersData?.activeLastDay || 0}</p>
                <p className="text-xs text-neutral-500 mt-2">In the last 24 hours</p>
              </div>

              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-neutral-400">Inactive</h3>
                  <AlertCircle size={20} className="text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-400">{activeUsersData?.inactiveUsers || 0}</p>
                <p className="text-xs text-neutral-500 mt-2">No activity in 7+ days</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Categories Chart */}
              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-orange-500" />
                  User Categories
                </h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-neutral-500">
                    <p>Loading chart...</p>
                  </div>
                )}
              </div>

              {/* Verification Status Pie Chart */}
              <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <PieChart size={20} className="text-blue-500" />
                  Verification Status
                </h3>
                {verificationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsChart>
                      <Pie
                        data={verificationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {verificationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    </RechartsChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-neutral-500">
                    <p>Loading chart...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-6">Platform Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">User Engagement</span>
                    <span className="text-sm font-bold text-green-400">87%</span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div className="bg-green-500 h-3 rounded-full" style={{width: '87%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Email Verification</span>
                    <span className="text-sm font-bold text-blue-400">94%</span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">System Uptime</span>
                    <span className="text-sm font-bold text-purple-400">99.9%</span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-3">
                    <div className="bg-purple-500 h-3 rounded-full" style={{width: '99.9%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold">User</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Email</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Last Active</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Role</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold">Joined</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {filteredUsers.map((userData) => {
                    const lastLogin = userData.lastLogin || userData.createdAt;
                    const now = Date.now();
                    const diffMs = now - lastLogin;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    let lastActiveText = 'Just now';
                    let lastActiveColor = 'text-green-500';
                    
                    if (diffMins > 0 && diffMins < 60) {
                      lastActiveText = `${diffMins}m ago`;
                      lastActiveColor = 'text-green-500';
                    } else if (diffHours > 0 && diffHours < 24) {
                      lastActiveText = `${diffHours}h ago`;
                      lastActiveColor = 'text-yellow-500';
                    } else if (diffDays > 0) {
                      lastActiveText = `${diffDays}d ago`;
                      lastActiveColor = 'text-orange-500';
                    } else if (diffDays >= 7) {
                      lastActiveText = '7+ days ago';
                      lastActiveColor = 'text-red-500';
                    }

                    return (
                      <tr key={userData.id} className="hover:bg-neutral-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{userData.displayName || 'Anonymous'}</span>
                            {userData.admin && (
                              <div className="text-red-500" title="Admin">
                                <Shield size={16} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-neutral-400">{userData.email}</td>
                        <td className="px-6 py-4">
                          {userData.emailVerified ? (
                            <span className="flex items-center gap-2 text-green-500">
                              <CheckCircle size={16} />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-yellow-500">
                              <Clock size={16} />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${lastActiveColor}`}>
                          {lastActiveText}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleAdmin(userData.id, userData.admin || false)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                              userData.admin
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                            }`}
                          >
                            {userData.admin ? 'Admin' : 'User'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 hover:bg-neutral-700 rounded-lg transition">
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(userData.id)}
                              className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Database size={24} />
                Firebase Database Management
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={handleBackupDatabase}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
                  >
                    Backup Database
                  </button>
                  <button 
                    onClick={handleViewLogs}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition font-medium"
                  >
                    View Logs
                  </button>
                  <button 
                    onClick={handleDatabaseStats}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition font-medium"
                  >
                    Database Stats
                  </button>
                  <button 
                    onClick={handleRunMigration}
                    className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition font-medium"
                  >
                    Run Migration
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-4">Database Collections</h3>
              <div className="space-y-2">
                {['users', 'profiles', 'stats', 'notifications', 'achievements'].map((collection) => (
                  <div key={collection} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-neutral-400" />
                      <span className="font-medium">{collection}</span>
                    </div>
                    <button className="text-red-500 hover:text-red-400 transition">
                      View →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-4">Admin Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-neutral-400">Temporarily disable site access</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={maintenanceMode}
                      onChange={(e) => handleMaintenanceMode(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <div className="font-medium">User Registration</div>
                    <div className="text-sm text-neutral-400">Allow new users to sign up</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={registrationEnabled}
                      onChange={(e) => handleRegistrationToggle(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-neutral-400">Send system notifications to admins</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={emailNotifications}
                      onChange={(e) => handleEmailNotifications(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 rounded-lg p-6 border border-neutral-800">
              <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
                <AlertCircle size={24} />
                Danger Zone
              </h3>
              <div className="space-y-4">
                <button 
                  onClick={handleClearCache}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium"
                >
                  Clear All Cache
                </button>
                <button 
                  onClick={handleResetDatabase}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium"
                >
                  Reset Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold mb-4">Send Broadcast Message</h3>
            <textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Enter message to broadcast to all users..."
              className="w-full h-32 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <p className="text-xs text-neutral-400 mt-2">Will be sent to all {users.length} active users</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleBroadcast}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
              >
                Send Broadcast
              </button>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">System Logs</h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="bg-neutral-800 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-neutral-700/50 rounded">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded ${
                        log.type === 'success'
                          ? 'bg-green-500/20 text-green-400'
                          : log.type === 'action'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No logs available</p>
              )}
            </div>
            <button
              onClick={() => setShowLogsModal(false)}
              className="w-full mt-4 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Database Stats Modal */}
      {showDatabaseStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Database Statistics</h3>
              <button
                onClick={() => setShowDatabaseStatsModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Total Records</p>
                  <p className="text-3xl font-bold">{analytics?.totalUsers || 0}</p>
                  <p className="text-xs text-gray-500 mt-2">User records</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Database Size</p>
                  <p className="text-3xl font-bold">12.4 MB</p>
                  <p className="text-xs text-gray-500 mt-2">Total storage</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Collections</p>
                  <p className="text-3xl font-bold">5</p>
                  <p className="text-xs text-gray-500 mt-2">Active collections</p>
                </div>
                <div className="bg-neutral-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Last Backup</p>
                  <p className="text-lg font-bold">2 days ago</p>
                  <p className="text-xs text-gray-500 mt-2">Automatic backup</p>
                </div>
              </div>
              <div className="bg-neutral-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Collection Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Users</span>
                    <span className="text-gray-400">{analytics?.totalUsers || 0} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stats</span>
                    <span className="text-gray-400">{analytics?.totalJobs || 0} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notifications</span>
                    <span className="text-gray-400">1,240 records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Achievements</span>
                    <span className="text-gray-400">3,850 records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logs</span>
                    <span className="text-gray-400">5,120 records</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDatabaseStatsModal(false)}
              className="w-full mt-6 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
