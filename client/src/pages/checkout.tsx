import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard, DollarSign, Smartphone } from "lucide-react";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, total, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    streetName: "",
    houseNumber: "",
    neighborhood: "",
    referencePoint: "",
    paymentMethod: "",
    specialInstructions: "",
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      clearCart();
      toast({
        title: "Pedido realizado com sucesso!",
        description: `Pedido #${data.orderNumber} confirmado. Tempo estimado: ${data.estimatedDeliveryTime} minutos.`,
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Erro ao realizar pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.streetName || !formData.houseNumber || !formData.neighborhood || !formData.paymentMethod) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar o pedido.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...formData,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.product.price,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const deliveryFee = 5.90;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Carrinho Vazio</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa adicionar produtos ao carrinho antes de finalizar o pedido.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-back-to-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Loja
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Finalizar Pedido</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Dados do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customerName">Nome Completo *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder="Seu nome completo"
                        required
                        data-testid="input-customer-name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerPhone">Telefone *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        placeholder="(11) 99999-9999"
                        required
                        data-testid="input-customer-phone"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customerEmail">E-mail</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                        placeholder="seu@email.com"
                        data-testid="input-customer-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="streetName">Nome da Rua *</Label>
                      <Input
                        id="streetName"
                        value={formData.streetName}
                        onChange={(e) => setFormData({...formData, streetName: e.target.value})}
                        placeholder="Ex: Rua das Flores"
                        required
                        data-testid="input-street-name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="houseNumber">Número da Casa *</Label>
                        <Input
                          id="houseNumber"
                          value={formData.houseNumber}
                          onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                          placeholder="Ex: 123"
                          required
                          data-testid="input-house-number"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="neighborhood">Bairro *</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                          placeholder="Ex: Centro"
                          required
                          data-testid="input-neighborhood"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="referencePoint">Ponto de Referência</Label>
                      <Input
                        id="referencePoint"
                        value={formData.referencePoint}
                        onChange={(e) => setFormData({...formData, referencePoint: e.target.value})}
                        placeholder="Ex: Próximo ao mercado (opcional)"
                        data-testid="input-reference-point"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentMethod">Forma de Pagamento *</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                      >
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="money">
                            <div className="flex items-center">
                              <DollarSign className="mr-2 h-4 w-4" />
                              Dinheiro
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Cartão na Entrega
                            </div>
                          </SelectItem>
                          <SelectItem value="pix">
                            <div className="flex items-center">
                              <Smartphone className="mr-2 h-4 w-4" />
                              PIX
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="specialInstructions">Observações</Label>
                      <Textarea
                        id="specialInstructions"
                        value={formData.specialInstructions}
                        onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                        placeholder="Alguma observação especial? (opcional)"
                        data-testid="input-special-instructions"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-place-order"
                  >
                    {createOrderMutation.isPending ? "Processando..." : "Finalizar Pedido"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.product.id}-checkout`} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x R$ {parseFloat(item.product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          R$ {(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa de entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>R$ {(total + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Tempo estimado de entrega:</span>
                      <Badge variant="secondary">30-45 min</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
