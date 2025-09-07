import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  showBadge?: boolean;
}

export default function ProductCard({ product, onAddToCart, showBadge = false }: ProductCardProps) {
  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
  const isAvailable = product.isAvailable ?? true;
  
  // Calcular percentual de desconto
  const discountPercent = hasDiscount 
    ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
    : 0;
  
  // Economia em reais
  const savings = hasDiscount 
    ? parseFloat(product.originalPrice!) - parseFloat(product.price)
    : 0;
    
  // Simular avaliações (4.5-5.0 estrelas)
  const rating = 4.5 + Math.random() * 0.5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <Card className={`overflow-hidden transition-all duration-300 group ${
      isAvailable ? 'hover:shadow-xl hover:scale-105' : 'opacity-75'
    }`}>
      <div className="relative overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={`w-full h-32 sm:h-40 md:h-48 object-cover transition-transform duration-500 ${
            isAvailable ? 'group-hover:scale-110' : 'grayscale'
          }`} 
        />
        <div className={`absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 ${
          isAvailable ? 'group-hover:opacity-100' : ''
        }`}></div>
        
        {showBadge && (
          <div className="absolute top-2 right-2 z-10">
            <div className="relative">
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-300">⭐</span>
                  <span>MAIS VENDIDO</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 rounded-full blur opacity-75 animate-pulse"></div>
            </div>
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg transform rotate-[-8deg]">
              <div className="flex flex-col items-center">
                <span className="text-yellow-300 text-xs">💰</span>
                <span>{discountPercent}% OFF</span>
              </div>
            </div>
          </div>
        )}
        
        {product.isPromotion && !hasDiscount && isAvailable && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-bounce">
              <div className="flex items-center space-x-1">
                <span>🏷️</span>
                <span>OFERTA</span>
              </div>
            </div>
          </div>
        )}
        
        {!isAvailable && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg opacity-90">
              <div className="flex items-center space-x-1">
                <span>😞</span>
                <span>ESGOTADO</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Badge de urgência para produtos em promoção */}
        {(hasDiscount || product.isPromotion) && isAvailable && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold shadow-lg animate-pulse">
              <span>⚡ Últimas unidades</span>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-3 sm:p-4 md:p-6">
        <h3 className="text-sm sm:text-base md:text-xl font-semibold text-card-foreground mb-1 sm:mb-2 line-clamp-1">{product.name}</h3>
        
        {/* Avaliações com estrelas */}
        <div className="flex items-center mb-2">
          <div className="flex items-center space-x-1 mr-2">
            {[...Array(fullStars)].map((_, i) => (
              <span key={i} className="text-yellow-400 text-xs">⭐</span>
            ))}
            {hasHalfStar && <span className="text-yellow-400 text-xs">✨</span>}
          </div>
          <span className="text-xs text-muted-foreground">({rating.toFixed(1)}) · Popular</span>
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 md:mb-4 line-clamp-2 md:line-clamp-2">{product.description}</p>
        
        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1 sm:space-x-2">
              {hasDiscount && (
                <span className="text-xs sm:text-sm md:text-lg text-muted-foreground line-through">
                  R$ {parseFloat(product.originalPrice!).toFixed(2)}
                </span>
              )}
              <span className="text-sm sm:text-lg md:text-2xl font-bold text-orange-600">
                R$ {parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            {hasDiscount && (
              <div className="text-xs text-green-600 font-semibold">
                💚 Economize R$ {savings.toFixed(2)}
              </div>
            )}
          </div>
          
          {isAvailable ? (
            <Button
              onClick={() => onAddToCart(product)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white w-full md:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm md:text-base font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Adicionar ao Carrinho</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          ) : (
            <Button
              disabled
              className="bg-gray-400 text-gray-600 w-full md:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm md:text-base font-bold cursor-not-allowed opacity-60"
              data-testid={`button-unavailable-${product.id}`}
            >
              <span className="hidden sm:inline">😞 Indisponível</span>
              <span className="sm:hidden">😞 Fora</span>
            </Button>
          )}
        </div>
        
        {/* Indicadores de confiança */}
        {isAvailable && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <span className="text-green-500">✅</span>
                <span>Entrega rápida</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="text-blue-500">🔄</span>
                <span>Garantia</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
