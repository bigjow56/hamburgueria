import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Megaphone, Calendar, Target, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Campaign {
  id: string;
  name: string;
  description: string;
  campaignType: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  pointsMultiplier: string;
  groupGoalTarget?: number;
  groupGoalCurrent: number;
  groupGoalReward?: number;
  applicableCategories: string[];
  applicableTiers: string[];
  minOrderAmount?: string;
  maxRedemptionsPerUser: number;
  totalBudget?: string;
  usedBudget: string;
  bannerImageUrl?: string;
  backgroundColor: string;
  textColor: string;
  termsAndConditions?: string;
  createdAt: string;
}

export function AdminCampaigns() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/campaigns', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/campaigns/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
      setIsEditOpen(false);
      setEditingCampaign(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/campaigns/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/campaigns'] });
    },
  });

  const campaignTypes = [
    { value: 'double_points', label: 'Pontos Duplos/Triplos', icon: TrendingUp },
    { value: 'seasonal', label: 'Campanha Sazonal', icon: Calendar },
    { value: 'group_goal', label: 'Meta de Grupo', icon: Target },
    { value: 'tier_bonus', label: 'Bônus por Tier', icon: Megaphone },
  ];

  const tiers = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Prata' },
    { value: 'gold', label: 'Ouro' },
  ];

  const CampaignForm = ({ campaign, onSubmit, isSubmitting }: { campaign?: Campaign, onSubmit: (data: any) => void, isSubmitting: boolean }) => {
    const [formData, setFormData] = useState({
      name: campaign?.name || '',
      description: campaign?.description || '',
      campaignType: campaign?.campaignType || 'double_points',
      isActive: campaign?.isActive ?? false,
      startDate: campaign?.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign?.endDate ? campaign.endDate.split('T')[0] : '',
      pointsMultiplier: campaign?.pointsMultiplier || '2.00',
      groupGoalTarget: campaign?.groupGoalTarget || 100,
      groupGoalReward: campaign?.groupGoalReward || 500,
      applicableTiers: campaign?.applicableTiers || [],
      minOrderAmount: campaign?.minOrderAmount || '',
      maxRedemptionsPerUser: campaign?.maxRedemptionsPerUser || -1,
      totalBudget: campaign?.totalBudget || '',
      backgroundColor: campaign?.backgroundColor || '#ff6b35',
      textColor: campaign?.textColor || '#ffffff',
      bannerImageUrl: campaign?.bannerImageUrl || '',
      termsAndConditions: campaign?.termsAndConditions || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Pontos Duplos Black Friday"
              required
              data-testid="input-campaign-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaignType">Tipo de Campanha</Label>
            <Select value={formData.campaignType} onValueChange={(value) => setFormData({...formData, campaignType: value})}>
              <SelectTrigger data-testid="select-campaign-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campaignTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Descreva a campanha..."
            required
            data-testid="textarea-description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data de Início</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              required
              data-testid="input-start-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Data de Término</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              required
              data-testid="input-end-date"
            />
          </div>
        </div>

        {(formData.campaignType === 'double_points' || formData.campaignType === 'tier_bonus') && (
          <div className="space-y-2">
            <Label htmlFor="pointsMultiplier">Multiplicador de Pontos</Label>
            <Input
              id="pointsMultiplier"
              type="number"
              step="0.1"
              min="1"
              value={formData.pointsMultiplier}
              onChange={(e) => setFormData({...formData, pointsMultiplier: e.target.value})}
              placeholder="2.00"
              data-testid="input-points-multiplier"
            />
            <p className="text-sm text-gray-500">
              Ex: 2.0 para pontos duplos, 3.0 para pontos triplos
            </p>
          </div>
        )}

        {formData.campaignType === 'group_goal' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupGoalTarget">Meta do Grupo</Label>
              <Input
                id="groupGoalTarget"
                type="number"
                min="1"
                value={formData.groupGoalTarget}
                onChange={(e) => setFormData({...formData, groupGoalTarget: parseInt(e.target.value)})}
                placeholder="100"
                data-testid="input-group-goal-target"
              />
              <p className="text-sm text-gray-500">
                Quantos pedidos/produtos para atingir a meta
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupGoalReward">Recompensa (Pontos)</Label>
              <Input
                id="groupGoalReward"
                type="number"
                min="1"
                value={formData.groupGoalReward}
                onChange={(e) => setFormData({...formData, groupGoalReward: parseInt(e.target.value)})}
                placeholder="500"
                data-testid="input-group-goal-reward"
              />
              <p className="text-sm text-gray-500">
                Pontos que todos ganham se atingir a meta
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minOrderAmount">Valor Mínimo do Pedido (R$)</Label>
            <Input
              id="minOrderAmount"
              type="number"
              step="0.01"
              min="0"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
              placeholder="0.00"
              data-testid="input-min-order-amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxRedemptionsPerUser">Limite por Usuário</Label>
            <Input
              id="maxRedemptionsPerUser"
              type="number"
              value={formData.maxRedemptionsPerUser}
              onChange={(e) => setFormData({...formData, maxRedemptionsPerUser: parseInt(e.target.value)})}
              placeholder="-1 para ilimitado"
              data-testid="input-max-redemptions"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalBudget">Orçamento Total (Pontos)</Label>
          <Input
            id="totalBudget"
            type="number"
            min="0"
            value={formData.totalBudget}
            onChange={(e) => setFormData({...formData, totalBudget: e.target.value})}
            placeholder="Deixe vazio para ilimitado"
            data-testid="input-total-budget"
          />
        </div>

        {/* Visual Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Cor de Fundo</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="backgroundColor"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({...formData, backgroundColor: e.target.value})}
                placeholder="#ff6b35"
                data-testid="input-background-color"
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: formData.backgroundColor }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="textColor">Cor do Texto</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="textColor"
                value={formData.textColor}
                onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                placeholder="#ffffff"
                data-testid="input-text-color"
              />
              <div 
                className="w-8 h-8 rounded border"
                style={{ backgroundColor: formData.textColor }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bannerImageUrl">URL da Imagem do Banner</Label>
          <Input
            id="bannerImageUrl"
            value={formData.bannerImageUrl}
            onChange={(e) => setFormData({...formData, bannerImageUrl: e.target.value})}
            placeholder="https://exemplo.com/banner.jpg"
            data-testid="input-banner-image"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="termsAndConditions">Termos e Condições</Label>
          <Textarea
            id="termsAndConditions"
            value={formData.termsAndConditions}
            onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
            placeholder="Termos e condições da campanha..."
            rows={3}
            data-testid="textarea-terms"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Campanha ativa</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting} data-testid="submit-campaign-form">
            {isSubmitting ? 'Salvando...' : (campaign ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    );
  };

  const getCampaignTypeInfo = (type: string) => {
    return campaignTypes.find(ct => ct.value === type) || campaignTypes[0];
  };

  const isActive = (campaign: Campaign) => {
    if (!campaign.isActive) return false;
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);
    return now >= start && now <= end;
  };

  const getStatusColor = (campaign: Campaign) => {
    if (!campaign.isActive) return 'bg-gray-100 text-gray-800';
    if (isActive(campaign)) return 'bg-green-100 text-green-800';
    const now = new Date();
    const start = new Date(campaign.startDate);
    if (now < start) return 'bg-blue-100 text-blue-800'; // Agendada
    return 'bg-red-100 text-red-800'; // Expirada
  };

  const getStatusLabel = (campaign: Campaign) => {
    if (!campaign.isActive) return 'Inativa';
    if (isActive(campaign)) return 'Ativa';
    const now = new Date();
    const start = new Date(campaign.startDate);
    if (now < start) return 'Agendada';
    return 'Expirada';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-campaigns">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900" data-testid="campaigns-title">
            Campanhas Especiais
          </h2>
          <p className="text-gray-600">
            Gerencie campanhas promocionais e eventos especiais
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-campaign-button">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Configure uma nova campanha promocional
              </DialogDescription>
            </DialogHeader>
            <CampaignForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns?.map((campaign) => {
          const typeInfo = getCampaignTypeInfo(campaign.campaignType);
          const IconComponent = typeInfo.icon;
          
          return (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow" data-testid={`campaign-card-${campaign.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <IconComponent className="h-5 w-5 mr-2" style={{ color: campaign.backgroundColor }} />
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getStatusColor(campaign)}>
                        {getStatusLabel(campaign)}
                      </Badge>
                      <Badge variant="outline">
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCampaign(campaign);
                        setIsEditOpen(true);
                      }}
                      data-testid={`edit-campaign-${campaign.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta campanha?')) {
                          deleteMutation.mutate(campaign.id);
                        }
                      }}
                      data-testid={`delete-campaign-${campaign.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4" data-testid={`campaign-description-${campaign.id}`}>
                  {campaign.description}
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Período:</span>
                    <span className="font-medium">
                      {new Date(campaign.startDate).toLocaleDateString('pt-BR')} - {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {campaign.pointsMultiplier && parseFloat(campaign.pointsMultiplier) > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Multiplicador:</span>
                      <span className="font-medium text-blue-600">{campaign.pointsMultiplier}x</span>
                    </div>
                  )}
                  
                  {campaign.campaignType === 'group_goal' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Meta:</span>
                        <span className="font-medium">{campaign.groupGoalTarget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Progresso:</span>
                        <span className="font-medium">{campaign.groupGoalCurrent}/{campaign.groupGoalTarget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recompensa:</span>
                        <span className="font-medium text-green-600">{campaign.groupGoalReward} pts</span>
                      </div>
                    </>
                  )}
                  
                  {campaign.minOrderAmount && parseFloat(campaign.minOrderAmount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pedido mínimo:</span>
                      <span className="font-medium">R$ {parseFloat(campaign.minOrderAmount).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {campaign.totalBudget && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Orçamento:</span>
                      <span className="font-medium">
                        {parseFloat(campaign.usedBudget).toLocaleString('pt-BR')} / {parseFloat(campaign.totalBudget).toLocaleString('pt-BR')} pts
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Limite por usuário:</span>
                    <span className="font-medium">
                      {campaign.maxRedemptionsPerUser === -1 ? 'Ilimitado' : campaign.maxRedemptionsPerUser}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {campaigns?.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma campanha criada</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Altere as configurações da campanha
            </DialogDescription>
          </DialogHeader>
          {editingCampaign && (
            <CampaignForm 
              campaign={editingCampaign}
              onSubmit={(data) => updateMutation.mutate({ id: editingCampaign.id, ...data })} 
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}