import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import StoreInfo from "@/components/store-info";
import Footer from "@/components/footer";
import StickyCategoryMenu from "@/components/sticky-category-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { Search, Sandwich, EggFried, Coffee, IceCream, Box, Tags } from "lucide-react";
import type { Product, Category, StoreSettings } from "@shared/schema";

const CATEGORY_ICONS = {
  hamburgers: Sandwich,
  sides: EggFried,
  drinks: Coffee,
  desserts: IceCream,
  combos: Box,
  promotions: Tags,
};

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToCart } = useCart();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    select: (data) => Array.isArray(data) ? data : [],
  });

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured", "customer"],
    queryFn: () => fetch("/api/products/featured?admin=true").then(res => res.json()),
    select: (data) => Array.isArray(data) ? data : [],
  });

  // For customer view, we need to include unavailable products but show them as "esgotado"
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: selectedCategory ? ["/api/products", "customer", selectedCategory] : ["/api/products", "customer"],
    queryFn: () => {
      const url = selectedCategory 
        ? `/api/products?category=${selectedCategory}&admin=true`
        : "/api/products?admin=true";
      return fetch(url).then(res => res.json());
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Filter products based on category but include all (available and unavailable)
  const products = selectedCategory 
    ? allProducts.filter(p => p.categoryId === selectedCategory)
    : allProducts;

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Função para renderizar seção de categoria
  const renderCategorySection = (categoryId: string, categoryName: string, categoryIcon: string) => {
    const categoryProducts = searchQuery 
      ? allProducts.filter(p => 
          p.categoryId === categoryId && 
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : allProducts.filter(p => p.categoryId === categoryId);

    if (categoryProducts.length === 0) return null;

    return (
      <section key={categoryId} id={categoryId} className="py-12 bg-background scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {categoryIcon} {categoryName}
            </h2>
            <p className="text-muted-foreground">
              {categoryProducts.length} {categoryProducts.length === 1 ? 'produto' : 'produtos'} disponível{categoryProducts.length === 1 ? '' : 'is'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {categoryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Menu Sticky */}
      <StickyCategoryMenu 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main>
        <HeroSection 
          storeSettings={storeSettings || null}
          onScrollToMenu={scrollToMenu}
        />

        {/* Best Sellers Section */}
        <section id="bestsellers" className="py-16 bg-muted/30 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                🔥 Mais Vendidos
              </h2>
              <p className="text-lg text-muted-foreground">Os favoritos dos nossos clientes</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  showBadge
                />
              ))}
            </div>
          </div>
        </section>

        {/* Category Navigation */}
        <section id="menu" className="py-8 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                🍔 Nosso Cardápio
              </h2>
              
              <div className="relative hidden md:block">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
              <Button
                variant={selectedCategory === "" ? "default" : "secondary"}
                onClick={() => setSelectedCategory("")}
                className="flex-shrink-0 whitespace-nowrap"
                data-testid="category-all"
              >
                <Sandwich className="mr-2 h-4 w-4" />
                Todos
              </Button>
              
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.slug as keyof typeof CATEGORY_ICONS] || Sandwich;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "secondary"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex-shrink-0 whitespace-nowrap"
                    data-testid={`category-${category.slug}`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Seções de Produtos por Categoria */}
        {searchQuery ? (
          // Modo de busca - mostrar todos os resultados juntos
          <section className="py-12 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  🔍 Resultados da Busca: "{searchQuery}"
                </h2>
                <p className="text-muted-foreground">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Nenhum produto encontrado para "{searchQuery}".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          // Modo normal - mostrar por categorias
          <>
            {selectedCategory ? (
              // Categoria específica selecionada
              categories
                .filter(cat => cat.id === selectedCategory)
                .map(category => renderCategorySection(category.id, category.name, category.icon || '📦'))
            ) : (
              // Todas as categorias
              categories.map(category => 
                renderCategorySection(category.id, category.name, category.icon || '📦')
              )
            )}
          </>
        )}

        <StoreInfo storeSettings={storeSettings || null} />
      </main>

      <Footer />
      <CartSidebar />
    </div>
  );
}
