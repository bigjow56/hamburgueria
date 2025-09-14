import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { Sandwich, EggFried, Coffee, IceCream, Box, Tags } from "lucide-react";
import type { Category } from "@shared/schema";

const CATEGORY_ICONS = {
  hamburgers: Sandwich,
  sides: EggFried,
  drinks: Coffee,
  desserts: IceCream,
  combos: Box,
  promotions: Tags,
};

interface StickyCategoryMenuProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function StickyCategoryMenu({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: StickyCategoryMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);

  // Função para detectar qual categoria está visível na tela
  const handleScroll = useCallback(() => {
    const menuSection = document.getElementById('menu');
    if (!menuSection) return;

    const menuRect = menuSection.getBoundingClientRect();
    
    // Mostrar o menu sticky após o usuário passar da seção de menu original
    setIsVisible(menuRect.bottom <= 0);

    // Criar lista de seções baseada nas categorias reais mais a seção de bestsellers
    const sections = ['bestsellers', ...categories.map(cat => cat.id)];
    let currentActive = "";

    // Detectar qual categoria está visível usando a posição vertical
    let closestSection = "";
    let closestDistance = Infinity;

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const centerY = rect.top + (rect.height / 2);
        const distance = Math.abs(centerY - window.innerHeight / 2);
        
        // Se a seção está visível na viewport
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          if (distance < closestDistance) {
            closestDistance = distance;
            closestSection = sectionId;
          }
        }
      }
    }

    // Mapear bestsellers para categoria vazia
    currentActive = closestSection === 'bestsellers' ? '' : closestSection;
    setActiveCategory(currentActive);
  }, [categories]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToCategory = (categoryId: string) => {
    onCategoryChange(categoryId);
    
    // Scroll para a seção correspondente
    const targetId = categoryId === "" ? "bestsellers" : categoryId;
    const element = document.getElementById(targetId);
    
    if (element) {
      // Usar scrollIntoView com block: 'start' que respeita o scroll-mt-20 do CSS
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
          <Button
            variant={activeCategory === "" ? "default" : "secondary"}
            onClick={() => scrollToCategory("")}
            className="flex-shrink-0 whitespace-nowrap"
            data-testid="sticky-category-all"
          >
            <Sandwich className="mr-2 h-4 w-4" />
            Todos
          </Button>
          
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug as keyof typeof CATEGORY_ICONS] || Sandwich;
            const isActive = activeCategory === category.id || selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "secondary"}
                onClick={() => scrollToCategory(category.id)}
                className="flex-shrink-0 whitespace-nowrap"
                data-testid={`sticky-category-${category.slug}`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}