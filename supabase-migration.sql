-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela categories
CREATE TABLE IF NOT EXISTS categories (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL,
  display_order integer DEFAULT 0
);

-- Criar tabela products
CREATE TABLE IF NOT EXISTS products (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal(10,2) NOT NULL,
  original_price decimal(10,2),
  category_id varchar REFERENCES categories(id) NOT NULL,
  image_url text NOT NULL,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_promotion boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Criar tabela store_settings
CREATE TABLE IF NOT EXISTS store_settings (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open boolean DEFAULT true,
  closing_time text DEFAULT '23:00',
  minimum_order_amount decimal(10,2) DEFAULT 25.00,
  delivery_areas jsonb DEFAULT '[]'::jsonb,
  use_neighborhood_delivery boolean DEFAULT false,
  default_delivery_fee decimal(10,2) DEFAULT 5.90,
  banner_title text DEFAULT 'Hambúrguers',
  banner_description text DEFAULT 'Ingredientes frescos, sabor incomparável.',
  banner_price decimal(10,2) DEFAULT 18.90,
  banner_image_url text,
  store_title text DEFAULT 'Nossa Loja',
  store_image_url text,
  store_address text DEFAULT 'Rua das Delícias, 123',
  store_neighborhood text DEFAULT 'Centro, São Paulo - SP',
  store_hours text DEFAULT 'Segunda a Sexta: 18h - 23h + Sábado e Domingo: 18h - 00h',
  delivery_time text DEFAULT 'Tempo médio: 30-45 minutos',
  delivery_fee_range text DEFAULT 'Taxa: R$ 3,90 - R$ 8,90',
  payment_methods text DEFAULT 'Dinheiro, Cartão, PIX + Mercado Pago integrado',
  updated_at timestamp DEFAULT now()
);

-- Criar outras tabelas necessárias
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text NOT NULL,
  address text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  user_id varchar REFERENCES users(id),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  street_name text NOT NULL,
  house_number text NOT NULL,
  neighborhood text NOT NULL,
  reference_point text,
  payment_method text NOT NULL,
  payment_status text DEFAULT 'pending',
  order_status text DEFAULT 'pending',
  subtotal decimal(10,2) NOT NULL,
  delivery_fee decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  special_instructions text,
  estimated_delivery_time integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id varchar REFERENCES orders(id) NOT NULL,
  product_id varchar REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_name text NOT NULL,
  delivery_fee decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Inserir categorias
INSERT INTO categories (id, name, slug, icon, display_order) VALUES 
('03e8cd9b-8b1b-4a45-aa29-cc861c3a7a0f', 'Promoções', 'promotions', '🏷️', 6),
('25929677-58da-43ca-b627-5b7a989193c3', 'Combos', 'combos', '📦', 5),
('4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'Hambúrguers', 'hamburgers', '🍔', 1),
('49cc6dfa-518d-4ccc-821c-794f535385c2', 'Sobremesas', 'desserts', '🍨', 4),
('7d4c0db1-94f1-4448-95f7-7d367e669cbc', 'Acompanhamentos', 'sides', '🍟', 2),
('cfee3851-0ce2-4e7a-bd0a-f8429258a696', 'Bebidas', 'drinks', '🥤', 3)
ON CONFLICT (id) DO NOTHING;

-- Inserir produtos
INSERT INTO products (id, name, description, price, original_price, category_id, image_url, is_available, is_featured, is_promotion, created_at) VALUES 
('0045b99f-002b-4c2a-a2d3-2bd7d8cf77d9', 'Onion Rings', '8 anéis de cebola empanados e fritos', 10.90, null, '7d4c0db1-94f1-4448-95f7-7d367e669cbc', 'https://images.unsplash.com/photo-1639024471283-03518883512d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('18fc1ca8-b949-4508-8388-3908e7a7ee1a', 'X-Bacon Deluxe', 'Hambúrguer 180g, bacon crocante, queijo cheddar, alface, tomate e molho especial', 10.00, 22.90, '4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, true, false, '2025-08-29 16:54:43.214'),
('23898b24-d78e-4392-883d-f2696da351c2', 'Batata Frita Grande', 'Porção generosa de batatas fritas douradas e crocantes', 12.90, null, '7d4c0db1-94f1-4448-95f7-7d367e669cbc', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('2b86ce0a-e17d-45a7-ba93-56d0c8bb6b40', 'Classic Cheese', 'Hambúrguer 150g, queijo, alface, tomate, cebola e ketchup', 15.90, 18.90, '4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, true, true, '2025-08-29 16:54:43.214'),
('2d1e2b3a-1c12-408b-973e-24778d13c923', 'Água Mineral 500ml', 'Água mineral natural gelada', 3.50, null, 'cfee3851-0ce2-4e7a-bd0a-f8429258a696', 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('31607028-42a2-48fa-8e64-84c7f0283d3f', 'Nuggets (10 unidades)', 'Nuggets de frango crocantes com molho barbecue', 14.90, null, '7d4c0db1-94f1-4448-95f7-7d367e669cbc', 'https://images.unsplash.com/photo-1562967914-608f82629710?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('414dd732-84b8-4ca9-ba52-da7f410747e5', 'X-Salada', 'Hambúrguer 120g, queijo, alface, tomate e maionese', 12.90, null, '4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:43.214'),
('484b8c26-0406-44cc-a372-74e9de81ac5e', 'Combo X-Bacon', 'X-Bacon + Batata Grande + Refri 350ml', 32.90, 38.70, '25929677-58da-43ca-b627-5b7a989193c3', 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, true, '2025-08-29 16:55:06.792'),
('7b5fe1d6-8a0f-4209-a4f5-7f5b09de8560', 'Milk-shake Chocolate', 'Milk-shake cremoso de chocolate com chantilly', 9.90, null, '49cc6dfa-518d-4ccc-821c-794f535385c2', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('806f3663-f51f-4371-8e68-63e2a21d3af7', 'X-Tudo', 'Hambúrguer 200g, bacon, queijo, ovo, presunto, alface, tomate', 28.90, null, '4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:43.214'),
('a513db62-c2ac-4a86-81fd-6aefebb84122', 'Veggie Gourmet', 'Hambúrguer vegetal, queijo, rúcula, tomate seco e maionese de ervas', 19.90, null, '4512f0a1-ee7b-4d08-bd9c-f4ded1003a43', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, true, false, '2025-08-29 16:54:43.214'),
('a87bff59-c801-4b7e-8217-0627c54db183', 'Coca-Cola 350ml', 'Refrigerante Coca-Cola gelado', 4.90, null, 'cfee3851-0ce2-4e7a-bd0a-f8429258a696', 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('f06d6273-d9dc-44d6-b72d-7fe7461b530a', 'Torta de Morango', 'Fatia de torta de morango com creme', 8.90, null, '49cc6dfa-518d-4ccc-821c-794f535385c2', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('f75eeaec-7ecc-4ede-b1df-d5a31802dfda', 'Suco Natural Laranja', 'Suco natural de laranja 400ml', 7.90, null, 'cfee3851-0ce2-4e7a-bd0a-f8429258a696', 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400', true, false, false, '2025-08-29 16:54:59.791'),
('05484828-2495-4a30-8e15-41da2b92898a', 'Água 500ml', 'água mineral 500ml gelada', 2.00, null, 'cfee3851-0ce2-4e7a-bd0a-f8429258a696', 'https://imgs.search.brave.com/9IG33zCj4RyzLVDc3mGfJXNFYevwomQ7D1Y9oUXHfBk/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NTFVUGJHMlBuQkwu/anBn', true, false, false, '2025-08-30 00:35:12.799141')
ON CONFLICT (id) DO NOTHING;

-- Inserir configurações da loja
INSERT INTO store_settings (id, is_open, closing_time, minimum_order_amount, delivery_areas, use_neighborhood_delivery, default_delivery_fee, banner_title, banner_description, banner_price, banner_image_url, store_title, store_image_url, store_address, store_neighborhood, store_hours, delivery_time, delivery_fee_range, payment_methods, updated_at) 
VALUES ('eade1fbf-cb41-4b42-b6fe-a278708e6799', true, '23:00', 25.00, '[]'::jsonb, false, 5.90, 'Hambúrguers', 'Ingredientes frescos, sabor incomparável.', 18.90, null, 'Nossa Loja', null, 'Rua das Delícias, 123', 'Centro, São Paulo - SP', 'Segunda a Sexta: 18h - 23h + Sábado e Domingo: 18h - 00h', 'Tempo médio: 30-45 minutos', 'Taxa: R$ 3,90 - R$ 8,90', 'Dinheiro, Cartão, PIX + Mercado Pago integrado', '2025-08-30 00:30:19.514') 
ON CONFLICT (id) DO NOTHING;