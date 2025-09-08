import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Star, Users, Sparkles, X } from "lucide-react";

interface RegistrationBenefitsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAsGuest: () => void;
  onGoToRegister: () => void;
}

export function RegistrationBenefitsPopup({
  isOpen,
  onClose,
  onProceedAsGuest,
  onGoToRegister
}: RegistrationBenefitsPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              <DialogTitle>🎉 Aproveite os Benefícios Exclusivos!</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
              data-testid="button-close-popup"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Crie sua conta e tenha acesso a vantagens incríveis que vão tornar sua experiência muito melhor!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Benefícios em cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Programa de Fidelidade</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ganhe pontos a cada compra e troque por hamburgers grátis!
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        10 pontos = R$ 1
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-500/10 p-2 rounded-lg">
                    <Gift className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Ofertas Exclusivas</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Descontos especiais e promoções só para clientes cadastrados
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs bg-green-100">
                        Até 30% OFF
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Histórico de Pedidos</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Acesse todos os seus pedidos e refaça seus favoritos com 1 clique
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Checkout Rápido</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seus dados salvos para pedidos mais rápidos no futuro
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Destaque especial */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold text-primary">Oferta de Boas-vindas!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Ganhe 100 pontos de bônus</strong> (equivale a R$ 10) apenas por se cadastrar! 
                É o suficiente para ganhar um desconto no seu próximo pedido.
              </p>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={onGoToRegister}
              className="flex-1 bg-primary hover:bg-primary/90"
              data-testid="button-create-account"
            >
              <Gift className="mr-2 h-4 w-4" />
              Criar Conta e Ganhar Benefícios
            </Button>
            
            <Button
              onClick={onProceedAsGuest}
              variant="outline"
              className="flex-1"
              data-testid="button-continue-as-guest"
            >
              Continuar como Convidado
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Você pode criar sua conta a qualquer momento. Os benefícios estarão esperando por você!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}