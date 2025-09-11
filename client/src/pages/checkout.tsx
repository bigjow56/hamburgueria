import { useState, useEffect } from "react";
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
import { PhoneInput } from "@/components/ui/phone-input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard, DollarSign, Smartphone } from "lucide-react";
import { RegistrationBenefitsPopup } from "@/components/RegistrationBenefitsPopup";
import type { StoreSettings, DeliveryZone } from "@shared/schema";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, total, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerPhoneInternational: "", // Full international number for n8n
    customerEmail: "",
    streetName: "",
    houseNumber: "",
    neighborhood: "",
    referencePoint: "",
    paymentMethod: "",
    specialInstructions: "",
    deliveryType: "delivery", // "delivery" or "pickup"
  });

  const [deliveryFee, setDeliveryFee] = useState(5.90);
  const [showBenefitsPopup, setShowBenefitsPopup] = useState(false);
  const [proceedToOrder, setProceedToOrder] = useState(false);

  // Fetch store settings
  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  // Fetch active delivery zones
  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones/active"],
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

  const processOrder = () => {
    const orderData = {
      ...formData,
      // Remove email if empty to avoid validation issues
      customerEmail: formData.customerEmail || undefined,
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPrice: item.customPrice.toFixed(2), // Use customPrice with modifications
        modifications: item.modifications.map(mod => ({
          ingredientId: mod.ingredientId,
          ingredientName: mod.ingredient.name,
          modificationType: mod.modificationType,
          quantity: mod.quantity,
          unitPrice: mod.unitPrice,
        })),
      })),
    };

    // Debug: Log dados antes de enviar
    console.log("🚀 ENVIANDO PEDIDO - DADOS COMPLETOS:");
    orderData.items.forEach((item, index) => {
      console.log(`ITEM ${index + 1}:`, item.productId);
      console.log(`MODIFICAÇÕES ENVIADAS:`, item.modifications);
    });

    createOrderMutation.mutate(orderData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Different validation for delivery vs pickup
    const requiredFields = formData.deliveryType === "delivery" 
      ? ["customerName", "customerPhone", "streetName", "houseNumber", "neighborhood", "paymentMethod"]
      : ["customerName", "customerPhone", "paymentMethod"];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
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

    // Show registration benefits popup for guest customers
    // Since we don't have user authentication, all customers are guests
    if (!proceedToOrder) {
      setShowBenefitsPopup(true);
      return;
    }

    // If user chose to proceed, process the order
    processOrder();
  };

  // Handle when user chooses to continue as guest
  const handleProceedAsGuest = () => {
    setShowBenefitsPopup(false);
    setProceedToOrder(true);
    // Process order immediately
    processOrder();
  };

  // Handle when user wants to register first
  const handleGoToRegister = () => {
    setShowBenefitsPopup(false);
    setProceedToOrder(true);
    // Process order after successful registration
    processOrder();
  };

  // Update delivery fee when neighborhood or delivery type changes
  useEffect(() => {
    if (formData.deliveryType === "pickup") {
      setDeliveryFee(0);
      return;
    }
    
    if (!storeSettings?.useNeighborhoodDelivery) {
      setDeliveryFee(parseFloat(storeSettings?.defaultDeliveryFee || "5.90"));
      return;
    }

    const selectedZone = deliveryZones.find(
      zone => zone.neighborhoodName === formData.neighborhood
    );

    if (selectedZone) {
      setDeliveryFee(parseFloat(selectedZone.deliveryFee));
    } else {
      setDeliveryFee(parseFloat(storeSettings?.defaultDeliveryFee || "5.90"));
    }
  }, [formData.neighborhood, formData.deliveryType, storeSettings, deliveryZones]);

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
                    {/* Delivery Type Selection */}
                    <div>
                      <Label>Tipo de Pedido *</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                          type="button"
                          variant={formData.deliveryType === "delivery" ? "default" : "outline"}
                          onClick={() => setFormData({...formData, deliveryType: "delivery"})}
                          className="h-auto py-4 flex flex-col items-center"
                          data-testid="button-delivery-type"
                        >
                          <div className="text-2xl mb-1">🚚</div>
                          <div className="font-medium">Entrega</div>
                          <div className="text-xs text-muted-foreground">Em casa</div>
                        </Button>
                        <Button
                          type="button"
                          variant={formData.deliveryType === "pickup" ? "default" : "outline"}
                          onClick={() => setFormData({...formData, deliveryType: "pickup"})}
                          className="h-auto py-4 flex flex-col items-center"
                          data-testid="button-pickup-type"
                        >
                          <div className="text-2xl mb-1">🏪</div>
                          <div className="font-medium">Retirada</div>
                          <div className="text-xs text-muted-foreground">Na loja</div>
                        </Button>
                      </div>
                    </div>
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
                      <PhoneInput
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(formatted, international) => setFormData({
                          ...formData, 
                          customerPhone: formatted,
                          customerPhoneInternational: international
                        })}
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

                    {/* Address fields - only for delivery */}
                    {formData.deliveryType === "delivery" && (
                      <>
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
                            {storeSettings?.useNeighborhoodDelivery ? (
                              <Select
                                value={formData.neighborhood}
                                onValueChange={(value) => setFormData({...formData, neighborhood: value})}
                              >
                                <SelectTrigger data-testid="select-neighborhood">
                                  <SelectValue placeholder="Selecione o bairro" />
                                </SelectTrigger>
                                <SelectContent>
                                  {deliveryZones.map((zone) => (
                                    <SelectItem key={zone.id} value={zone.neighborhoodName}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{zone.neighborhoodName}</span>
                                        <span className="text-sm text-muted-foreground ml-2">
                                          +R$ {parseFloat(zone.deliveryFee).toFixed(2)}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                id="neighborhood"
                                value={formData.neighborhood}
                                onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                                placeholder="Ex: Centro"
                                required
                                data-testid="input-neighborhood"
                              />
                            )}
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
                      </>
                    )}

                    {/* Store info for pickup */}
                    {formData.deliveryType === "pickup" && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="font-medium text-blue-900 mb-2">📍 Endereço da Loja</h3>
                        <p className="text-sm text-blue-800">{storeSettings?.storeAddress}</p>
                        <p className="text-sm text-blue-800">{storeSettings?.storeNeighborhood}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          <strong>Horário:</strong> {storeSettings?.storeHours?.split('\\n').join(' | ')}
                        </p>
                      </div>
                    )}

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
                      <span>{formData.deliveryType === "pickup" ? "Taxa de entrega" : "Taxa de entrega"}</span>
                      <span>{formData.deliveryType === "pickup" ? "Grátis" : `R$ ${deliveryFee.toFixed(2)}`}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>R$ {(total + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>{formData.deliveryType === "pickup" ? "Tempo estimado de preparo:" : "Tempo estimado de entrega:"}</span>
                      <Badge variant="secondary">{formData.deliveryType === "pickup" ? "15-20 min" : "30-45 min"}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Registration Benefits Popup */}
      <RegistrationBenefitsPopup
        isOpen={showBenefitsPopup}
        onClose={() => setShowBenefitsPopup(false)}
        onProceedAsGuest={handleProceedAsGuest}
        onGoToRegister={handleGoToRegister}
      />
    </div>
  );
}
