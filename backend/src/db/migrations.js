import pool from './index.js';

const createUsersTableQuery = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    contact VARCHAR(10),
    avatar VARCHAR(255),
    avatar_public_id VARCHAR(255),
    refresh_token VARCHAR(255),
    role VARCHAR(10) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

const createAuctionsTableQuery = `
-- Create enum types first
DO $$ BEGIN
    CREATE TYPE auction_category AS ENUM ('Electronics', 'Collectibles', 'Fashion', 'Home', 'Sports', 'Toys', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE auction_status AS ENUM ('live', 'completed', 'upcoming');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS auctions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(255),
    views INTEGER DEFAULT 0,
    category auction_category NOT NULL,
    starting_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winner_id INTEGER REFERENCES users(id),
    status auction_status DEFAULT 'live',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_price CHECK (starting_price > 0),
    CONSTRAINT check_end_time CHECK (end_time > start_time)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_auctions_seller_id ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_start_time ON auctions(start_time);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
`;

const createBidsTableQuery = `
CREATE TABLE IF NOT EXISTS bids (
    id SERIAL PRIMARY KEY,
    auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_bid_amount CHECK (amount > 0)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
`;

const createFavoritesTableQuery = `
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    auction_id INTEGER NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_auction UNIQUE(user_id, auction_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_auction_id ON favorites(auction_id);
`;

export async function getDatabaseName() {
  try {
    const result = await pool.query('SELECT current_database()');
    return result.rows[0].current_database;
  } catch (error) {
    console.error('Error getting database name:', error);
    throw error;
  }
}

export async function runMigrations() {
  try {
    // Execute the SQL queries in sequence
    console.log('Creating users table...');
    await pool.query(createUsersTableQuery);
    
    console.log('Creating auctions table...');
    await pool.query(createAuctionsTableQuery);
    
    console.log('Creating bids table...');
    await pool.query(createBidsTableQuery);
    
    console.log('Creating favorites table...');
    await pool.query(createFavoritesTableQuery);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}