import pool from '../db/index.js';
import  Auction  from '../models/auctionModel.js';
import { updateUser, deleteUser } from '../models/user.js';
import * as Settings from '../models/settingsModel.js';

export const getAnalytics = async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total);

    // Get total auctions and their stats
    const auctionsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN start_time <= NOW() AND end_time > NOW() THEN 1 END) as active,
        COUNT(CASE WHEN start_time > NOW() THEN 1 END) as upcoming,
        COUNT(CASE WHEN end_time <= NOW() THEN 1 END) as completed,
        SUM(views) as total_views
      FROM auctions
    `);
    const auctionStats = auctionsResult.rows[0];

    // Get total starred (favorites)
    const starredResult = await pool.query('SELECT COUNT(*) as total FROM favorites');
    const totalStarred = parseInt(starredResult.rows[0].total);

    // Get total bids
    const bidsResult = await pool.query('SELECT COUNT(*) as total FROM bids');
    const totalBids = parseInt(bidsResult.rows[0].total);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAuctions: parseInt(auctionStats.total),
        totalBids,
        totalViews: parseInt(auctionStats.total_views) || 0,
        totalStarred,
        activeAuctions: parseInt(auctionStats.active),
        upcomingAuctions: parseInt(auctionStats.upcoming),
        completedAuctions: parseInt(auctionStats.completed)
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    
    // Build the query with search and sorting
    let query = `
      SELECT 
        id, email, full_name, contact, avatar, role, created_at,
        (SELECT COUNT(*) FROM auctions WHERE seller_id = users.id) as auctions_created,
        (SELECT COUNT(*) FROM bids WHERE bidder_id = users.id) as total_bids,
        (SELECT COUNT(*) FROM auctions WHERE winner_id = users.id) as auctions_won
      FROM users
    `;
    
    // Add search condition if search parameter is provided
    const queryParams = [];
    if (search) {
      query += ` WHERE (email ILIKE $1 OR full_name ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }
    
    // Add sorting
    const validSortColumns = ['id', 'email', 'full_name', 'created_at', 'role'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';
    
    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), offset);
    
    console.log('User search query:', { query, params: queryParams });
    
    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length 
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

