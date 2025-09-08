import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Users, UserCheck, Gift, Search, Filter, Trophy, Medal, Award, Crown, CheckCircle, XCircle, Plus, UserPlus, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  pointsBalance: number;
  totalPointsEarned: number;
  loyaltyTier: string;
  createdAt: string;
}

interface Redemption {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone: string;
  rewardName: string;
  pointsUsed: number;
  status: string;
  redemptionCode: string;
  createdAt: string;
}

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  category: string;
  isActive: boolean;
  stock: number;
  minTier: string;
}

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // New customer registration states
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: ''
  });

  // Manual redemption states
  const [isManualRedemptionOpen, setIsManualRedemptionOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReward, setSelectedReward] = useState<string>('');
  const [redemptionNote, setRedemptionNote] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const queryClient = useQueryClient();

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: redemptions, isLoading: loadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ['/api/admin/redemptions'],
  });

  // Query for available rewards
  const { data: rewards } = useQuery<Reward[]>({
    queryKey: ['/api/admin/rewards'],
  });

  // Query for searching users
  const { data: searchedUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/search-users', userSearchTerm],
    enabled: userSearchTerm.length > 2,
    queryFn: () => apiRequest(`/api/admin/search-users?q=${encodeURIComponent(userSearchTerm)}`),
  });

  // Mutation for updating redemption status
  const updateStatusMutation = useMutation({
    mutationFn: ({ redemptionId, status }: { redemptionId: string; status: string }) => 
      apiRequest(`/api/loyalty/admin/redemptions/${redemptionId}/status`, { 
        method: 'PUT', 
        body: { status } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemptions'] });
      toast({
        title: "Status atualizado!",
        description: "O status do resgate foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status do resgate",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating new user
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => apiRequest('/api/admin/users', { method: 'POST', body: userData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsCreateUserOpen(false);
      setNewUserData({ name: '', email: '', phone: '', password: '', address: '' });
      toast({
        title: "Cliente cadastrado!",
        description: "Cliente cadastrado com sucesso e recebeu 100 pontos de bônus.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar cliente",
        variant: "destructive",
      });
    },
  });

  // Mutation for manual redemption
  const manualRedemptionMutation = useMutation({
    mutationFn: (data: { userId: string; rewardId: string; adminNote: string }) => 
      apiRequest('/api/admin/manual-redemption', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/redemptions'] });
      setIsManualRedemptionOpen(false);
      setSelectedUser(null);
      setSelectedReward('');
      setRedemptionNote('');
      setUserSearchTerm('');
      toast({
        title: "Resgate realizado!",
        description: "Resgate manual realizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar resgate manual",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term and tier
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || user.loyaltyTier === tierFilter;
    return matchesSearch && matchesTier;
  }) || [];

  // Filter redemptions based on search term and status
  const filteredRedemptions = redemptions?.filter(redemption => {
    const matchesSearch = redemption.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         redemption.userPhone.includes(searchTerm) ||
                         redemption.rewardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         redemption.redemptionCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Medal className="w-4 h-4" />;
      case 'silver': return <Trophy className="w-4 h-4" />;
      case 'gold': return <Crown className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleStatusChange = (redemptionId: string, newStatus: string) => {
    updateStatusMutation.mutate({ redemptionId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Create User Form Component
  const CreateUserForm = () => {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserData.name || !newUserData.phone || !newUserData.password) {
        toast({
          title: "Erro",
          description: "Nome, telefone e senha são obrigatórios",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(newUserData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo *</Label>
          <Input
            id="name"
            value={newUserData.name}
            onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
            placeholder="Nome do cliente"
            required
            data-testid="input-user-name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={newUserData.phone}
            onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
            placeholder="(11) 99999-9999"
            required
            data-testid="input-user-phone"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={newUserData.email}
            onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
            placeholder="email@exemplo.com"
            data-testid="input-user-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <Input
            id="password"
            type="password"
            value={newUserData.password}
            onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
            placeholder="Senha do cliente"
            required
            data-testid="input-user-password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Textarea
            id="address"
            value={newUserData.address}
            onChange={(e) => setNewUserData({...newUserData, address: e.target.value})}
            placeholder="Endereço completo (opcional)"
            data-testid="textarea-user-address"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsCreateUserOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending}
            data-testid="submit-create-user"
          >
            {createUserMutation.isPending ? 'Cadastrando...' : 'Cadastrar Cliente'}
          </Button>
        </div>
      </form>
    );
  };

  // Manual Redemption Form Component
  const ManualRedemptionForm = () => {
    const activeRewards = rewards?.filter(r => r.isActive && (r.stock === -1 || r.stock > 0)) || [];
    const usersToShow = userSearchTerm.length > 2 ? searchedUsers : users?.slice(0, 10);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedUser || !selectedReward) {
        toast({
          title: "Erro",
          description: "Selecione um cliente e uma recompensa",
          variant: "destructive",
        });
        return;
      }

      manualRedemptionMutation.mutate({
        userId: selectedUser.id,
        rewardId: selectedReward,
        adminNote: redemptionNote || 'Resgate manual - atendimento presencial'
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <div className="space-y-3">
          <Label>1. Selecionar Cliente</Label>
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            data-testid="input-search-users"
          />
          
          {selectedUser ? (
            <Card className="p-3 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                  <p className="text-sm font-medium text-green-600">
                    {selectedUser.pointsBalance} pontos disponíveis
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {usersToShow?.map((user) => (
                <Card 
                  key={user.id} 
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedUser(user)}
                  data-testid={`select-user-${user.id}`}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    </div>
                    <p className="text-sm font-medium text-blue-600">
                      {user.pointsBalance} pts
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reward Selection */}
        <div className="space-y-3">
          <Label htmlFor="reward">2. Selecionar Recompensa</Label>
          <Select value={selectedReward} onValueChange={setSelectedReward}>
            <SelectTrigger data-testid="select-reward">
              <SelectValue placeholder="Escolha uma recompensa" />
            </SelectTrigger>
            <SelectContent>
              {activeRewards.map((reward) => (
                <SelectItem key={reward.id} value={reward.id}>
                  {reward.name} - {reward.pointsRequired} pontos
                  {reward.stock !== -1 && ` (${reward.stock} restantes)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Admin Note */}
        <div className="space-y-2">
          <Label htmlFor="note">3. Observação (opcional)</Label>
          <Textarea
            id="note"
            value={redemptionNote}
            onChange={(e) => setRedemptionNote(e.target.value)}
            placeholder="Ex: Cliente preferiu retirar na loja..."
            data-testid="textarea-admin-note"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsManualRedemptionOpen(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={manualRedemptionMutation.isPending || !selectedUser || !selectedReward}
            data-testid="submit-manual-redemption"
          >
            {manualRedemptionMutation.isPending ? 'Processando...' : 'Realizar Resgate'}
          </Button>
        </div>
      </form>
    );
  };

  if (loadingUsers || loadingRedemptions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Usuários do Sistema</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários do Sistema</h1>
          <p className="text-gray-600">Gerencie usuários e visualize histórico de resgates</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-user-button">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                <DialogDescription>
                  Cadastre um cliente manualmente para o programa de fidelidade
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm />
            </DialogContent>
          </Dialog>

          <Dialog open={isManualRedemptionOpen} onOpenChange={setIsManualRedemptionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="manual-redemption-button">
                <Zap className="w-4 h-4 mr-2" />
                Resgate Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Resgate Manual de Recompensa</DialogTitle>
                <DialogDescription>
                  Realize um resgate de recompensa em nome do cliente (atendimento presencial)
                </DialogDescription>
              </DialogHeader>
              <ManualRedemptionForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários ({users?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Resgates ({redemptions?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar usuários</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      placeholder="Nome, email ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-user-search"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier-filter">Tier</Label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger data-testid="select-tier-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tiers</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                      <SelectItem value="silver">Prata</SelectItem>
                      <SelectItem value="gold">Ouro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum usuário encontrado
                </h3>
                <p className="text-gray-500 text-center">
                  {searchTerm || tierFilter !== 'all' 
                    ? "Tente ajustar os filtros de busca."
                    : "Ainda não há usuários cadastrados no programa de fidelidade."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow" data-testid={`user-card-${user.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                          {user.name}
                        </CardTitle>
                        <Badge className={`${getTierColor(user.loyaltyTier)} mt-2 flex items-center gap-1`}>
                          {getTierIcon(user.loyaltyTier)}
                          {user.loyaltyTier.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Contato:</p>
                        <p className="font-medium">{user.phone}</p>
                        {user.email && (
                          <p className="text-sm text-gray-600">{user.email}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Pontos Disponíveis:</p>
                          <p className="text-xl font-bold text-green-600" data-testid={`user-points-${user.id}`}>
                            {user.pointsBalance.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Ganho:</p>
                          <p className="text-xl font-bold text-blue-600">
                            {user.totalPointsEarned.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Membro desde:</p>
                        <p className="text-sm">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Redemptions Tab */}
        <TabsContent value="redemptions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="redemption-search">Buscar resgates</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="redemption-search"
                      placeholder="Nome, código ou recompensa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-redemption-search"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redemptions List */}
          {filteredRedemptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum resgate encontrado
                </h3>
                <p className="text-gray-500 text-center">
                  {searchTerm || statusFilter !== 'all' 
                    ? "Tente ajustar os filtros de busca."
                    : "Ainda não há resgates realizados."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRedemptions.map((redemption) => (
                <Card key={redemption.id} className="hover:shadow-md transition-shadow" data-testid={`redemption-card-${redemption.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="h-6 w-6 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-lg">{redemption.rewardName}</h3>
                          <p className="text-sm text-gray-600">por {redemption.userName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(redemption.status)}>
                          {getStatusLabel(redemption.status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Cliente:</p>
                        <p className="font-medium">{redemption.userName}</p>
                        <p className="text-sm text-gray-600">{redemption.userPhone}</p>
                        {redemption.userEmail && (
                          <p className="text-sm text-gray-600">{redemption.userEmail}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pontos Usados:</p>
                        <p className="text-lg font-bold text-red-600">
                          -{redemption.pointsUsed.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Código:</p>
                        <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {redemption.redemptionCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data do Resgate:</p>
                        <p className="text-sm">{formatDate(redemption.createdAt)}</p>
                      </div>
                    </div>
                    
                    {/* Status Actions */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                          {redemption.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(redemption.id, 'approved')}
                                disabled={updateStatusMutation.isPending}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                                data-testid={`approve-redemption-${redemption.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(redemption.id, 'cancelled')}
                                disabled={updateStatusMutation.isPending}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                data-testid={`cancel-redemption-${redemption.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          )}
                          {redemption.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(redemption.id, 'delivered')}
                              disabled={updateStatusMutation.isPending}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              data-testid={`deliver-redemption-${redemption.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Marcar como Entregue
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`status-${redemption.id}`} className="text-sm text-gray-600">
                            Status:
                          </Label>
                          <Select 
                            value={redemption.status} 
                            onValueChange={(newStatus) => handleStatusChange(redemption.id, newStatus)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-32" data-testid={`status-select-${redemption.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="approved">Aprovado</SelectItem>
                              <SelectItem value="delivered">Entregue</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}