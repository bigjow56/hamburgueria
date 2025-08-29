import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Plus, Edit3, Trash2, Save, X, Settings } from "lucide-react";
import type { DeliveryZone, StoreSettings } from "@shared/schema";

interface EditingDeliveryZone {
  id?: string;
  neighborhoodName: string;
  deliveryFee: string;
  isActive: boolean;
}

export function AdminDeliveryZones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingZone, setEditingZone] = useState<EditingDeliveryZone | null>(null);
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);

  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  // Store Settings Mutation
  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<StoreSettings>) => {
      return await apiRequest("PUT", "/api/store/settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/settings"] });
      toast({
        title: "Configurações atualizadas!",
        description: "As configurações de entrega foram salvas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar configurações",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delivery Zone Mutations
  const createZoneMutation = useMutation({
    mutationFn: async (zoneData: any) => {
      return await apiRequest("POST", "/api/delivery-zones", zoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setShowNewZoneForm(false);
      setEditingZone(null);
      toast({
        title: "Zona de entrega criada!",
        description: "Nova zona foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar zona",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: async (zoneData: any) => {
      return await apiRequest("PUT", `/api/delivery-zones/${zoneData.id}`, zoneData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      setEditingZone(null);
      toast({
        title: "Zona atualizada!",
        description: "As alterações foram salvas.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar zona",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: async (zoneId: string) => {
      return await apiRequest("DELETE", `/api/delivery-zones/${zoneId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-zones"] });
      toast({
        title: "Zona removida!",
        description: "Zona de entrega foi removida.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover zona",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleToggleNeighborhoodDelivery = () => {
    if (!storeSettings) return;
    updateStoreSettingsMutation.mutate({
      useNeighborhoodDelivery: !storeSettings.useNeighborhoodDelivery,
    });
  };

  const handleUpdateDefaultFee = (fee: string) => {
    if (!storeSettings) return;
    updateStoreSettingsMutation.mutate({
      defaultDeliveryFee: fee,
    });
  };

  const handleEditZone = (zone: DeliveryZone) => {
    setEditingZone({
      id: zone.id,
      neighborhoodName: zone.neighborhoodName,
      deliveryFee: zone.deliveryFee,
      isActive: zone.isActive ?? true,
    });
  };

  const handleSaveZone = () => {
    if (!editingZone) return;

    const zoneData = {
      id: editingZone.id,
      neighborhoodName: editingZone.neighborhoodName,
      deliveryFee: editingZone.deliveryFee,
      isActive: editingZone.isActive,
    };

    if (editingZone.id) {
      updateZoneMutation.mutate(zoneData);
    } else {
      createZoneMutation.mutate(zoneData);
    }
  };

  const handleDeleteZone = (zoneId: string) => {
    if (confirm("Tem certeza que deseja remover esta zona de entrega?")) {
      deleteZoneMutation.mutate(zoneId);
    }
  };

  const startNewZone = () => {
    setEditingZone({
      neighborhoodName: "",
      deliveryFee: "5.90",
      isActive: true,
    });
    setShowNewZoneForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Configurações de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Taxa por Bairro</Label>
              <p className="text-sm text-muted-foreground">
                Ativar cobrança diferenciada por bairro
              </p>
            </div>
            <Switch
              checked={!!storeSettings?.useNeighborhoodDelivery}
              onCheckedChange={handleToggleNeighborhoodDelivery}
              data-testid="switch-neighborhood-delivery"
            />
          </div>

          <div>
            <Label htmlFor="defaultFee">Taxa de Entrega Padrão (R$)</Label>
            <Input
              id="defaultFee"
              type="number"
              step="0.01"
              value={storeSettings?.defaultDeliveryFee || "5.90"}
              onChange={(e) => handleUpdateDefaultFee(e.target.value)}
              className="mt-1 max-w-xs"
              data-testid="input-default-fee"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {storeSettings?.useNeighborhoodDelivery 
                ? "Taxa aplicada quando o bairro não está na lista"
                : "Taxa única aplicada para todas as entregas"
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Zones Management */}
      {storeSettings?.useNeighborhoodDelivery && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Bairros e Taxas ({deliveryZones.length})
              </CardTitle>
              <Button 
                onClick={startNewZone}
                className="bg-accent hover:bg-accent/90"
                data-testid="button-new-zone"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Bairro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* New Zone Form */}
            {showNewZoneForm && (
              <Card className="mb-4 bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">Adicionar Novo Bairro</CardTitle>
                </CardHeader>
                <CardContent>
                  <ZoneForm
                    zone={editingZone}
                    setZone={setEditingZone}
                    onSave={handleSaveZone}
                    onCancel={() => {
                      setShowNewZoneForm(false);
                      setEditingZone(null);
                    }}
                    isLoading={createZoneMutation.isPending}
                    isCreating={true}
                  />
                </CardContent>
              </Card>
            )}

            {/* Zones List */}
            <div className="space-y-4">
              {deliveryZones.map((zone) => (
                <div key={zone.id} className="border border-border rounded-lg p-4">
                  {editingZone?.id === zone.id ? (
                    <ZoneForm
                      zone={editingZone}
                      setZone={setEditingZone}
                      onSave={handleSaveZone}
                      onCancel={() => setEditingZone(null)}
                      isLoading={updateZoneMutation.isPending}
                      isCreating={false}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{zone.neighborhoodName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Taxa: R$ {parseFloat(zone.deliveryFee).toFixed(2)}
                          </p>
                        </div>
                        <Badge variant={zone.isActive ? "default" : "secondary"}>
                          {zone.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleEditZone(zone)}
                          variant="outline"
                          size="sm"
                          data-testid={`button-edit-zone-${zone.id}`}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteZone(zone.id)}
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-zone-${zone.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {deliveryZones.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum bairro cadastrado</p>
                  <p className="text-sm">Clique em "Novo Bairro" para começar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ZoneFormProps {
  zone: EditingDeliveryZone | null;
  setZone: (zone: EditingDeliveryZone) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isCreating: boolean;
}

function ZoneForm({ zone, setZone, onSave, onCancel, isLoading, isCreating }: ZoneFormProps) {
  if (!zone) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="neighborhoodName">Nome do Bairro *</Label>
          <Input
            id="neighborhoodName"
            value={zone.neighborhoodName}
            onChange={(e) => setZone({ ...zone, neighborhoodName: e.target.value })}
            placeholder="Ex: Centro, Vila Madalena"
            data-testid="input-neighborhood-name"
          />
        </div>
        <div>
          <Label htmlFor="deliveryFee">Taxa de Entrega (R$) *</Label>
          <Input
            id="deliveryFee"
            type="number"
            step="0.01"
            value={zone.deliveryFee}
            onChange={(e) => setZone({ ...zone, deliveryFee: e.target.value })}
            placeholder="5.90"
            data-testid="input-delivery-fee"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          checked={zone.isActive}
          onCheckedChange={(checked) => setZone({ ...zone, isActive: checked })}
          data-testid="switch-zone-active"
        />
        <Label>Zona ativa</Label>
      </div>

      <Separator />

      <div className="flex space-x-2">
        <Button
          onClick={onSave}
          disabled={isLoading || !zone.neighborhoodName || !zone.deliveryFee}
          className="bg-accent hover:bg-accent/90"
          data-testid="button-save-zone"
        >
          <Save className="mr-1 h-4 w-4" />
          {isLoading ? "Salvando..." : (isCreating ? "Criar Bairro" : "Salvar Alterações")}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          data-testid="button-cancel-zone"
        >
          <X className="mr-1 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}