import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { Menu, ShoppingCart } from "lucide-react";

export default function Header() {
  const [, setLocation] = useLocation();
  const { itemCount, toggleCartSidebar } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation("/")}
              className="flex-shrink-0"
              data-testid="button-home"
            >
              <h1 className="text-xl font-bold text-primary">🍔 Burger House</h1>
            </button>
          </div>
          
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button
                onClick={() => scrollToSection('menu')}
                className="text-foreground hover:text-primary transition-colors px-3 py-2 font-medium"
                data-testid="nav-menu"
              >
                LOJA
              </button>
              <button
                onClick={() => scrollToSection('store-info')}
                className="text-muted-foreground hover:text-primary transition-colors px-3 py-2 font-medium"
                data-testid="nav-info"
              >
                INFO
              </button>
            </div>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              onClick={toggleCartSidebar}
              className="relative bg-accent hover:bg-accent/90 text-accent-foreground"
              data-testid="button-cart"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              CARRINHO
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-5">
                  {itemCount}
                </span>
              )}
            </Button>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col space-y-4 mt-8">
                  <h2 className="text-xl font-bold text-primary mb-4">🍔 Burger House</h2>
                  <Button
                    variant="ghost"
                    onClick={() => scrollToSection('menu')}
                    className="justify-start"
                    data-testid="mobile-nav-menu"
                  >
                    LOJA
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => scrollToSection('store-info')}
                    className="justify-start"
                    data-testid="mobile-nav-info"
                  >
                    INFO
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
