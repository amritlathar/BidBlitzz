-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL DEFAULT 'Auction Site',
    registration_enabled BOOLEAN DEFAULT true,
    max_auctions_per_user INTEGER DEFAULT 10,
    default_auction_duration INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one row exists
CREATE OR REPLACE FUNCTION ensure_single_settings_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM settings) > 1 THEN
        RAISE EXCEPTION 'Only one settings row is allowed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_settings_row
AFTER INSERT ON settings
FOR EACH ROW
EXECUTE FUNCTION ensure_single_settings_row();

-- Update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_timestamp
BEFORE UPDATE ON settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_timestamp(); 