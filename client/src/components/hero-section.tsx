import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StoreSettings } from "@shared/schema";

interface HeroSectionProps {
  storeSettings: StoreSettings | null;
  onScrollToMenu: () => void;
}

export default function HeroSection({ storeSettings, onScrollToMenu }: HeroSectionProps) {
  const isOpen = storeSettings?.isOpen ?? true;
  const closingTime = storeSettings?.closingTime ?? "23:00";
  const minimumOrder = storeSettings?.minimumOrderAmount ?? "25.00";
  const bannerTitle = storeSettings?.bannerTitle ?? "Hambúrguers";
  const bannerDescription = storeSettings?.bannerDescription ?? "Ingredientes frescos, sabor incomparável.";
  const bannerPrice = storeSettings?.bannerPrice ?? "18.90";
  const bannerImageUrl = storeSettings?.bannerImageUrl ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  
  // Configurações de aparência do banner
  const bannerColor1 = storeSettings?.bannerColor1 ?? "#ff6b35";
  const bannerColor2 = storeSettings?.bannerColor2 ?? "#f7931e";
  const bannerColor3 = storeSettings?.bannerColor3 ?? "#ffd23f";
  const bannerColor4 = storeSettings?.bannerColor4 ?? "#ff8c42";
  const bannerBackgroundImage = storeSettings?.bannerBackgroundImage;
  const useImageBackground = storeSettings?.bannerUseImageBackground ?? false;
  
  const openWhatsApp = () => {
    const message = "Olá! Gostaria de fazer um pedido na Burger House.";
    const phone = "5511999999999"; // Replace with actual WhatsApp number
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Criar o estilo dinâmico do banner
  const bannerStyle = useImageBackground && bannerBackgroundImage 
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${bannerBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {
        background: `linear-gradient(135deg, ${bannerColor1} 0%, ${bannerColor2} 25%, ${bannerColor3} 75%, ${bannerColor4} 100%)`,
        boxShadow: `0 8px 32px ${bannerColor1}30`
      };

  return (
    <section 
      className="relative overflow-hidden"
      style={bannerStyle}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left">
            <Badge 
              className={`inline-flex items-center px-4 py-2 rounded-full font-semibold mb-4 ${
                isOpen 
                  ? 'status-open text-accent-foreground' 
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              <div className={`w-3 h-3 rounded-full mr-2 ${isOpen ? 'bg-accent-foreground animate-pulse' : 'bg-destructive-foreground'}`}></div>
              {isOpen ? `ABERTO AGORA • Fecha às ${closingTime}` : 'FECHADO'}
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-4">
              Os Melhores<br />
              <span className="text-secondary">{bannerTitle}</span><br />
              da Cidade
            </h1>
            
            <p className="text-xl text-primary-foreground/90 mb-6">
              {bannerDescription}<br />
              <span className="font-semibold">Pedido mínimo: R$ {minimumOrder}</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={onScrollToMenu}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-bold transition-transform hover:scale-105"
                data-testid="button-view-menu"
              >
                🍽️ VER CARDÁPIO
              </Button>
              <Button
                onClick={openWhatsApp}
                variant="outline"
                className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground px-8 py-4 text-lg font-semibold border-primary-foreground/30"
                data-testid="button-whatsapp"
              >
                📱 CHAMAR NO WHATSAPP
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <img 
              src={bannerImageUrl} 
              alt={`${bannerTitle} artesanal gourmet`} 
              className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 w-full" 
            />
            
            <div className="absolute -bottom-4 -left-4 bg-secondary text-secondary-foreground px-6 py-3 rounded-xl shadow-lg font-bold">
              <span className="text-2xl">R$ {bannerPrice}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-10 right-10 text-6xl opacity-10">🍟</div>
      <div className="absolute bottom-20 left-10 text-4xl opacity-10">🥤</div>
    </section>
  );
}
