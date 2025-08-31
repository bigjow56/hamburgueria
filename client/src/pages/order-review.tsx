import { useState } from "react";
import { Link } from "wouter";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCustomization } from "@/components/product-customization";
import { ArrowLeft, Edit3, ShoppingCart, ChevronRight, Trash2, Plus, Minus } from "lucide-react";

export function OrderReview() {
  const { items, subtotal, removeFromCart, updateQuantity, updateItemModifications } = useCart();
  const [customizingItemId, setCustomizingItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
              <p className="text-muted-foreground">
                Adicione alguns produtos deliciosos para continuar
              </p>
            </div>
            
            <Link href="/">
              <Button className="bg-accent hover:bg-accent/90" data-testid="button-back-to-menu">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Ver Cardápio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-to-menu">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao Cardápio
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Revisar Pedido</h1>
                <p className="text-muted-foreground">
                  Personalize seus produtos antes de finalizar
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden" data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          data-testid={`img-product-${item.id}`}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium" data-testid={`text-product-name-${item.id}`}>
                              {item.product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.product.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Modifications */}
                        {item.modifications.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Personalizações:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.modifications.map((mod, index) => (
                                <Badge 
                                  key={index}
                                  variant={mod.modificationType === 'remove' ? 'secondary' : 'outline'}
                                  className="text-xs"
                                  data-testid={`badge-modification-${mod.ingredientId}`}
                                >
                                  {mod.modificationType === 'remove' ? 'Sem ' : 
                                   mod.modificationType === 'extra' && mod.quantity > 1 ? `${mod.quantity}x ` : '+ '}
                                  {mod.ingredient.name}
                                  {mod.modificationType !== 'remove' && mod.unitPrice > 0 && 
                                    ` (+R$ ${(mod.unitPrice * mod.quantity).toFixed(2)})`}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Price and Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                data-testid={`button-decrease-quantity-${item.id}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                data-testid={`button-increase-quantity-${item.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomizingItemId(customizingItemId === item.id ? null : item.id)}
                              data-testid={`button-customize-${item.id}`}
                            >
                              <Edit3 className="mr-2 h-3 w-3" />
                              {customizingItemId === item.id ? 'Fechar' : 'Personalizar'}
                            </Button>
                          </div>

                          <div className="text-right">
                            <div className="font-medium" data-testid={`price-${item.id}`}>
                              R$ {(item.customPrice * item.quantity).toFixed(2)}
                            </div>
                            {item.customPrice !== parseFloat(item.product.price) && (
                              <div className="text-xs text-muted-foreground line-through">
                                R$ {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Inline Customization */}
                  {customizingItemId === item.id && (
                    <div className="border-t bg-muted/20 p-4">
                      <ProductCustomization
                        cartItem={item}
                        isOpen={true}
                        onClose={() => setCustomizingItemId(null)}
                        onSave={(modifications) => {
                          updateItemModifications(item.id, modifications);
                          setCustomizingItemId(null);
                        }}
                        inline={true}
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span data-testid="text-subtotal">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa de entrega</span>
                      <span>Calculada no checkout</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Total (estimado)</span>
                    <span data-testid="text-total">R$ {subtotal.toFixed(2)}</span>
                  </div>

                  <Link href="/checkout">
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90" 
                      size="lg"
                      data-testid="button-proceed-to-checkout"
                    >
                      Finalizar Pedido
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Link href="/">
                      <Button variant="outline" className="w-full" data-testid="button-add-more-items">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar Mais Items
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}