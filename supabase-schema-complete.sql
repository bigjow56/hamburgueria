-- SCHEMA COMPLETO SUPABASE - 24 TABELAS
-- Execute este script no SQL Editor do Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== TABELAS BÁSICAS =====

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT,
    points_balance INTEGER DEFAULT 0,
    loyalty_tier TEXT DEFAULT 'bronze',
    total_points_earned INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by_code TEXT,
    referred_by_id VARCHAR,
    total_referrals INTEGER DEFAULT 0,
    total_referral_points INTEGER DEFAULT 0,
    last_purchase_date TIMESTAMP,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_orders INTEGER DEFAULT 0,
    customer_status TEXT DEFAULT 'active',
    last_contact_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    category_id VARCHAR REFERENCES categories(id) NOT NULL,
    image_url TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_promotion BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id VARCHAR REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_type TEXT DEFAULT 'delivery',
    street_name TEXT,
    house_number TEXT,
    neighborhood TEXT,
    reference_point TEXT,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    order_status TEXT DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    estimated_delivery_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR REFERENCES orders(id) NOT NULL,
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- Store settings table
CREATE TABLE IF NOT EXISTS store_settings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    is_open BOOLEAN DEFAULT true,
    closing_time TEXT DEFAULT '23:00',
    minimum_order_amount DECIMAL(10,2) DEFAULT 25.00,
    delivery_areas JSONB DEFAULT '[]',
    use_neighborhood_delivery BOOLEAN DEFAULT false,
    default_delivery_fee DECIMAL(10,2) DEFAULT 5.90,
    banner_title TEXT DEFAULT 'Hambúrguers',
    banner_description TEXT DEFAULT 'Ingredientes frescos, sabor incomparável.',
    banner_price DECIMAL(10,2) DEFAULT 18.90,
    banner_image_url TEXT DEFAULT '',
    banner_color_1 TEXT DEFAULT '#ff6b35',
    banner_color_2 TEXT DEFAULT '#f7931e',
    banner_color_3 TEXT DEFAULT '#ffd23f',
    banner_color_4 TEXT DEFAULT '#ff8c42',
    banner_background_image TEXT,
    banner_use_image_background BOOLEAN DEFAULT false,
    store_title TEXT DEFAULT 'Nossa Loja',
    site_name TEXT DEFAULT 'Burger House',
    store_image_url TEXT DEFAULT '',
    store_address TEXT DEFAULT 'Rua das Delícias, 123',
    store_neighborhood TEXT DEFAULT 'Centro, São Paulo - SP',
    store_hours TEXT DEFAULT 'Segunda a Sexta: 18h - 23h\nSábado e Domingo: 18h - 00h',
    delivery_time TEXT DEFAULT 'Tempo médio: 30-45 minutos',
    delivery_fee_range TEXT DEFAULT 'Taxa: R$ 3,90 - R$ 8,90',
    payment_methods TEXT DEFAULT 'Dinheiro, Cartão, PIX\nMercado Pago integrado',
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Delivery zones table
CREATE TABLE IF NOT EXISTS delivery_zones (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    neighborhood_name TEXT NOT NULL,
    delivery_fee DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== SISTEMA DE DESPESAS E INGREDIENTES =====

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_price DECIMAL(10,2) DEFAULT 0.00,
    is_removable BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    max_quantity INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product ingredients table
CREATE TABLE IF NOT EXISTS product_ingredients (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    ingredient_id VARCHAR REFERENCES ingredients(id) NOT NULL,
    is_included_by_default BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 1
);

-- Product additionals table
CREATE TABLE IF NOT EXISTS product_additionals (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR REFERENCES products(id) NOT NULL,
    ingredient_id VARCHAR REFERENCES ingredients(id) NOT NULL,
    custom_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

-- Order item modifications table
CREATE TABLE IF NOT EXISTS order_item_modifications (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id VARCHAR REFERENCES order_items(id) NOT NULL,
    ingredient_id VARCHAR REFERENCES ingredients(id) NOT NULL,
    modification_type TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);

-- ===== SISTEMA DE BANNERS =====

-- Banner themes table
CREATE TABLE IF NOT EXISTS banner_themes (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_customizable BOOLEAN DEFAULT false,
    html_content TEXT,
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    gradient_color_1 VARCHAR(7),
    gradient_color_2 VARCHAR(7),
    gradient_color_3 VARCHAR(7),
    gradient_color_4 VARCHAR(7),
    use_background_image BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== SISTEMA DE FIDELIDADE =====

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    order_id VARCHAR REFERENCES orders(id),
    type TEXT NOT NULL,
    points_change INTEGER NOT NULL,
    description TEXT NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    points_required INTEGER NOT NULL,
    category TEXT NOT NULL,
    value DECIMAL(10,2),
    discount_percentage INTEGER,
    image_url TEXT,
    stock INTEGER DEFAULT -1,
    is_active BOOLEAN DEFAULT true,
    min_tier TEXT DEFAULT 'bronze',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty redemptions table
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    reward_id VARCHAR REFERENCES loyalty_rewards(id) NOT NULL,
    points_used INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    redemption_code TEXT UNIQUE,
    admin_note TEXT,
    expires_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Points rules table
CREATE TABLE IF NOT EXISTS points_rules (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    base_points_per_real DECIMAL(5,2) DEFAULT 1.00,
    category_id VARCHAR REFERENCES categories(id),
    category_multiplier DECIMAL(5,2) DEFAULT 1.00,
    tier_name TEXT,
    tier_multiplier DECIMAL(5,2) DEFAULT 1.00,
    action_type TEXT,
    action_points INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Loyalty tiers config table
CREATE TABLE IF NOT EXISTS loyalty_tiers_config (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    color TEXT DEFAULT '#8B5A2B',
    icon TEXT DEFAULT 'medal',
    min_points_required INTEGER DEFAULT 0,
    min_total_spent DECIMAL(10,2) DEFAULT 0.00,
    min_orders_count INTEGER DEFAULT 0,
    points_multiplier DECIMAL(5,2) DEFAULT 1.00,
    free_shipping_enabled BOOLEAN DEFAULT false,
    exclusive_discounts BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    birthday_bonus INTEGER DEFAULT 0,
    benefits TEXT[] DEFAULT '{}',
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    campaign_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    points_multiplier DECIMAL(5,2) DEFAULT 2.00,
    group_goal_target INTEGER,
    group_goal_current INTEGER DEFAULT 0,
    group_goal_reward INTEGER,
    applicable_categories TEXT[] DEFAULT '{}',
    applicable_tiers TEXT[] DEFAULT '{}',
    min_order_amount DECIMAL(10,2),
    max_redemptions_per_user INTEGER DEFAULT -1,
    total_budget DECIMAL(10,2),
    used_budget DECIMAL(10,2) DEFAULT 0.00,
    banner_image_url TEXT,
    background_color TEXT DEFAULT '#ff6b35',
    text_color TEXT DEFAULT '#ffffff',
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===== SISTEMA DE INDICAÇÕES AVANÇADO =====

-- Referral transactions table
CREATE TABLE IF NOT EXISTS referral_transactions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id VARCHAR NOT NULL,
    referred_id VARCHAR NOT NULL,
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    points_awarded INTEGER DEFAULT 0,
    order_value DECIMAL(10,2),
    validated_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    streak_type TEXT NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date TIMESTAMP,
    bonus_points_earned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seasonal rewards table
CREATE TABLE IF NOT EXISTS seasonal_rewards (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    season TEXT NOT NULL,
    year INTEGER NOT NULL,
    points_required INTEGER NOT NULL,
    category TEXT NOT NULL,
    value DECIMAL(10,2),
    discount_percentage INTEGER,
    image_url TEXT,
    stock INTEGER DEFAULT -1,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    min_tier TEXT DEFAULT 'bronze',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reward analytics table
CREATE TABLE IF NOT EXISTS reward_analytics (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id VARCHAR REFERENCES loyalty_rewards(id) NOT NULL,
    period TEXT NOT NULL,
    period_date TIMESTAMP NOT NULL,
    redemptions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    total_points_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ===== ÍNDICES PARA PERFORMANCE =====

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_rules_category_id ON points_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_additionals_product_id ON product_additionals(product_id);
CREATE INDEX IF NOT EXISTS idx_order_item_modifications_order_item_id ON order_item_modifications(order_item_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_user_id ON loyalty_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_analytics_reward_id ON reward_analytics(reward_id);