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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Gift, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: string;
  value?: string;
  discountPercentage?: number;
  imageUrl?: string;
  stock: number;
  isActive: boolean;
  minTier: string;
  createdAt: string;
}

export function AdminRewards() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery<LoyaltyReward[]>({
    queryKey: ['/api/admin/rewards'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/rewards', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/rewards/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards'] });
      setIsEditOpen(false);
      setEditingReward(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/rewards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards'] });
    },
  });

  const categories = [
    { value: 'discount', label: 'Desconto', color: 'bg-blue-100 text-blue-800' },
    { value: 'freebie', label: 'Brinde', color: 'bg-green-100 text-green-800' },
    { value: 'cashback', label: 'Cashback', color: 'bg-orange-100 text-orange-800' },
    { value: 'product', label: 'Produto', color: 'bg-purple-100 text-purple-800' },
  ];

  const tiers = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Prata' },
    { value: 'gold', label: 'Ouro' },
  ];

  const filteredRewards = rewards?.filter(reward => {
    if (filterCategory !== 'all' && reward.category !== filterCategory) return false;
    if (filterActive !== 'all' && reward.isActive.toString() !== filterActive) return false;
    return true;
  }) || [];

  const getCategoryInfo = (category: string) => {
    return categories.find(cat => cat.value === category) || categories[0];
  };

  const RewardForm = ({ reward, onSubmit, isSubmitting }: { reward?: LoyaltyReward, onSubmit: (data: any) => void, isSubmitting: boolean }) => {
    const [formData, setFormData] = useState({
      name: reward?.name || '',
      description: reward?.description || '',
      pointsRequired: reward?.pointsRequired || 0,
      category: reward?.category || 'discount',
      value: reward?.value || '',
      discountPercentage: reward?.discountPercentage || 0,
      imageUrl: reward?.imageUrl || '',
      stock: reward?.stock || -1,
      isActive: reward?.isActive ?? true,
      minTier: reward?.minTier || 'bronze',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Recompensa</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Desconto 20%"
              required
              data-testid="input-reward-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
            placeholder="Descreva a recompensa..."
            required
            data-testid="textarea-description"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pointsRequired">Pontos Necessários</Label>
            <Input
              id="pointsRequired"
              type="number"
              min="1"
              value={formData.pointsRequired}
              onChange={(e) => setFormData({...formData, pointsRequired: parseInt(e.target.value)})}
              required
              data-testid="input-points-required"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              placeholder="0.00"
              data-testid="input-value"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountPercentage">Desconto (%)</Label>
            <Input
              id="discountPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.discountPercentage}
              onChange={(e) => setFormData({...formData, discountPercentage: parseInt(e.target.value)})}
              data-testid="input-discount-percentage"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Estoque</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
              placeholder="-1 para ilimitado"
              data-testid="input-stock"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minTier">Tier Mínimo</Label>
            <Select value={formData.minTier} onValueChange={(value) => setFormData({...formData, minTier: value})}>
              <SelectTrigger data-testid="select-min-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiers.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL da Imagem</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            placeholder="https://exemplo.com/imagem.jpg"
            data-testid="input-image-url"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Recompensa ativa</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting} data-testid="submit-reward-form">
            {isSubmitting ? 'Salvando...' : (reward ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
    <div className="space-y-6" data-testid="admin-rewards">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900" data-testid="rewards-title">
            Gerenciar Recompensas
          </h2>
          <p className="text-gray-600">
            Configure as recompensas disponíveis no programa de fidelidade
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-reward-button">
              <Plus className="h-4 w-4 mr-2" />
              Nova Recompensa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Recompensa</DialogTitle>
              <DialogDescription>
                Configure uma nova recompensa para o programa de fidelidade
              </DialogDescription>
            </DialogHeader>
            <RewardForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48" data-testid="filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-48" data-testid="filter-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="true">Apenas ativas</SelectItem>
                  <SelectItem value="false">Apenas inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRewards.map((reward) => {
          const categoryInfo = getCategoryInfo(reward.category);
          
          return (
            <Card key={reward.id} className={`hover:shadow-md transition-shadow ${!reward.isActive ? 'opacity-60' : ''}`} data-testid={`reward-card-${reward.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Gift className="h-5 w-5 mr-2 text-blue-600" />
                      {reward.name}
                    </CardTitle>
                    <Badge className={`${categoryInfo.color} mt-2`}>
                      {categoryInfo.label}
                    </Badge>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingReward(reward);
                        setIsEditOpen(true);
                      }}
                      data-testid={`edit-reward-${reward.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta recompensa?')) {
                          deleteMutation.mutate(reward.id);
                        }
                      }}
                      data-testid={`delete-reward-${reward.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4" data-testid={`reward-description-${reward.id}`}>
                  {reward.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pontos necessários:</span>
                    <span className="font-medium text-blue-600" data-testid={`reward-points-${reward.id}`}>
                      {reward.pointsRequired.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {reward.value && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Valor:</span>
                      <span className="font-medium">R$ {reward.value}</span>
                    </div>
                  )}
                  {reward.discountPercentage && reward.discountPercentage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Desconto:</span>
                      <span className="font-medium">{reward.discountPercentage}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tier mínimo:</span>
                    <Badge variant="outline">{reward.minTier}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Estoque:</span>
                    <span className="font-medium">
                      {reward.stock === -1 ? 'Ilimitado' : reward.stock}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                      {reward.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma recompensa encontrada</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Recompensa</DialogTitle>
            <DialogDescription>
              Altere as informações da recompensa
            </DialogDescription>
          </DialogHeader>
          {editingReward && (
            <RewardForm 
              reward={editingReward}
              onSubmit={(data) => updateMutation.mutate({ id: editingReward.id, ...data })} 
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}