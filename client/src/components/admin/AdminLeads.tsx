import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  DollarSign,
  Filter,
  Download,
  Send,
  Target
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  totalSpent: string;
  totalOrders: number;
  lastPurchaseDate?: string;
  customerStatus: string;
  loyaltyTier: string;
  pointsBalance: number;
  createdAt: string;
  lastContactDate?: string;
  daysSinceLastPurchase?: number;
}

interface LeadsStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  dormantCustomers: number;
  averageOrderValue: number;
  totalRevenue: number;
}

export function AdminLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [inactivityFilter, setInactivityFilter] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: leads, isLoading: loadingLeads } = useQuery<Lead[]>({
    queryKey: ['/api/admin/leads'],
  });

  const { data: stats, isLoading: loadingStats } = useQuery<LeadsStats>({
    queryKey: ['/api/admin/leads/stats'],
  });

  // Mutation para atualizar status do cliente
  const updateStatusMutation = useMutation({
    mutationFn: ({ customerId, status }: { customerId: string; status: string }) => 
      apiRequest(`/api/admin/leads/${customerId}/status`, { 
        method: 'PUT', 
        body: { status } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads/stats'] });
      toast({
        title: "Status atualizado!",
        description: "O status do cliente foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar status do cliente",
        variant: "destructive",
      });
    },
  });

  // Mutation para registrar contato
  const contactMutation = useMutation({
    mutationFn: (customerId: string) => 
      apiRequest(`/api/admin/leads/${customerId}/contact`, { 
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/leads'] });
      toast({
        title: "Contato registrado!",
        description: "Data do último contato foi atualizada.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar contato",
        variant: "destructive",
      });
    },
  });

  // Filtrar leads
  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone.includes(searchTerm) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.customerStatus === statusFilter;
    const matchesTier = tierFilter === 'all' || lead.loyaltyTier === tierFilter;
    
    // Filtro de inatividade
    let matchesInactivity = true;
    if (inactivityFilter !== 'all' && lead.daysSinceLastPurchase !== undefined) {
      switch (inactivityFilter) {
        case '30':
          matchesInactivity = lead.daysSinceLastPurchase >= 30;
          break;
        case '60':
          matchesInactivity = lead.daysSinceLastPurchase >= 60;
          break;
        case '90':
          matchesInactivity = lead.daysSinceLastPurchase >= 90;
          break;
        case '180':
          matchesInactivity = lead.daysSinceLastPurchase >= 180;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesTier && matchesInactivity;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'dormant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'dormant':
        return 'Dormente';
      default:
        return 'N/A';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-orange-100 text-orange-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysSince = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
    return `${days} dias`;
  };

  if (loadingLeads || loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Clientes",
      value: stats?.totalCustomers || 0,
      description: "Clientes cadastrados",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Clientes Ativos",
      value: stats?.activeCustomers || 0,
      description: "Compraram recentemente",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Clientes Inativos",
      value: stats?.inactiveCustomers || 0,
      description: "30+ dias sem comprar",
      icon: UserX,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Clientes Dormentes",
      value: stats?.dormantCustomers || 0,
      description: "90+ dias sem comprar",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(stats?.averageOrderValue || 0),
      description: "Valor médio por pedido",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      isNumeric: false,
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats?.totalRevenue || 0),
      description: "Receita acumulada",
      icon: Target,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      isNumeric: false,
    },
  ];

  return (
    <div className="space-y-6" data-testid="admin-leads">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow" data-testid={`leads-stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900" data-testid={`leads-stat-value-${index}`}>
                  {stat.isNumeric === false ? stat.value : typeof stat.value === 'number' ? stat.value.toLocaleString('pt-BR') : stat.value}
                </div>
                <p className="text-xs text-gray-500" data-testid={`leads-stat-description-${index}`}>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Leads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-leads"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="filter-status">
                <SelectValue placeholder="Status do Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="dormant">Dormente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger data-testid="filter-tier">
                <SelectValue placeholder="Tier de Fidelidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tiers</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Prata</SelectItem>
                <SelectItem value="gold">Ouro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={inactivityFilter} onValueChange={setInactivityFilter}>
              <SelectTrigger data-testid="filter-inactivity">
                <SelectValue placeholder="Tempo de Inatividade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer Período</SelectItem>
                <SelectItem value="30">30+ dias sem comprar</SelectItem>
                <SelectItem value="60">60+ dias sem comprar</SelectItem>
                <SelectItem value="90">90+ dias sem comprar</SelectItem>
                <SelectItem value="180">180+ dias sem comprar</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="w-full"
              data-testid="export-leads"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads - {filteredLeads.length} clientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Última Compra</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} data-testid={`lead-row-${lead.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">
                          Cliente desde {formatDate(lead.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.customerStatus)} data-testid={`lead-status-${lead.id}`}>
                        {getStatusLabel(lead.customerStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(lead.loyaltyTier)}>
                        {lead.loyaltyTier.charAt(0).toUpperCase() + lead.loyaltyTier.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{formatDate(lead.lastPurchaseDate)}</div>
                        {lead.daysSinceLastPurchase !== undefined && (
                          <div className="text-xs text-gray-500">
                            há {lead.daysSinceLastPurchase} dias
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(lead.totalSpent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {lead.totalOrders}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {lead.pointsBalance} pts
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Select
                          value={lead.customerStatus}
                          onValueChange={(status) => updateStatusMutation.mutate({ 
                            customerId: lead.id, 
                            status 
                          })}
                        >
                          <SelectTrigger className="w-20 h-8 text-xs" data-testid={`status-select-${lead.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="dormant">Dormente</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => contactMutation.mutate(lead.id)}
                          disabled={contactMutation.isPending}
                          data-testid={`contact-button-${lead.id}`}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                      Nenhum lead encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}