import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CartItem, CartItemModification } from "@/hooks/use-cart";
import type { Ingredient, ProductIngredient, ProductAdditional } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Minus, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCustomizationProps {
  cartItem: CartItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifications: CartItemModification[]) => void;
  inline?: boolean;
}

interface ExtendedProductIngredient extends ProductIngredient {
  ingredient: Ingredient;
}

interface ExtendedProductAdditional extends ProductAdditional {
  ingredient: Ingredient;
}

export function ProductCustomization({ cartItem, isOpen, onClose, onSave, inline = false }: ProductCustomizationProps) {
  const [modifications, setModifications] = useState<CartItemModification[]>(cartItem.modifications);
  
  // Fetch product ingredients and additionals
  const { data: productIngredients } = useQuery<ExtendedProductIngredient[]>({
    queryKey: ['/api/products', cartItem.product.id, 'ingredients'],
    enabled: isOpen && !!cartItem.product.id
  });

  const { data: productAdditionals } = useQuery<ExtendedProductAdditional[]>({
    queryKey: ['/api/products', cartItem.product.id, 'additionals'],
    enabled: isOpen && !!cartItem.product.id
  });

  // Reset modifications when cart item changes
  useEffect(() => {
    setModifications(cartItem.modifications);
  }, [cartItem.modifications]);

  // Apply modifications in real-time for inline mode
  useEffect(() => {
    if (inline) {
      onSave(modifications);
    }
  }, [modifications, inline, onSave]);

  const calculatePrice = () => {
    let basePrice = parseFloat(cartItem.product.price);
    
    modifications.forEach(mod => {
      if (mod.modificationType === 'add' || mod.modificationType === 'extra') {
        basePrice += mod.unitPrice * mod.quantity;
      } else if (mod.modificationType === 'remove') {
        basePrice -= mod.unitPrice * mod.quantity;
      }
    });
    
    return Math.max(0, basePrice);
  };

  const isIngredientRemoved = (ingredientId: string) => {
    return modifications.some(mod => 
      mod.ingredientId === ingredientId && mod.modificationType === 'remove'
    );
  };

  const getIngredientExtraQuantity = (ingredientId: string) => {
    const mod = modifications.find(mod => 
      mod.ingredientId === ingredientId && (mod.modificationType === 'add' || mod.modificationType === 'extra')
    );
    return mod ? mod.quantity : 0;
  };

  const toggleIngredientRemoval = (ingredient: Ingredient) => {
    const isRemoved = isIngredientRemoved(ingredient.id);
    
    if (isRemoved) {
      // Remove the removal modification
      setModifications(prev => prev.filter(mod => 
        !(mod.ingredientId === ingredient.id && mod.modificationType === 'remove')
      ));
    } else {
      // Add removal modification
      const discountPrice = parseFloat(ingredient.discountPrice || '0');
      setModifications(prev => [...prev, {
        ingredientId: ingredient.id,
        ingredient,
        modificationType: 'remove',
        quantity: 1,
        unitPrice: discountPrice
      }]);
    }
  };

  const updateExtraQuantity = (ingredient: Ingredient, newQuantity: number) => {
    // Remove existing extra modification for this ingredient
    const filteredMods = modifications.filter(mod => 
      !(mod.ingredientId === ingredient.id && (mod.modificationType === 'add' || mod.modificationType === 'extra'))
    );

    if (newQuantity > 0) {
      // Find the ingredient in additionals to get custom price
      const productAdditional = productAdditionals?.find(pa => pa.ingredientId === ingredient.id);
      const extraPrice = parseFloat(productAdditional?.customPrice || ingredient.price || '0');
      
      filteredMods.push({
        ingredientId: ingredient.id,
        ingredient,
        modificationType: 'extra',
        quantity: newQuantity,
        unitPrice: extraPrice
      });
    }

    setModifications(filteredMods);
  };

  const handleSave = () => {
    onSave(modifications);
    onClose();
  };

  const currentPrice = calculatePrice();
  const originalPrice = parseFloat(cartItem.product.price);
  const priceDifference = currentPrice - originalPrice;

  // Debug: Check if we have data
  const hasIngredients = productIngredients && productIngredients.length > 0;
  const hasAdditionals = productAdditionals && productAdditionals.length > 0;
  
  // If no ingredients or additionals, show a message
  if (!hasIngredients && !hasAdditionals) {
    return inline ? (
      <div className="space-y-4 p-4 text-center text-muted-foreground" data-testid="no-customization">
        <p>Este produto ainda não possui opções de personalização.</p>
        <Button onClick={onClose} variant="outline" size="sm">
          Fechar
        </Button>
      </div>
    ) : null;
  }

  const content = (
    <div className="space-y-6">
          {/* Current Price Display */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Preço original:</span>
              <span className="text-sm">R$ {originalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Preço final:</span>
              <span className="text-lg">R$ {currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Base Ingredients */}
          {productIngredients && productIngredients.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Ingredientes Inclusos
              </h3>
              <div className="space-y-2">
                {productIngredients.map((pi) => {
                  if (!pi.ingredient) return null;
                  const ingredient = pi.ingredient;
                  const isRemoved = isIngredientRemoved(ingredient.id);
                  const discountPrice = parseFloat(ingredient.discountPrice || '0');

                  return (
                    <div 
                      key={pi.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        isRemoved ? "opacity-50 bg-muted/30" : "bg-background"
                      )}
                      data-testid={`ingredient-base-${ingredient.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className={cn("font-medium", isRemoved && "line-through")}>
                            {ingredient.name}
                          </span>
                          {discountPrice > 0 && !isRemoved && (
                            <p className="text-xs text-green-600">
                              Desconto de R$ {discountPrice.toFixed(2)} se remover
                            </p>
                          )}
                        </div>
                      </div>

                      {ingredient.isRemovable && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs text-muted-foreground">Remover</Label>
                          <Switch
                            checked={isRemoved}
                            onCheckedChange={() => toggleIngredientRemoval(ingredient)}
                            data-testid={`switch-remove-${ingredient.id}`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Ingredients */}
          {productAdditionals && productAdditionals.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h3 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                Ingredientes Extras
              </h3>
              <div className="space-y-2">
                {productAdditionals.map((pa) => {
                  if (!pa.ingredient) return null;
                  const ingredient = pa.ingredient;
                  const extraQuantity = getIngredientExtraQuantity(ingredient.id);
                  const addPrice = parseFloat(pa.customPrice || ingredient.price || '0');

                  return (
                    <div 
                      key={pa.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-background"
                      data-testid={`ingredient-extra-${ingredient.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="font-medium">{ingredient.name}</span>
                          {addPrice > 0 && (
                            <p className="text-xs text-muted-foreground">
                              +R$ {addPrice.toFixed(2)} por unidade
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateExtraQuantity(ingredient, Math.max(0, extraQuantity - 1))}
                          disabled={extraQuantity <= 0}
                          data-testid={`button-decrease-${ingredient.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium" data-testid={`quantity-${ingredient.id}`}>
                          {extraQuantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateExtraQuantity(ingredient, Math.min(ingredient.maxQuantity || 3, extraQuantity + 1))}
                          disabled={extraQuantity >= (ingredient.maxQuantity || 3)}
                          data-testid={`button-increase-${ingredient.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-accent hover:bg-accent/90"
              data-testid="button-save-customization"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Personalização
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              data-testid="button-cancel-customization"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
  );

  if (inline) {
    return (
      <div className="space-y-4" data-testid="inline-product-customization">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Personalizar {cartItem.product.name}</h3>
          <Badge variant={priceDifference > 0 ? "destructive" : priceDifference < 0 ? "secondary" : "outline"}>
            {priceDifference > 0 ? `+R$ ${priceDifference.toFixed(2)}` : 
             priceDifference < 0 ? `-R$ ${Math.abs(priceDifference).toFixed(2)}` : 
             'Mesmo preço'}
          </Badge>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-product-customization">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Personalizar {cartItem.product.name}</span>
            <Badge variant={priceDifference > 0 ? "destructive" : priceDifference < 0 ? "secondary" : "outline"}>
              {priceDifference > 0 ? `+R$ ${priceDifference.toFixed(2)}` : 
               priceDifference < 0 ? `-R$ ${Math.abs(priceDifference).toFixed(2)}` : 
               'Mesmo preço'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}