import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  Gavel,
  Eye,
  Star,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart,
  Loader2,
  Settings,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { showToast } from '../utils/toast';
import adminService from '../services/adminService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActivityOverview from '../components/ActivityOverview';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalAuctions: 0,
    totalBids: 0,
    totalViews: 0,
    totalStarred: 0,
    activeAuctions: 0,
    upcomingAuctions: 0,
    completedAuctions: 0,
    userActivity: [],
    auctionActivity: [],
    recentLogins: []
  });

  // Users state
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userSort, setUserSort] = useState({ by: 'created_at', order: 'desc' });

  // Auctions state
  const [auctions, setAuctions] = useState([]);
  const [auctionPage, setAuctionPage] = useState(1);
  const [auctionStatus, setAuctionStatus] = useState('all');
  const [auctionSearch, setAuctionSearch] = useState('');
  const [auctionSort, setAuctionSort] = useState({ by: 'created_at', order: 'desc' });

  // Activity state
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityType, setActivityType] = useState('all');
  const [dateRange, setDateRange] = useState({ 
    from: null, 
    to: null,
    fromFormatted: '',
    toFormatted: ''
  });

  // Settings state with only essential settings
  const [settings, setSettings] = useState({
    siteName: '',
    registrationEnabled: true,
    maxAuctionsPerUser: '10',
    defaultAuctionDuration: '24'
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast.error('Unauthorized access');
      navigate('/');
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [analyticsRes, settingsRes] = await Promise.all([
          adminService.getAnalytics(),
          adminService.getSettings()
        ]);

        if (analyticsRes.success) setAnalytics(analyticsRes.data);
        if (settingsRes.success) {
          // Ensure numeric values are converted to strings for inputs
          setSettings({
            ...settingsRes.data,
            maxAuctionsPerUser: String(settingsRes.data.maxAuctionsPerUser || '10'),
            defaultAuctionDuration: String(settingsRes.data.defaultAuctionDuration || '24')
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        showToast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchActivityLog();
    }
  }, [activityPage, activityType, dateRange.from, dateRange.to, user]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const fetchUsers = async () => {
      try {
        const response = await adminService.getUsers(
          userPage, 
          10, 
          userSearch, 
          userSort.by, 
          userSort.order
        );
        if (response.success) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        showToast.error('Failed to load users');
      }
    };
    
    // Add a small delay to avoid too many requests when typing
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [user, userPage, userSearch, userSort.by, userSort.order]);

  // Fetch auctions data with filtering
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const fetchAuctions = async () => {
      try {
        const response = await adminService.getAuctions(
          auctionPage, 
          10, 
          auctionStatus === 'all' ? '' : auctionStatus, 
          auctionSearch, 
          auctionSort.by, 
          auctionSort.order
        );
        if (response.success) {
          setAuctions(response.data);
        }
      } catch (error) {
        console.error('Error fetching auctions:', error);
        showToast.error('Failed to load auctions');
      }
    };
    
    // Add a small delay to avoid too many requests when typing
    const timer = setTimeout(() => {
      fetchAuctions();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [user, auctionPage, auctionStatus, auctionSearch, auctionSort.by, auctionSort.order]);

  const handleUserUpdate = async (userId, userData) => {
    try {
      const response = await adminService.updateUser(userId, userData);
      if (response.success) {
        showToast.success('User updated successfully');
        setUsers(users.map(u => u.id === userId ? response.data : u));
      }
    } catch (error) {
      showToast.error('Failed to update user');
    }
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await adminService.deleteUser(userId);
      if (response.success) {
        showToast.success('User deleted successfully');
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (error) {
      showToast.error('Failed to delete user');
    }
  };

  const handleAuctionUpdate = async (auctionId, auctionData) => {
    try {
      const response = await adminService.updateAuction(auctionId, auctionData);
      if (response.success) {
        showToast.success('Auction updated successfully');
        setAuctions(auctions.map(a => a.id === auctionId ? response.data : a));
      }
    } catch (error) {
      showToast.error('Failed to update auction');
    }
  };

  const handleAuctionDelete = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) return;
    
    try {
      const response = await adminService.deleteAuction(auctionId);
      if (response.success) {
        showToast.success('Auction deleted successfully');
        setAuctions(auctions.filter(a => a.id !== auctionId));
      }
    } catch (error) {
      showToast.error('Failed to delete auction');
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await adminService.generateReport('activity', dateRange.from, dateRange.to);
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        a.download = `report-${formattedDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      showToast.error('Failed to generate report');
    }
  };

  const handleSettingsUpdate = async (newSettings) => {
    try {
      setLoading(true);
      // Convert string values to numbers for the API
      const settingsToUpdate = {
        ...newSettings,
        maxAuctionsPerUser: parseInt(newSettings.maxAuctionsPerUser) || 10,
        defaultAuctionDuration: parseInt(newSettings.defaultAuctionDuration) || 24
      };

      const response = await adminService.updateSettings(settingsToUpdate);
      
      if (response.success) {
        // Convert numbers back to strings for the form
        setSettings({
          ...response.data,
          maxAuctionsPerUser: String(response.data.maxAuctionsPerUser),
          defaultAuctionDuration: String(response.data.defaultAuctionDuration)
        });
        showToast.success('Settings updated successfully');
      } else {
        showToast.error(response.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handleDateRangeChange = (newDateRange) => {
    try {
      const from = newDateRange.from ? new Date(newDateRange.from) : null;
      const to = newDateRange.to ? new Date(newDateRange.to) : null;
      
      // Set the time to start and end of day respectively
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      setDateRange({ 
        from, 
        to,
        fromFormatted: formatDateForInput(from),
        toFormatted: formatDateForInput(to)
      });
      
      // Trigger fetch when dates change
      fetchActivityLog(1, newDateRange.from ? from : null, newDateRange.to ? to : null);
    } catch (error) {
      console.error('Error handling date range change:', error);
      showToast.error('Invalid date format');
    }
  };

  const fetchActivityLog = async (page = activityPage, fromDate = dateRange.from, toDate = dateRange.to) => {
    try {
      setLoading(true);
      
      // Map activity types to their corresponding backend values
      const activityTypeMap = {
        'all': '',
        'user': 'new_user',
        'auction': 'new_auction',
        'bid': 'new_bid'
      };
      
      const typeFilter = activityTypeMap[activityType] || '';
      
      // Format dates for API
      const startDate = fromDate ? fromDate.toISOString() : '';
      const endDate = toDate ? toDate.toISOString() : '';
      
      const response = await adminService.getActivityLog(
        page,
        20,
        typeFilter,
        startDate,
        endDate
      );

      if (response.success) {
        setActivities(response.data);
        setActivityPage(page);
      } else {
        console.error('Error response from activity log API:', response);
        showToast.error('Failed to fetch activity log');
      }
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
      showToast.error('Failed to fetch activity log');
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect for activity log
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchActivityLog();
    }
  }, [activityType]); // Only re-fetch when activity type changes

  // Update the activity type change handler
  const handleActivityTypeChange = (value) => {
    setActivityType(value);
    setActivityPage(1);
    fetchActivityLog(1); // Fetch first page with new type
  };

  // Update the activity display logic in the table
  const getActivityDescription = (activity) => {
    switch (activity.activity_type) {
      case 'new_user':
        return `New user registered: ${activity.full_name}`;
      case 'new_auction':
        return `New auction created: ${activity.title}`;
      case 'new_bid':
        return `New bid placed on ${activity.auction_title}: ${activity.amount}`;
      default:
        return activity.description || 'Unknown activity';
    }
  };

  const getActivityUser = (activity) => {
    return activity.full_name || 
           activity.creator_name || 
           activity.bidder_name || 
           activity.user_name || 
           "Unknown";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen space-y-4">
        <div className="text-red-500 text-xl">Error: {error}</div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="auctions">Auctions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Auctions</CardTitle>
                <Gavel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalAuctions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalBids}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalViews}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
            <ActivityOverview />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeAuctions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Auctions</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.upcomingAuctions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Auctions</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.completedAuctions}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select
                    value={userSort.by}
                    onValueChange={(value) => setUserSort({ ...userSort, by: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="full_name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserUpdate(user.id, { ...user, role: user.role === 'admin' ? 'user' : 'admin' })}
                          >
                            {user.role === 'admin' ? 'Demote' : 'Promote'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUserDelete(user.id)}
                            className="text-gray-600 hover:text-red-600 hover:border-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auctions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Auction Management</CardTitle>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Search auctions..."
                    value={auctionSearch}
                    onChange={(e) => setAuctionSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select
                    value={auctionStatus}
                    onValueChange={setAuctionStatus}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions.map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell className="font-medium">{auction.title}</TableCell>
                      <TableCell>{auction.seller_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          auction.status === 'active' ? 'default' :
                          auction.status === 'upcoming' ? 'secondary' :
                          'destructive'
                        }>
                          {auction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(auction.start_time).toLocaleString()}</TableCell>
                      <TableCell>{new Date(auction.end_time).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuctionUpdate(auction.id, { ...auction, status: 'active' })}
                          >
                            Activate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAuctionDelete(auction.id)}
                            className="text-gray-600 hover:text-red-600 hover:border-red-600"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4">
                <CardTitle>Activity Log</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[300px]">
                    <DateRangePicker
                      value={{
                        from: dateRange.fromFormatted,
                        to: dateRange.toFormatted
                      }}
                      onChange={handleDateRangeChange}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={activityType}
                      onValueChange={handleActivityTypeChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="user">User Activities</SelectItem>
                        <SelectItem value="auction">Auction Activities</SelectItem>
                        <SelectItem value="bid">Bid Activities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchActivityLog(1)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => (
                    <TableRow key={`${activity.id}-${activity.activity_type}-${index}`}>
                      <TableCell>
                        <Badge variant="outline">
                          {activity.activity_type?.replace('new_', '') || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getActivityDescription(activity)}</TableCell>
                      <TableCell>{getActivityUser(activity)}</TableCell>
                      <TableCell>{new Date(activity.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSettingsUpdate(settings);
              }} className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="font-medium">Site Name</label>
                    <p className="text-sm text-muted-foreground">The name of your auction site</p>
                    <Input
                      name="siteName"
                      value={settings.siteName || ''}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="max-w-md"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="font-medium">Registration</label>
                    <p className="text-sm text-muted-foreground">Allow new user registrations</p>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant={settings.registrationEnabled ? "default" : "outline"}
                        onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                        className="max-w-[100px]"
                      >
                        {settings.registrationEnabled ? "Enabled" : "Disabled"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="font-medium">Max Auctions Per User</label>
                    <p className="text-sm text-muted-foreground">Maximum number of auctions a user can create</p>
                    <Input
                      type="number"
                      name="maxAuctionsPerUser"
                      min="1"
                      max="100"
                      value={settings.maxAuctionsPerUser || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        maxAuctionsPerUser: e.target.value 
                      })}
                      className="max-w-[100px]"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="font-medium">Default Auction Duration</label>
                    <p className="text-sm text-muted-foreground">Default duration for new auctions (hours)</p>
                    <Input
                      type="number"
                      name="defaultAuctionDuration"
                      min="1"
                      max="168"
                      value={settings.defaultAuctionDuration || ''}
                      onChange={(e) => setSettings({ 
                        ...settings, 
                        defaultAuctionDuration: e.target.value 
                      })}
                      className="max-w-[100px]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Fetch settings again to reset changes
                      adminService.getSettings().then(response => {
                        if (response.success) {
                          setSettings({
                            ...response.data,
                            maxAuctionsPerUser: String(response.data.maxAuctionsPerUser || '10'),
                            defaultAuctionDuration: String(response.data.defaultAuctionDuration || '24')
                          });
                        }
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage; 