
-- ============================================
-- WME AGENCY - COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    points INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES profiles(id),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CELEBRITIES TABLE
CREATE TABLE IF NOT EXISTS celebrities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Acting Talent', 'Music', 'Sports', 'Fashion', 'Comedy')),
    image_url TEXT,
    bio TEXT,
    rate_range TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    points_multiplier INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    celebrity_id INTEGER REFERENCES celebrities(id),
    event_name TEXT NOT NULL,
    event_type TEXT,
    event_date DATE NOT NULL,
    event_location TEXT NOT NULL,
    budget DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'confirmed', 'rejected', 'cancelled')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    special_requests TEXT,
    total_amount DECIMAL(10,2),
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('card', 'cashapp', 'crypto', 'bank_transfer', 'points')),
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    proof_image TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POINTS_TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS points_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type TEXT CHECK (type IN ('earn', 'spend', 'bonus', 'referral')),
    source TEXT,
    reference_id INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. ACTIVITY_LOG TABLE
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT,
    type TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. BTS_CONTENT TABLE (Behind The Scenes)
CREATE TABLE IF NOT EXISTS bts_content (
    id SERIAL PRIMARY KEY,
    celebrity_id INTEGER REFERENCES celebrities(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    type TEXT CHECK (type IN ('video', 'image')),
    is_premium BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    community_id TEXT,
    user_id UUID REFERENCES profiles(id),
    user_name TEXT,
    user_avatar TEXT,
    message TEXT,
    is_fake BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. NEWS_ARTICLES TABLE
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    category TEXT CHECK (category IN ('announcement', 'celebrity', 'industry', 'community')),
    author TEXT,
    read_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    name TEXT,
    role TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    text TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_chat_messages_community_id ON chat_messages(community_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- ============================================
-- CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update user rank based on points
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET rank = (
        SELECT COUNT(*) + 1 FROM profiles WHERE points > NEW.points
    ) WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rank_on_points_change AFTER UPDATE OF points ON profiles FOR EACH ROW EXECUTE FUNCTION update_user_rank();

-- Add points when user registers (welcome bonus)
CREATE OR REPLACE FUNCTION add_welcome_bonus()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO points_transactions (user_id, points, type, source, description)
    VALUES (NEW.id, 100, 'bonus', 'welcome', 'Welcome bonus points');
    
    UPDATE profiles SET points = points + 100 WHERE id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER welcome_bonus_trigger AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION add_welcome_bonus();

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Sample Celebrities
INSERT INTO celebrities (name, category, bio, rate_range, is_featured) VALUES
('Zendaya', 'Acting Talent', 'Emmy-winning actress and fashion icon', '$800k - $3M+', TRUE),
('Dwayne Johnson', 'Acting Talent', 'The Rock — box office legend', '$1M - $5M+', TRUE),
('Taylor Swift', 'Music', 'Grammy-winning phenomenon', '$2M - $8M+', TRUE),
('Bad Bunny', 'Music', 'Global reggaeton superstar', '$1M - $4M+', TRUE),
('Simone Biles', 'Sports', 'Most decorated gymnast', '$300k - $1.2M+', TRUE),
('The Weeknd', 'Music', 'Multi-platinum artist', '$1.5M - $5M+', TRUE);

-- Sample News Articles
INSERT INTO news_articles (title, excerpt, content, category, author, read_time) VALUES
('WME Agency Launches Premium Membership', 'Get exclusive access to celebrity bookings and special perks.', 'Full content here...', 'announcement', 'WME Team', '3 min read'),
('Zendaya Signs Exclusive Deal', 'Emmy-winning actress extends partnership with WME.', 'Full content here...', 'celebrity', 'Entertainment Desk', '4 min read');

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Bookings: Users can view their own bookings, admins can view all
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON bookings FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Payments: Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON payments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Points transactions: Users can view their own
CREATE POLICY "Users can view own points" ON points_transactions FOR SELECT USING (auth.uid() = user_id);