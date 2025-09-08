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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Users, Gift, TrendingUp, Search, Filter, CheckCircle, XCircle, AlertTriangle, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReferralTransaction {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: string;
  pointsAwarded: number;
  orderValue?: number;
  validatedAt?: string;
  expiresAt?: string;
  createdAt: string;
  referrerName?: string;
  referredName?: string;
  referrerEmail?: string;
  referredEmail?: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  expiredReferrals: number;
  totalPointsAwarded: number;
  averageOrderValue: number;
  topReferrers: Array<{
    userId: string;
    name: string;
    referralCount: number;
    pointsEarned: number;
  }>;
}

export function AdminReferrals() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<ReferralTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch referral statistics
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/admin/referrals/stats"],
  });

  // Fetch referral transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<ReferralTransaction[]>({
    queryKey: ["/api/admin/referrals/transactions"],
  });

  // Mutation to approve/reject referral
  const updateReferralMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/referrals/${id}/status`, {
        method: "PUT",
        body: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      toast({
        title: "Sucesso",
        description: "Status da indicação atualizado com sucesso!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status da indicação",
        variant: "destructive"
      });
    }
  });

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = !searchTerm || 
      transaction.referralCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referrerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referredName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const handleViewDetails = (transaction: ReferralTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateReferralMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="referrals-title">
            Sistema de Indicações
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie códigos de indicação, monitore transações e analise o desempenho
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="transactions" data-testid="tab-transactions">
            <UserPlus className="w-4 h-4 mr-2" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Análises
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Indicações</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalReferrals || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Indicações Ativas</p>
                      <p className="text-2xl font-bold text-green-600">{stats?.activeReferrals || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats?.pendingReferrals || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pontos Concedidos</p>
                      <p className="text-2xl font-bold text-purple-600">{stats?.totalPointsAwarded || 0}</p>
                    </div>
                    <Gift className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Referrers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Indicadores</CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.topReferrers?.slice(0, 5).map((referrer, index) => (
                    <div key={referrer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{referrer.name}</p>
                          <p className="text-sm text-gray-600">{referrer.referralCount} indicações</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">{referrer.pointsEarned} pts</p>
                      </div>
                    </div>
                  )) || []}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Buscar por código, nome do indicador ou indicado..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-referrals"
                    />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="status-filter">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle>Transações de Indicação</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Não há transações de indicação que correspondam aos filtros.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{transaction.referralCode}</p>
                            <p className="text-sm text-gray-600">
                              {transaction.referrerName} → {transaction.referredName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">{transaction.pointsAwarded} pts</p>
                          {transaction.orderValue && (
                            <p className="text-sm text-gray-600">
                              R$ {transaction.orderValue.toFixed(2)}
                            </p>
                          )}
                        </div>
                        
                        {getStatusBadge(transaction.status)}
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                            data-testid={`view-details-${transaction.id}`}
                          >
                            Detalhes
                          </Button>
                          
                          {transaction.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(transaction.id, "active")}
                                disabled={updateReferralMutation.isPending}
                                data-testid={`approve-${transaction.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(transaction.id, "expired")}
                                disabled={updateReferralMutation.isPending}
                                data-testid={`reject-${transaction.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análises Detalhadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Análises em Desenvolvimento</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Gráficos e relatórios detalhados serão implementados em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Indicação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transação de indicação
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código de Indicação</Label>
                  <p className="text-lg font-mono">{selectedTransaction.referralCode}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Indicador</Label>
                  <p>{selectedTransaction.referrerName}</p>
                  {selectedTransaction.referrerEmail && (
                    <p className="text-sm text-gray-600">{selectedTransaction.referrerEmail}</p>
                  )}
                </div>
                <div>
                  <Label>Indicado</Label>
                  <p>{selectedTransaction.referredName}</p>
                  {selectedTransaction.referredEmail && (
                    <p className="text-sm text-gray-600">{selectedTransaction.referredEmail}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pontos Concedidos</Label>
                  <p className="text-lg font-semibold text-purple-600">{selectedTransaction.pointsAwarded}</p>
                </div>
                <div>
                  <Label>Valor do Pedido</Label>
                  <p className="text-lg">
                    {selectedTransaction.orderValue ? `R$ ${selectedTransaction.orderValue.toFixed(2)}` : "N/A"}
                  </p>
                </div>
                <div>
                  <Label>Data de Criação</Label>
                  <p>{new Date(selectedTransaction.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              {selectedTransaction.validatedAt && (
                <div>
                  <Label>Validado em</Label>
                  <p>{new Date(selectedTransaction.validatedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              
              {selectedTransaction.expiresAt && (
                <div>
                  <Label>Expira em</Label>
                  <p>{new Date(selectedTransaction.expiresAt).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}