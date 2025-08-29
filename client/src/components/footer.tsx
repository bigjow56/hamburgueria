import { Instagram, Facebook, MessageCircle, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">🍔 Burger House</h3>
            <p className="text-background/80 mb-4">
              Os melhores hambúrguers artesanais da cidade. 
              Ingredientes frescos e sabor incomparável.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-background/60 hover:text-background transition-colors"
                data-testid="link-instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-background/60 hover:text-background transition-colors"
                data-testid="link-facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="text-background/60 hover:text-background transition-colors"
                data-testid="link-whatsapp"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="space-y-2 text-background/80">
              <p className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                (11) 9999-9999
              </p>
              <p className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                contato@burgerhouse.com.br
              </p>
              <p className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                Rua das Delícias, 123
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Horários</h4>
            <div className="space-y-2 text-background/80">
              <p>Segunda - Sexta: 18h - 23h</p>
              <p>Sábado - Domingo: 18h - 00h</p>
              <div className="mt-4">
                <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  ✅ Aberto agora
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center text-background/60">
          <p>&copy; 2024 Burger House. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
