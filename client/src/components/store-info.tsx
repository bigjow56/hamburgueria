import { Clock, MapPin, Truck, CreditCard } from "lucide-react";

export default function StoreInfo() {
  return (
    <section id="store-info" className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              📍 Nossa Loja
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Horário de Funcionamento</h3>
                  <p className="text-muted-foreground">Segunda a Sexta: 18h - 23h</p>
                  <p className="text-muted-foreground">Sábado e Domingo: 18h - 00h</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Endereço</h3>
                  <p className="text-muted-foreground">Rua das Delícias, 123</p>
                  <p className="text-muted-foreground">Centro, São Paulo - SP</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground p-3 rounded-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Entrega</h3>
                  <p className="text-muted-foreground">Tempo médio: 30-45 minutos</p>
                  <p className="text-muted-foreground">Taxa: R$ 3,90 - R$ 8,90</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Pagamento</h3>
                  <p className="text-muted-foreground">Dinheiro, Cartão, PIX</p>
                  <p className="text-muted-foreground">Mercado Pago integrado</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
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
