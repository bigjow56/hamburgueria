import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Target, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PointsRule {
  id: string;
  name: string;
  ruleType: string;
  isActive: boolean;
  basePointsPerReal?: string;
  categoryId?: string;
  categoryMultiplier?: string;
  tierName?: string;
  tierMultiplier?: string;
  actionType?: string;
  actionPoints?: number;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
}

export function AdminPointsRules() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PointsRule | null>(null);
  
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery<PointsRule[]>({
    queryKey: ['/api/admin/points-rules'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/points-rules', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/points-rules'] });
      setIsCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/admin/points-rules/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/points-rules'] });
      setIsEditOpen(false);
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/points-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/points-rules'] });
    },
  });

  const ruleTypes = [
    { value: 'base', label: 'Regra Base (R$ → Pontos)' },
    { value: 'category_multiplier', label: 'Multiplicador por Categoria' },
    { value: 'tier_multiplier', label: 'Multiplicador por Tier' },
    { value: 'action_bonus', label: 'Bônus por Ação' },
  ];

  const actionTypes = [
    { value: 'signup', label: 'Cadastro' },
    { value: 'first_purchase', label: 'Primeira Compra' },
    { value: 'referral', label: 'Indicação' },
    { value: 'review', label: 'Avaliação' },
    { value: 'birthday', label: 'Aniversário' },
  ];

  const tiers = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Prata' },
    { value: 'gold', label: 'Ouro' },
  ];

  const RuleForm = ({ rule, onSubmit, isSubmitting }: { rule?: PointsRule, onSubmit: (data: any) => void, isSubmitting: boolean }) => {
    const [formData, setFormData] = useState({
      name: rule?.name || '',
      ruleType: rule?.ruleType || 'base',
      isActive: rule?.isActive ?? true,
      basePointsPerReal: rule?.basePointsPerReal || '1.00',
      categoryMultiplier: rule?.categoryMultiplier || '1.00',
      tierName: rule?.tierName || 'bronze',
      tierMultiplier: rule?.tierMultiplier || '1.00',
      actionType: rule?.actionType || 'signup',
      actionPoints: rule?.actionPoints || 100,
      validUntil: rule?.validUntil ? rule.validUntil.split('T')[0] : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Regra</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Pontos Base"
              required
              data-testid="input-rule-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruleType">Tipo de Regra</Label>
            <Select value={formData.ruleType} onValueChange={(value) => setFormData({...formData, ruleType: value})}>
              <SelectTrigger data-testid="select-rule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campos condicionais baseados no tipo de regra */}
        {formData.ruleType === 'base' && (
          <div className="space-y-2">
            <Label htmlFor="basePointsPerReal">Pontos por Real (R$)</Label>
            <Input
              id="basePointsPerReal"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePointsPerReal}
              onChange={(e) => setFormData({...formData, basePointsPerReal: e.target.value})}
              placeholder="1.00"
              data-testid="input-base-points"
            />
            <p className="text-sm text-gray-500">
              Quantos pontos o cliente ganha para cada R$ 1,00 gasto
            </p>
          </div>
        )}

        {formData.ruleType === 'category_multiplier' && (
          <div className="space-y-2">
            <Label htmlFor="categoryMultiplier">Multiplicador da Categoria</Label>
            <Input
              id="categoryMultiplier"
              type="number"
              step="0.1"
              min="0"
              value={formData.categoryMultiplier}
              onChange={(e) => setFormData({...formData, categoryMultiplier: e.target.value})}
              placeholder="1.5"
              data-testid="input-category-multiplier"
            />
            <p className="text-sm text-gray-500">
              Multiplicador aplicado aos pontos desta categoria (ex: 1.5x para hambúrguers)
            </p>
          </div>
        )}

        {formData.ruleType === 'tier_multiplier' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tierName">Tier</Label>
              <Select value={formData.tierName} onValueChange={(value) => setFormData({...formData, tierName: value})}>
                <SelectTrigger data-testid="select-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierMultiplier">Multiplicador</Label>
              <Input
                id="tierMultiplier"
                type="number"
                step="0.1"
                min="1"
                value={formData.tierMultiplier}
                onChange={(e) => setFormData({...formData, tierMultiplier: e.target.value})}
                placeholder="1.5"
                data-testid="input-tier-multiplier"
              />
            </div>
          </div>
        )}

        {formData.ruleType === 'action_bonus' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Ação</Label>
              <Select value={formData.actionType} onValueChange={(value) => setFormData({...formData, actionType: value})}>
                <SelectTrigger data-testid="select-action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((action) => (
                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actionPoints">Pontos do Bônus</Label>
              <Input
                id="actionPoints"
                type="number"
                min="1"
                value={formData.actionPoints}
                onChange={(e) => setFormData({...formData, actionPoints: parseInt(e.target.value)})}
                placeholder="100"
                data-testid="input-action-points"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="validUntil">Data de Expiração (opcional)</Label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
            data-testid="input-valid-until"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Regra ativa</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isSubmitting} data-testid="submit-rule-form">
            {isSubmitting ? 'Salvando...' : (rule ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </form>
    );
  };

  const getRuleTypeLabel = (type: string) => {
    return ruleTypes.find(rt => rt.value === type)?.label || type;
  };

  const getActionTypeLabel = (type: string) => {
    return actionTypes.find(at => at.value === type)?.label || type;
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
    <div className="space-y-6" data-testid="admin-points-rules">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words" data-testid="points-rules-title">
            Regras de Pontuação
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Configure como os pontos são distribuídos no programa de fidelidade
          </p>
        </div>
        <div className="flex-shrink-0">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" data-testid="create-rule-button">
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Regra de Pontuação</DialogTitle>
              <DialogDescription>
                Configure uma nova regra para distribuição de pontos
              </DialogDescription>
            </DialogHeader>
            <RuleForm 
              onSubmit={(data) => createMutation.mutate(data)} 
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules?.map((rule) => (
          <Card key={rule.id} className={`hover:shadow-md transition-shadow ${!rule.isActive ? 'opacity-60' : ''}`} data-testid={`rule-card-${rule.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    {rule.name}
                  </CardTitle>
                  <Badge className="mt-2" data-testid={`rule-type-${rule.id}`}>
                    {getRuleTypeLabel(rule.ruleType)}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule);
                      setIsEditOpen(true);
                    }}
                    data-testid={`edit-rule-${rule.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                    data-testid={`delete-rule-${rule.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rule.ruleType === 'base' && rule.basePointsPerReal && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pontos por R$:</span>
                    <span className="font-medium">{rule.basePointsPerReal}</span>
                  </div>
                )}
                
                {rule.ruleType === 'category_multiplier' && rule.categoryMultiplier && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Multiplicador:</span>
                    <span className="font-medium">{rule.categoryMultiplier}x</span>
                  </div>
                )}
                
                {rule.ruleType === 'tier_multiplier' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tier:</span>
                      <Badge variant="outline">{rule.tierName}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Multiplicador:</span>
                      <span className="font-medium">{rule.tierMultiplier}x</span>
                    </div>
                  </>
                )}
                
                {rule.ruleType === 'action_bonus' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Ação:</span>
                      <span className="font-medium">{getActionTypeLabel(rule.actionType || '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Pontos:</span>
                      <span className="font-medium text-blue-600">{rule.actionPoints}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                
                {rule.validUntil && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Expira em:</span>
                    <span className="text-sm">{new Date(rule.validUntil).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rules?.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma regra de pontuação configurada</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Regra de Pontuação</DialogTitle>
            <DialogDescription>
              Altere as configurações da regra de pontuação
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <RuleForm 
              rule={editingRule}
              onSubmit={(data) => updateMutation.mutate({ id: editingRule.id, ...data })} 
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}