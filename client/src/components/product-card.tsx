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
          className={`w-full h-48 object-cover transition-transform duration-500 ${
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
      
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-2">{product.name}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">
                R$ {parseFloat(product.originalPrice!).toFixed(2)}
              </span>
            )}
            <span className="text-2xl font-bold text-primary">
              R$ {parseFloat(product.price).toFixed(2)}
            </span>
          </div>
          
          {isAvailable ? (
            <Button
              onClick={() => onAddToCart(product)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          ) : (
            <Button
              disabled
              className="bg-muted text-muted-foreground px-6 py-2 rounded-lg font-semibold cursor-not-allowed"
              data-testid={`button-unavailable-${product.id}`}
            >
              😞 Esgotado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
