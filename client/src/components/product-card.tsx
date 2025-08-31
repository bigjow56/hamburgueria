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
          <div className="absolute top-4 left-4">
            <Badge variant="destructive" className="font-bold">
              🔥 MAIS VENDIDO
            </Badge>
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-secondary text-secondary-foreground font-bold">
              💰 PROMOÇÃO
            </Badge>
          </div>
        )}
        
        {product.isPromotion && !hasDiscount && isAvailable && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-secondary text-secondary-foreground font-bold">
              🏷️ OFERTA
            </Badge>
          </div>
        )}
        
        {!isAvailable && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="font-bold">
              😞 ESGOTADO
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-3 sm:p-4 md:p-6">
        <h3 className="text-sm sm:text-base md:text-xl font-semibold text-card-foreground mb-1 sm:mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 md:mb-4 line-clamp-2 md:line-clamp-2">{product.description}</p>
        
        <div className="space-y-2 md:space-y-0 md:flex md:items-center md:justify-between">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {hasDiscount && (
              <span className="text-xs sm:text-sm md:text-lg text-muted-foreground line-through">
                R$ {parseFloat(product.originalPrice!).toFixed(2)}
              </span>
            )}
            <span className="text-sm sm:text-lg md:text-2xl font-bold text-primary">
              R$ {parseFloat(product.price).toFixed(2)}
            </span>
          </div>
          
          {isAvailable ? (
            <Button
              onClick={() => onAddToCart(product)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full md:w-auto px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold transition-colors"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Adicionar</span>
              <span className="sm:hidden">+</span>
            </Button>
          ) : (
            <Button
              disabled
              className="bg-muted text-muted-foreground w-full md:w-auto px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm md:text-base font-semibold cursor-not-allowed"
              data-testid={`button-unavailable-${product.id}`}
            >
              <span className="hidden sm:inline">😞 Esgotado</span>
              <span className="sm:hidden">😞</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
