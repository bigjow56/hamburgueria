import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Gift, 
  Users, 
  Target, 
  Trophy, 
  Megaphone, 
  TrendingUp,
  CheckCircle,
  Activity 
} from "lucide-react";

interface DashboardStats {
  totalRewards: number;
  activeRewards: number;
  totalRedemptions: number;
  totalUsers: number;
  totalPointsDistributed: number;
  activePointsRules: number;
  activeCampaigns: number;
}

export function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard/stats'],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar estatísticas do dashboard</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total de Recompensas",
      value: stats?.totalRewards || 0,
      description: "Recompensas cadastradas",
      icon: Gift,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Recompensas Ativas", 
      value: stats?.activeRewards || 0,
      description: "Disponíveis para resgate",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total de Resgates",
      value: stats?.totalRedemptions || 0,
      description: "Recompensas resgatadas",
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Usuários Cadastrados",
      value: stats?.totalUsers || 0,
      description: "Membros do programa",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pontos Distribuídos",
      value: stats?.totalPointsDistributed || 0,
      description: "Total de pontos dados",
      icon: TrendingUp,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      title: "Regras Ativas",
      value: stats?.activePointsRules || 0,
      description: "Regras de pontuação",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Campanhas Ativas",
      value: stats?.activeCampaigns || 0,
      description: "Campanhas em andamento",
      icon: Megaphone,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Taxa de Atividade",
      value: Math.round(((stats?.activeRewards || 0) / Math.max(stats?.totalRewards || 1, 1)) * 100),
      description: "% recompensas ativas",
      icon: Activity,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      suffix: "%"
    },
  ];

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
            Dashboard Administrativo
          </h2>
          <p className="text-gray-600" data-testid="dashboard-description">
            Visão geral do programa de fidelidade
          </p>
        </div>
        <Badge variant="secondary" className="text-green-700 bg-green-100" data-testid="status-badge">
          Sistema Online
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow" data-testid={`stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900" data-testid={`stat-value-${index}`}>
                  {stat.value.toLocaleString('pt-BR')}{stat.suffix || ''}
                </div>
                <p className="text-xs text-gray-500" data-testid={`stat-description-${index}`}>
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card data-testid="quick-actions">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Gift className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-medium">Nova Recompensa</h3>
              <p className="text-sm text-gray-600">Cadastrar nova recompensa</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Target className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-medium">Regra de Pontos</h3>
              <p className="text-sm text-gray-600">Configurar pontuação</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Trophy className="h-8 w-8 text-yellow-600 mb-2" />
              <h3 className="font-medium">Novo Tier</h3>
              <p className="text-sm text-gray-600">Criar tier de fidelidade</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Megaphone className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-medium">Nova Campanha</h3>
              <p className="text-sm text-gray-600">Lançar campanha especial</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}