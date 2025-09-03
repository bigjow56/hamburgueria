import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Product, Ingredient } from "@shared/schema";

interface CartItemModification {
  ingredientId: string;
  ingredient: Ingredient;
  modificationType: 'add' | 'remove' | 'extra';
  quantity: number;
  unitPrice: number;
}

interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  modifications: CartItemModification[];
  customPrice: number; // calculated price with modifications
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  isCartOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemModifications: (cartItemId: string, modifications: CartItemModification[]) => void;
  clearCart: () => void;
  toggleCartSidebar: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const generateCartItemId = () => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount and validate products
  useEffect(() => {
    const savedCart = localStorage.getItem("burger-house-cart");
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);
        
        // Validate products exist by checking against API
        fetch('/api/products')
          .then(response => response.json())
          .then(products => {
            const validProductIds = new Set(products.map((p: Product) => p.id));
            
            // Filter out cart items with invalid product IDs
            const validItems = parsedItems.filter((item: any) => {
              const productId = item.product?.id;
              if (!productId || !validProductIds.has(productId)) {
                console.warn(`Removendo produto inválido do carrinho: ${productId}`);
                return false;
              }
              return true;
            });
            
            // Convert valid items to new format if needed
            const convertedItems = validItems.map((item: any) => {
              if (!item.id) {
                // Old format, convert to new
                return {
                  id: generateCartItemId(),
                  product: item.product,
                  quantity: item.quantity,
                  modifications: [],
                  customPrice: parseFloat(item.product.price)
                };
              }
              // New format, ensure all fields exist
              return {
                id: item.id,
                product: item.product,
                quantity: item.quantity,
                modifications: item.modifications || [],
                customPrice: item.customPrice || parseFloat(item.product.price)
              };
            });
            
            setItems(convertedItems);
            
            // If we removed invalid items, show a message
            if (validItems.length < parsedItems.length) {
              console.log(`Carrinho atualizado: ${parsedItems.length - validItems.length} produto(s) inválido(s) removido(s)`);
            }
          })
          .catch(error => {
            console.error("Erro ao validar produtos do carrinho:", error);
            // Se não conseguir validar, limpa o carrinho por segurança
            setItems([]);
            localStorage.removeItem("burger-house-cart");
          });
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        // Se o localStorage estiver corrompido, limpa
        localStorage.removeItem("burger-house-cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem("burger-house-cart", JSON.stringify(items));
  }, [items]);

  const calculateItemPrice = (product: Product, modifications: CartItemModification[]) => {
    let basePrice = parseFloat(product.price);
    
    modifications.forEach(mod => {
      if (mod.modificationType === 'add' || mod.modificationType === 'extra') {
        basePrice += mod.unitPrice * mod.quantity;
      } else if (mod.modificationType === 'remove') {
        basePrice -= mod.unitPrice * mod.quantity;
      }
    });
    
    return Math.max(0, basePrice); // Ensure price never goes negative
  };

  const addToCart = (product: Product) => {
    const newItem: CartItem = {
      id: generateCartItemId(),
      product,
      quantity: 1,
      modifications: [],
      customPrice: parseFloat(product.price)
    };
    
    setItems(currentItems => [...currentItems, newItem]);
  };

  const removeFromCart = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === cartItemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateItemModifications = (cartItemId: string, modifications: CartItemModification[]) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.id === cartItemId) {
          const newCustomPrice = calculateItemPrice(item.product, modifications);
          return {
            ...item,
            modifications,
            customPrice: newCustomPrice
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleCartSidebar = () => {
    setIsCartOpen(!isCartOpen);
  };

  // Calculate totals
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + (item.customPrice * item.quantity), 0);
  const total = subtotal; // Base total without delivery fee

  const value: CartContextType = {
    items,
    itemCount,
    subtotal,
    total,
    isCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemModifications,
    clearCart,
    toggleCartSidebar,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// Export types for use in other components
export type { CartItem, CartItemModification };
