import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import StoreInfo from "@/components/store-info";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { Search, Sandwich, EggFried, Coffee, IceCream, Box, Tags } from "lucide-react";
import type { Product, Category } from "@shared/schema";

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
  });

  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: selectedCategory ? ["/api/products", selectedCategory] : ["/api/products"],
  });

  const { data: storeSettings } = useQuery({
    queryKey: ["/api/store/settings"],
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToMenu = () => {
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection 
          storeSettings={storeSettings}
          onScrollToMenu={scrollToMenu}
        />

        {/* Best Sellers Section */}
        <section id="bestsellers" className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                🔥 Mais Vendidos
              </h2>
              <p className="text-lg text-muted-foreground">Os favoritos dos nossos clientes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        {/* Product Grid */}
        <section className="py-12 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                🍔 Nossos Produtos
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

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? "Nenhum produto encontrado." : "Nenhum produto disponível."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

        <StoreInfo storeSettings={storeSettings} />
      </main>

      <Footer />
      <CartSidebar />
    </div>
  );
}
