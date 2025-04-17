import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import adminService from '../services/adminService';
import { showToast } from '../utils/toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const ActivityOverview = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('bar');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminService.getActivityData();
        if (response.success) {
          setChartData(response.data);
          if (response.data.length === 0) {
            setError('No activity data available for the selected period.');
          }
        }
      } catch (error) {
        console.error('Failed to load activity data:', error);
        setError('Failed to load activity data. Please try again later.');
        showToast.error('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-72">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-72">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Overview</CardTitle>
        <Tabs
          value={viewType}
          onValueChange={setViewType}
          className="w-auto"
        >
          <TabsList className="grid w-28 grid-cols-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-72">
            <p className="text-muted-foreground mb-4">No activity data available for the selected period.</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            {viewType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`} 
                />
                <Legend />
                <Bar dataKey="logins" name="Logins" fill="#8884d8" />
                <Bar dataKey="registrations" name="New Users" fill="#82ca9d" />
                <Bar dataKey="auctions" name="New Auctions" fill="#ffc658" />
                <Bar dataKey="bids" name="Bids" fill="#ff8042" />
              </BarChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{
                  top: 5, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="logins" 
                  name="Logins" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  name="New Users" 
                  stroke="#82ca9d" 
                />
                <Line 
                  type="monotone" 
                  dataKey="auctions" 
                  name="New Auctions" 
                  stroke="#ffc658" 
                />
                <Line 
                  type="monotone" 
                  dataKey="bids" 
                  name="Bids" 
                  stroke="#ff8042" 
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityOverview; 