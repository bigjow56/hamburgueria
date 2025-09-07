# Replit.md

## Overview

This is a hamburger delivery website built with React, Express, and PostgreSQL. The application provides a complete online ordering system for a local hamburger restaurant, featuring a responsive product catalog, shopping cart functionality, and checkout process. The system includes both customer-facing features and backend order management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2025-01-07: Painel Administrativo do Sistema de Fidelidade Implementado

**Sistema Completo de Admin:**
- **Painel Admin Completo**: Interface administrativa completa para gerenciamento do programa de fidelidade
- **Autenticação Admin**: Sistema de login seguro com bcrypt (usuário: admin, senha: admin123)
- **Dashboard com Estatísticas**: Visão geral com métricas em tempo real
- **4 Módulos Principais**: Recompensas, Regras de Pontos, Tiers de Fidelidade, e Campanhas

**Funcionalidades Implementadas:**
- **Gerenciamento de Recompensas**: CRUD completo com categorias, estoque, e critérios de elegibilidade
- **Configuração de Pontos**: Regras flexíveis (base, multiplicadores, bônus por ação)
- **Tiers de Fidelidade**: Configuração de níveis com benefícios personalizados
- **Campanhas Especiais**: Eventos promocionais com metas de grupo e multiplicadores

**Arquitetura Backend:**
- **6 Novas Tabelas**: admin_users, loyalty_rewards, points_rules, loyalty_tiers_config, campaigns, campaign_participants
- **APIs Completas**: Endpoints REST para todas as operações CRUD
- **Validação de Dados**: Schemas Zod integrados para segurança

**Interface de Usuário:**
- **Design Responsivo**: Compatível com desktop e mobile usando Tailwind CSS
- **Componentes Reutilizáveis**: shadcn/ui components para consistência
- **Sidebar Navegação**: Interface intuitiva com 4 seções principais
- **Formulários Dinâmicos**: Forms adaptativos baseados no tipo de configuração

### 2025-01-04: Sistema de Banners Temáticos Implementado

**Funcionalidades Adicionadas:**
- **Tabela `banner_themes`**: Armazena banners personalizáveis e com HTML completo
- **5 Endpoints da API**: GET /api/active-banner, GET/POST/PUT /api/banners, PUT /api/banners/:id/activate
- **Script de Seed**: Ferramenta para adicionar banners no banco (`scripts/seed-banners.ts`)
- **Banner Black Friday**: Primeira implementação com HTML animado completo

**Arquitetura do Sistema:**
- **Banners Customizáveis**: Suportam campos individuais (título, preço, cores de gradiente)
- **Banners HTML**: Permitem código HTML completo para designs complexos
- **Ativação Exclusiva**: Apenas um banner pode estar ativo por vez
- **Script de Migração**: Usa `npm run db:push` para aplicar mudanças no schema

**Campos da Tabela banner_themes:**
- `name, isCustomizable, htmlContent, title, description, price, imageUrl`
- `gradientColor1-4, useBackgroundImage, isActive, createdAt`

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TailwindCSS** for styling with shadcn/ui component library
- **TanStack Query** for server state management and API calls

**Component Structure:**
- Modular component architecture with separate UI components in `/client/src/components/ui/`
- Business logic components in `/client/src/components/` (header, cart, product cards, etc.)
- Page-level components in `/client/src/pages/` (home, checkout, not-found)
- Custom hooks for state management (`use-cart`, `use-toast`, `use-mobile`)

**Key Features:**
- Responsive design optimized for mobile and desktop
- Shopping cart with persistent localStorage
- Product catalog with category filtering and search
- Real-time store status (open/closed)
- Checkout form with order processing

### Backend Architecture

**Technology Stack:**
- **Express.js** server with TypeScript
- **Drizzle ORM** for database operations
- **Neon Database** (PostgreSQL) for data persistence
- **Zod** for request validation and schema definitions

**API Structure:**
- RESTful API endpoints under `/api/` prefix
- Centralized route handling in `/server/routes.ts`
- Database abstraction layer in `/server/storage.ts`
- Shared schema definitions in `/shared/schema.ts`

**Database Design:**
- **Users table**: Customer information and profiles
- **Categories table**: Product organization (hamburgers, sides, drinks, etc.)
- **Products table**: Menu items with pricing, descriptions, and availability
- **Orders table**: Order tracking with customer details and status
- **Order Items table**: Individual items within orders
- **Store Settings table**: Configurable store hours and operational settings

### Data Storage Solutions

**Primary Database:**
- PostgreSQL via Neon Database (serverless)
- Drizzle ORM with type-safe queries
- Schema-first approach with automatic TypeScript generation
- Database migrations managed through Drizzle Kit

**Client-Side Storage:**
- localStorage for shopping cart persistence
- Session storage for temporary UI state
- React Query cache for server state management

### Authentication and Authorization

**Current Implementation:**
- Basic order processing without user authentication
- Guest checkout functionality
- Phone number and email collection for order tracking

**Future Considerations:**
- User account system for order history
- Admin panel authentication for store management
- Role-based access control for different user types

## External Dependencies

### Database and Backend Services
- **@neondatabase/serverless**: PostgreSQL database connection and query execution
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-kit**: Database migration and schema management tools

### Frontend UI and Styling
- **@radix-ui/react-***: Accessible, unstyled UI primitives for complex components
- **class-variance-authority**: Utility for creating consistent component variants
- **tailwindcss**: Utility-first CSS framework for rapid styling
- **lucide-react**: Icon library for consistent iconography

### State Management and API
- **@tanstack/react-query**: Server state management, caching, and synchronization
- **wouter**: Lightweight routing solution for React applications

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **zod**: Runtime type validation and schema definitions

### Payment Processing (Planned)
- Integration ready for Mercado Pago or PagSeguro payment gateways
- Webhook handling for payment status updates
- Order status management based on payment confirmation

### Deployment Considerations
- **Replit-specific optimizations**: Custom Vite plugins for Replit environment
- **Environment variables**: Database URL and API keys configuration
- **Static file serving**: Production build optimization for client assets