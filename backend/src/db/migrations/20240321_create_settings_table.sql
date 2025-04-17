CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Auction System',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    registration_enabled BOOLEAN NOT NULL DEFAULT true,
    max_auctions_per_user INTEGER NOT NULL DEFAULT 5,
    auction_duration INTEGER NOT NULL DEFAULT 24,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 