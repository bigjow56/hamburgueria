# GUIA COMPLETO: Importação Supabase - 227 Registros

## ✅ ARQUIVOS EXPORTADOS (16 TOTAL)

### 📁 CSVs Básicos (70 registros):
- categories.csv (4 registros)
- admin_users.csv (1 registro) 
- users.csv (13 registros)
- products.csv (22 registros)
- orders.csv (5 registros)
- order_items.csv (2 registros)
- store_settings.csv (1 registro)
- loyalty_transactions.csv (6 registros)
- loyalty_rewards.csv (6 registros)
- points_rules.csv (4 registros)
- loyalty_tiers_config.csv (3 registros)
- campaigns.csv (3 registros)

### 📁 CSVs Adicionais (157 registros):
- ingredients.csv (29 registros)
- product_ingredients.csv (60 registros)
- product_additionals.csv (60 registros)
- banner_themes.csv (8 registros)

**TOTAL: 227 registros em 16 arquivos**

## 🔐 PASSO 1: SEGURANÇA CRÍTICA
1. Acesse: https://app.supabase.com/project/miwlmxcfbcaefmcmfvmf/settings/database
2. **ALTERE A SENHA** imediatamente
3. Copie a nova connection string

## 🏗️ PASSO 2: CRIAR SCHEMA COMPLETO
1. Vá para SQL Editor do Supabase
2. Cole e execute: `supabase-schema-complete.sql`
3. ✅ Isso criará todas as **24 tabelas**

## 📥 PASSO 3: IMPORTAR DADOS (ORDEM OBRIGATÓRIA)

### GRUPO 1: Tabelas Independentes
1. **categories.csv** → `categories`
2. **admin_users.csv** → `admin_users` 
3. **users.csv** → `users`
4. **store_settings.csv** → `store_settings`
5. **ingredients.csv** → `ingredients`
6. **loyalty_rewards.csv** → `loyalty_rewards`
7. **loyalty_tiers_config.csv** → `loyalty_tiers_config`
8. **campaigns.csv** → `campaigns`
9. **banner_themes.csv** → `banner_themes`

### GRUPO 2: Tabelas com Foreign Keys
10. **products.csv** → `products` (depende de categories)
11. **product_ingredients.csv** → `product_ingredients` (depende de products + ingredients)
12. **product_additionals.csv** → `product_additionals` (depende de products + ingredients)
13. **orders.csv** → `orders` (depende de users) 
14. **order_items.csv** → `order_items` (depende de orders + products)
15. **loyalty_transactions.csv** → `loyalty_transactions` (depende de users + orders)
16. **points_rules.csv** → `points_rules` (depende de categories)

## 📋 COMO IMPORTAR CADA CSV:

Para **CADA** arquivo:
1. Table Editor → Selecione a tabela
2. Botão "Insert" → "Import data from CSV"
3. Upload do arquivo correspondente
4. Verifique mapeamento das colunas
5. Clique "Import"
6. **Siga a ordem EXATA acima**

## 🔄 PASSO 4: ATUALIZAR APLICAÇÃO
```env
# Substituir no .env:
DATABASE_URL="postgresql://postgres:SUA_NOVA_SENHA@db.miwlmxcfbcaefmcmfvmf.supabase.co:5432/postgres"
```

## ✅ PASSO 5: VERIFICAÇÃO FINAL
1. `npm run dev`
2. Login admin: `admin` / `admin123`
3. Verificar produtos, clientes, e painel admin
4. Confirmar sistema de fidelidade funcionando

## 🚨 TROUBLESHOOTING
- **Erro de Foreign Key**: Importe na ordem exata acima
- **UUIDs incorretos**: Verifique se preservou o formato original
- **Timestamps**: Confirme formato de data/hora
- **Arrays PostgreSQL**: Alguns campos podem precisar formatação especial

## 📊 RESUMO DA MIGRAÇÃO
- **Origem**: Neon Database (24 tabelas)
- **Destino**: Supabase (24 tabelas)
- **Dados**: 227 registros preservados
- **Sistema**: Completo com fidelidade, referrals, ingredientes, banners

✅ **MIGRAÇÃO COMPLETA PRONTA!**