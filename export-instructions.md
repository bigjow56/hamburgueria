# Como exportar dados do Supabase

Como não conseguimos conectar diretamente ao seu Supabase, você pode exportar os dados manualmente:

## Opção 1: Via Interface Supabase
1. Acesse seu projeto no Supabase Dashboard
2. Vá para "Table Editor"
3. Para cada tabela, clique nos 3 pontos e escolha "Export as CSV"

## Opção 2: Via SQL (recomendado)
Execute estas consultas no SQL Editor do Supabase e salve os resultados:

### Categories
```sql
SELECT * FROM categories ORDER BY display_order;
```

### Products  
```sql
SELECT * FROM products ORDER BY created_at;
```

### Users
```sql
SELECT * FROM users ORDER BY created_at;
```

### Orders
```sql
SELECT * FROM orders ORDER BY created_at;
```

### Order Items
```sql
SELECT * FROM order_items;
```

### Store Settings
```sql
SELECT * FROM store_settings;
```

### Delivery Zones (se existir)
```sql
SELECT * FROM delivery_zones ORDER BY created_at;
```

### Expenses (se existir)
```sql
SELECT * FROM expenses ORDER BY date;
```

### Ingredients (se existir)
```sql
SELECT * FROM ingredients ORDER BY created_at;
```

Salve cada resultado como um arquivo JSON e me envie, ou copie e cole os dados aqui no chat.