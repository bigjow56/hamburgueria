import { Clock, MapPin, Truck, CreditCard } from "lucide-react";
import type { StoreSettings } from "@shared/schema";

interface StoreInfoProps {
  storeSettings: StoreSettings | null;
}

export default function StoreInfo({ storeSettings }: StoreInfoProps) {
  const storeTitle = storeSettings?.storeTitle ?? "Nossa Loja";
  const storeImageUrl = storeSettings?.storeImageUrl ?? "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";
  const storeAddress = storeSettings?.storeAddress ?? "Rua das Delícias, 123";
  const storeNeighborhood = storeSettings?.storeNeighborhood ?? "Centro, São Paulo - SP";
  const storeHours = storeSettings?.storeHours ?? "Segunda a Sexta: 18h - 23h\nSábado e Domingo: 18h - 00h";
  const deliveryTime = storeSettings?.deliveryTime ?? "Tempo médio: 30-45 minutos";
  const deliveryFeeRange = storeSettings?.deliveryFeeRange ?? "Taxa: R$ 3,90 - R$ 8,90";
  const paymentMethods = storeSettings?.paymentMethods ?? "Dinheiro, Cartão, PIX\nMercado Pago integrado";
  
  // Split hours by line breaks for display
  const hoursLines = storeHours.split('\n');
  const paymentLines = paymentMethods.split('\n');
  return (
    <section id="store-info" className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              📍 {storeTitle}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Horário de Funcionamento</h3>
                  {hoursLines.map((line, index) => (
                    <p key={index} className="text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Endereço</h3>
                  <p className="text-muted-foreground">{storeAddress}</p>
                  <p className="text-muted-foreground">{storeNeighborhood}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground p-3 rounded-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Entrega</h3>
                  <p className="text-muted-foreground">{deliveryTime}</p>
                  <p className="text-muted-foreground">{deliveryFeeRange}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Pagamento</h3>
                  {paymentLines.map((line, index) => (
                    <p key={index} className="text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src={storeImageUrl} 
              alt="Interior da hamburgueria" 
              className="rounded-2xl shadow-2xl w-full" 
            />
            
            <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                <span className="font-semibold text-card-foreground">Ambiente climatizado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
