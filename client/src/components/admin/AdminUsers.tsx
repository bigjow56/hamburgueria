import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Users, UserCheck, Gift, Search, Filter, Trophy, Medal, Award, Crown, CheckCircle, XCircle } from "lucide-react";
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

export function AdminUsers() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const queryClient = useQueryClient();

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: redemptions, isLoading: loadingRedemptions } = useQuery<Redemption[]>({
    queryKey: ['/api/admin/redemptions'],
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