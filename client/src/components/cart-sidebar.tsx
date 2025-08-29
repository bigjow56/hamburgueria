import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { Minus, Plus, X, CreditCard } from "lucide-react";

export default function CartSidebar() {
  const [, setLocation] = useLocation();
  const { 
    items, 
    isCartOpen, 
    toggleCartSidebar, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    total 
  } = useCart();

  const deliveryFee = 5.90;
  const finalTotal = total + deliveryFee;

  const handleCheckout = () => {
    toggleCartSidebar();
    setLocation("/checkout");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={toggleCartSidebar}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Seu Pedido
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCartSidebar}
              data-testid="button-close-cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground text-lg mb-4">Carrinho está vazio</p>
                <Button onClick={toggleCartSidebar} data-testid="button-continue-shopping">
                  Continuar Comprando
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4">
                {items.map((item) => (
                  <div 
                    key={`${item.product.id}-${item.quantity}`} 
                    className="flex items-center space-x-4 bg-muted/30 rounded-lg p-4"
                  >
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-lg" 
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        R$ {parseFloat(item.product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        data-testid={`button-decrease-${item.product.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold" data-testid={`quantity-${item.product.id}`}>
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        data-testid={`button-increase-${item.product.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`button-remove-${item.product.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de entrega</span>
                    <span data-testid="text-delivery-fee">R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-card-foreground">
                    <span>Total</span>
                    <span data-testid="text-total">R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-4 text-lg font-bold"
                  size="lg"
                  data-testid="button-checkout"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  FINALIZAR PEDIDO
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