export const handleUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    const updatedUser = await updateUser(id, userData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

export const handleDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUser(id);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

export const getAuctions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      search = '', 
      sortBy = 'created_at', 
      sortOrder = 'desc' 
    } = req.query;
    
    // Build the base query
    let query = `
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        CASE 
          WHEN a.start_time > NOW() THEN 'upcoming'
          WHEN a.start_time <= NOW() AND a.end_time > NOW() THEN 'active'
          ELSE 'completed'
        END as status
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
    `;
    
    // Add conditions
    const queryParams = [];
    const conditions = [];
    
    // Add search
    if (search) {
      conditions.push(`(a.title ILIKE $${queryParams.length + 1} OR a.description ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }
    
    // Add status filter
    if (status) {
      if (status === 'active') {
        conditions.push(`(a.start_time <= NOW() AND a.end_time > NOW())`);
      } else if (status === 'upcoming') {
        conditions.push(`(a.start_time > NOW())`);
      } else if (status === 'completed') {
        conditions.push(`(a.end_time <= NOW())`);
      }
    }
    
    // Add WHERE clause if we have conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add sorting
    const validSortColumns = ['title', 'start_time', 'end_time', 'current_price', 'created_at'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';
    
    query += ` ORDER BY a.${finalSortBy} ${finalSortOrder}`;
    
    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), offset);
    
    console.log('Auction search query:', { query, params: queryParams });
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length // This should ideally be a separate count query
      }
    });
  } catch (error) {
    console.error('Error getting auctions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions'
    });
  }
};

export const updateAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, startTime, endTime } = req.body;

    const updatedAuction = await Auction.updateAuction(id, {
      title,
      description,
      category,
      startTime,
      endTime
    });

    res.json({
      success: true,
      message: 'Auction updated successfully',
      data: updatedAuction
    });
  } catch (error) {
    console.error('Error updating auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update auction'
    });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    await Auction.deleteAuction(id);
    
    res.json({
      success: true,
      message: 'Auction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting auction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete auction'
    });
  }
};

export const getActivityLog = async (req, res) => {
  try {
    const { type = '', startDate = '', endDate = '', page = 1, limit = 20 } = req.query;
    
    // Apply date filtering for activity log if provided
    let dateFilter = '';
    const queryParams = [];
    
    if (startDate && endDate) {
      dateFilter = ' WHERE created_at BETWEEN $1 AND $2';
      queryParams.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter = ' WHERE created_at >= $1';
      queryParams.push(new Date(startDate));
    } else if (endDate) {
      dateFilter = ' WHERE created_at <= $1';
      queryParams.push(new Date(endDate));
    }
    

    let activityLogs = [];
    try {
      let activityTypeFilter = '';
      if (type && dateFilter) {
        activityTypeFilter = ` AND type = $${queryParams.length + 1}`;
        queryParams.push(type);
      } else if (type) {
        activityTypeFilter = ' WHERE type = $1';
        queryParams.push(type);
      }
      
      const activityQuery = `
        SELECT 
          al.id,
          al.type as activity_type,
          al.created_at,
          u.full_name,
          al.details::text as details
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ${dateFilter}${activityTypeFilter}
        ORDER BY al.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      queryParams.push(parseInt(limit), offset);
      
      console.log('Activity log query:', { query: activityQuery, params: queryParams });
      
      const activityResult = await pool.query(activityQuery, queryParams);
      activityLogs = activityResult.rows.map(a => ({ ...a, source: 'activity_log' }));
    } catch (error) {
      console.log('Activity log query failed:', error.message);
      
    }
    
    // If we have filtered results from activity_log or need specific types, return those
    if (activityLogs.length > 0 || type || startDate || endDate) {
      return res.json({
        success: true,
        message: 'Activity log fetched successfully',
        data: activityLogs
      });
    }
    
    // Fallback to old data sources if no activity_log or no filters
    // Get recent user registrations
    const newUsers = await pool.query(`
      SELECT id, full_name, email, created_at, 'new_user' as activity_type
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get recent auctions
    const newAuctions = await pool.query(`
      SELECT 
        a.id, 
        a.title, 
        a.created_at, 
        u.full_name as creator_name,
        'new_auction' as activity_type
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    // Get recent bids
    const recentBids = await pool.query(`
      SELECT 
        b.id,
        b.amount,
        b.created_at,
        u.full_name as bidder_name,
        a.title as auction_title,
        'new_bid' as activity_type
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      JOIN auctions a ON b.auction_id = a.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    // Combine and sort all activities
    const allActivities = [
      ...newUsers.rows.map(u => ({ ...u, source: 'users' })),
      ...newAuctions.rows.map(a => ({ ...a, source: 'auctions' })),
      ...recentBids.rows.map(b => ({ ...b, source: 'bids' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      message: 'Activity log fetched successfully',
      data: allActivities.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Error getting activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log'
    });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Convert to frontend format
    const formattedSettings = {
      siteName: settings.site_name,
      registrationEnabled: settings.registration_enabled,
      maxAuctionsPerUser: settings.max_auctions_per_user,
      defaultAuctionDuration: settings.default_auction_duration
    };

    res.json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    // Validate settings
    if (typeof settings.siteName !== 'string' || settings.siteName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Site name is required'
      });
    }

    if (typeof settings.maxAuctionsPerUser !== 'number' || settings.maxAuctionsPerUser < 1) {
      return res.status(400).json({
        success: false,
        message: 'Max auctions per user must be a positive number'
      });
    }

    if (typeof settings.defaultAuctionDuration !== 'number' || settings.defaultAuctionDuration < 1) {
      return res.status(400).json({
        success: false,
        message: 'Default auction duration must be a positive number'
      });
    }

    const updatedSettings = await Settings.updateSettings(settings);
    
    // Convert to frontend format
    const formattedSettings = {
      siteName: updatedSettings.site_name,
      registrationEnabled: updatedSettings.registration_enabled,
      maxAuctionsPerUser: updatedSettings.max_auctions_per_user,
      defaultAuctionDuration: updatedSettings.default_auction_duration
    };

    res.json({
      success: true,
      data: formattedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

export const getActivityData = async (req, res) => {
  try {
    // Get activity data aggregated by day for the past month
    const result = await pool.query(`
      SELECT 
        date_trunc('day', created_at) as date,
        COUNT(CASE WHEN type = 'login' THEN 1 END) as logins,
        COUNT(CASE WHEN type = 'registration' THEN 1 END) as registrations,
        COUNT(CASE WHEN type = 'auction_created' THEN 1 END) as auctions,
        COUNT(CASE WHEN type = 'bid_placed' THEN 1 END) as bids
      FROM activity_log
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    `);

    // Transform the data into the format expected by the chart
    const formattedData = result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      logins: parseInt(row.logins || 0),
      registrations: parseInt(row.registrations || 0),
      auctions: parseInt(row.auctions || 0),
      bids: parseInt(row.bids || 0)
    }));

    // If no data exists, return empty array instead of generating fake data
    if (formattedData.length === 0) {
      console.log('No activity data found in the database');
      return res.json({
        success: true,
        data: []
      });
    }

    console.log(`Found ${formattedData.length} days of activity data`);
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error getting activity data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity data'
    });
  }
}; 