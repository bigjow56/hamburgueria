import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Trophy, Crown, Medal, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoyaltyTiersConfig {
  id: string;
  name: string;
  displayName: string;
  color: string;
  icon: string;
  minPointsRequired: number;
  minTotalSpent: string;
  minOrdersCount: number;
  pointsMultiplier: string;
  freeShippingEnabled: boolean;
  exclusiveDiscounts: boolean;
  prioritySupport: boolean;
  birthdayBonus: number;
  benefits: string[];
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export function AdminTiers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTiersConfig | null>(null);
  
  const queryClient = useQueryClient();

  const { data: tiers, isLoading } = useQuery<LoyaltyTiersConfig[]>({
    queryKey: ['/api/admin/loyalty-tiers'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/loyalty-tiers', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/loyalty-tiers/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
      setIsEditOpen(false);
      setEditingTier(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/loyalty-tiers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty-tiers'] });
    },
  });

  const tierIcons = [
    { value: 'medal', label: 'Medal', icon: Medal },
    { value: 'trophy', label: 'Trophy', icon: Trophy },
    { value: 'crown', label: 'Crown', icon: Crown },
    { value: 'award', label: 'Award', icon: Award },
  ];

  const TierForm = ({ tier, onSubmit, isSubmitting }: { tier?: LoyaltyTiersConfig, onSubmit: (data: any) => void, isSubmitting: boolean }) => {
    const [formData, setFormData] = useState({
      name: tier?.name || '',
      displayName: tier?.displayName || '',
      color: tier?.color || '#8B5A2B',
      icon: tier?.icon || 'medal',
      minPointsRequired: tier?.minPointsRequired || 0,
      minTotalSpent: tier?.minTotalSpent || '0.00',
      minOrdersCount: tier?.minOrdersCount || 0,
      pointsMultiplier: tier?.pointsMultiplier || '1.00',
      freeShippingEnabled: tier?.freeShippingEnabled || false,
      exclusiveDiscounts: tier?.exclusiveDiscounts || false,
      prioritySupport: tier?.prioritySupport || false,
      birthdayBonus: tier?.birthdayBonus || 0,
      benefits: tier?.benefits?.join('\n') || '',
      description: tier?.description || '',
      sortOrder: tier?.sortOrder || 0,
      isActive: tier?.isActive ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        benefits: formData.benefits.split('\n').filter(b => b.trim()),
      };
      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Técnico</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="bronze"
              required
              data-testid="input-tier-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              placeholder="Bronze"
              required
              data-testid="input-display-name"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Cor (Hex)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                placeholder="#8B5A2B"
                data-testid="input-color"
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: formData.color }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Ícone</Label>
            <select
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
              data-testid="select-icon"
            >
              {tierIcons.map((icon) => (
                <option key={icon.value} value={icon.value}>{icon.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Ordem</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value)})}
              placeholder="0"
              data-testid="input-sort-order"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPointsRequired">Pontos Mínimos</Label>
            <Input
              id="minPointsRequired"
              type="number"
              min="0"
              value={formData.minPointsRequired}
              onChange={(e) => setFormData({...formData, minPointsRequired: parseInt(e.target.value)})}
              data-testid="input-min-points"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minTotalSpent">Gasto Mínimo (R$)</Label>
            <Input
              id="minTotalSpent"
              type="number"
              step="0.01"
              min="0"
              value={formData.minTotalSpent}
              onChange={(e) => setFormData({...formData, minTotalSpent: e.target.value})}
              data-testid="input-min-spent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minOrdersCount">Pedidos Mínimos</Label>
            <Input
              id="minOrdersCount"
              type="number"
              min="0"
              value={formData.minOrdersCount}
              onChange={(e) => setFormData({...formData, minOrdersCount: parseInt(e.target.value)})}
              data-testid="input-min-orders"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pointsMultiplier">Multiplicador de Pontos</Label>
            <Input
              id="pointsMultiplier"
              type="number"
              step="0.1"
              min="1"
              value={formData.pointsMultiplier}
              onChange={(e) => setFormData({...formData, pointsMultiplier: e.target.value})}
              placeholder="1.00"
              data-testid="input-points-multiplier"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthdayBonus">Bônus de Aniversário</Label>
            <Input
              id="birthdayBonus"
              type="number"
              min="0"
              value={formData.birthdayBonus}
              onChange={(e) => setFormData({...formData, birthdayBonus: parseInt(e.target.value)})}
              placeholder="0"
              data-testid="input-birthday-bonus"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="freeShippingEnabled"
                checked={formData.freeShippingEnabled}
                onCheckedChange={(checked) => setFormData({...formData, freeShippingEnabled: checked})}
                data-testid="switch-free-shipping"
              />
              <Label htmlFor="freeShippingEnabled">Frete Grátis</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="exclusiveDiscounts"
                checked={formData.exclusiveDiscounts}
                onCheckedChange={(checked) => setFormData({...formData, exclusiveDiscounts: checked})}
                data-testid="switch-exclusive-discounts"
              />
              <Label htmlFor="exclusiveDiscounts">Descontos Exclusivos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="prioritySupport"
                checked={formData.prioritySupport}
                onCheckedChange={(checked) => setFormData({...formData, prioritySupport: checked})}
                data-testid="switch-priority-support"
              />
              <Label htmlFor="prioritySupport">Suporte Prioritário</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="benefits">Benefícios (um por linha)</Label>
          <Textarea
            id="benefits"
            value={formData.benefits}
            onChange={(e) => setFormData({...formData, benefits: e.target.value})}
            placeholder="Acumule pontos mais rápido&#10;Descontos especiais&#10;Atendimento prioritário"
            rows={4}
            data-testid="textarea-benefits"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descrição do tier..."
            rows={2}
            data-testid="textarea-description"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Tier ativo</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting} data-testid="submit-tier-form">
            {isSubmitting ? 'Salvando...' : (tier ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    );
  };

  const getTierIcon = (iconName: string) => {
    const iconInfo = tierIcons.find(i => i.value === iconName);
    return iconInfo ? iconInfo.icon : Medal;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const sortedTiers = tiers?.sort((a, b) => a.sortOrder - b.sortOrder) || [];

  return (
    <div className="space-y-6" data-testid="admin-tiers">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words" data-testid="tiers-title">
            Tiers de Fidelidade
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Configure os níveis de fidelidade e seus benefícios
          </p>
        </div>
        <div className="flex-shrink-0">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" data-testid="create-tier-button">
                <Plus className="h-4 w-4 mr-2" />
                Novo Tier
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Tier de Fidelidade</DialogTitle>
              <DialogDescription>
                Configure um novo nível de fidelidade com benefícios específicos
              </DialogDescription>
            </DialogHeader>
            <TierForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTiers.map((tier) => {
          const IconComponent = getTierIcon(tier.icon);
          
          return (
            <Card key={tier.id} className={`hover:shadow-md transition-shadow border-2 ${!tier.isActive ? 'opacity-60' : ''}`} style={{ borderColor: tier.color }} data-testid={`tier-card-${tier.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${tier.color}20` }}>
                      <IconComponent className="h-6 w-6" style={{ color: tier.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tier.displayName}</CardTitle>
                      <Badge variant="outline" style={{ borderColor: tier.color, color: tier.color }}>
                        {tier.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTier(tier);
                        setIsEditOpen(true);
                      }}
                      data-testid={`edit-tier-${tier.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir este tier?')) {
                          deleteMutation.mutate(tier.id);
                        }
                      }}
                      data-testid={`delete-tier-${tier.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tier.description && (
                  <p className="text-gray-600 mb-4" data-testid={`tier-description-${tier.id}`}>
                    {tier.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pontos mínimos:</span>
                    <span className="font-medium">{tier.minPointsRequired.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gasto mínimo:</span>
                    <span className="font-medium">R$ {parseFloat(tier.minTotalSpent).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Multiplicador:</span>
                    <span className="font-medium text-blue-600">{tier.pointsMultiplier}x</span>
                  </div>
                  {tier.birthdayBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bônus aniversário:</span>
                      <span className="font-medium">{tier.birthdayBonus} pts</span>
                    </div>
                  )}
                </div>

                {/* Benefits */}
                {tier.benefits && tier.benefits.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-sm mb-2">Benefícios:</h4>
                    <ul className="text-xs space-y-1">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-gray-600">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                    {tier.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-xs text-gray-500">Ordem: {tier.sortOrder}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sortedTiers.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum tier de fidelidade configurado</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tier de Fidelidade</DialogTitle>
            <DialogDescription>
              Altere as configurações do tier de fidelidade
            </DialogDescription>
          </DialogHeader>
          {editingTier && (
            <TierForm 
              tier={editingTier}
              onSubmit={(data) => updateMutation.mutate({ id: editingTier.id, ...data })} 
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}