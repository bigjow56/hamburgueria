import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Receipt, 
  Plus,
  Save,
  Calendar,
  Edit,
  Trash2
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import type { Order, Expense } from "@shared/schema";

interface DailyData {
  date: string;
  faturamento: number;
  despesas: number;
  lucro: number;
  clientes: number;
}

interface PeriodSelector {
  startDate: string;
  endDate: string;
  quickPeriod: string;
}

interface NewExpense {
  description: string;
  amount: string;
  category: string;
  date: string;
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [period, setPeriod] = useState<PeriodSelector>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    quickPeriod: "30"
  });
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState<NewExpense>({
    description: "",
    amount: "",
    category: "ingredientes",
    date: new Date().toISOString().split('T')[0]
  });

  // Queries
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      return await apiRequest("POST", "/api/expenses", expenseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowExpenseForm(false);
      setNewExpense({
        description: "",
        amount: "",
        category: "ingredientes",
        date: new Date().toISOString().split('T')[0]
      });
      toast({
        title: "Despesa registrada!",
        description: "Despesa foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao registrar despesa",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      return await apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setEditingExpense(null);
      toast({
        title: "Despesa atualizada!",
        description: "Despesa foi atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar despesa",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Despesa excluída!",
        description: "Despesa foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir despesa",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Generate data for the selected period
  const chartData = useMemo(() => {
    const startDate = new Date(period.startDate + 'T00:00:00');
    const endDate = new Date(period.endDate + 'T23:59:59');
    const data: DailyData[] = [];

    // Filter orders and expenses by period
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      return orderDate >= startDate && orderDate <= endDate && order.paymentStatus === 'paid';
    });


    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Create daily aggregation
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = d.toISOString().split('T')[0];
      
      const dayOrders = filteredOrders.filter(order => 
        new Date(order.createdAt!).toISOString().split('T')[0] === currentDate
      );
      
      const dayExpenses = filteredExpenses.filter(expense => 
        new Date(expense.date).toISOString().split('T')[0] === currentDate
      );

      const faturamento = dayOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const despesas = dayExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      data.push({
        date: currentDate,
        faturamento,
        despesas,
        lucro: faturamento - despesas,
        clientes: dayOrders.length
      });
    }

    return data;
  }, [orders, expenses, period]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalFaturamento = chartData.reduce((sum, day) => sum + day.faturamento, 0);
    const totalDespesas = chartData.reduce((sum, day) => sum + day.despesas, 0);
    const totalLucro = totalFaturamento - totalDespesas;
    const totalClientes = chartData.reduce((sum, day) => sum + day.clientes, 0);
    const avgClientes = chartData.length > 0 ? totalClientes / chartData.length : 0;

    return {
      faturamento: { value: totalFaturamento, change: 12.5 },
      despesas: { value: totalDespesas, change: -5.2 },
      lucro: { value: totalLucro, change: 18.7 },
      clientes: { value: avgClientes, change: 8.3 }
    };
  }, [chartData]);

  // Period selection handlers
  const handleQuickPeriod = (days: string) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    setPeriod({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      quickPeriod: days
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const handleCreateExpense = () => {
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha descrição e valor.",
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate({
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      date: newExpense.date
    });
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowExpenseForm(true);
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    
    if (!newExpense.description.trim() || !newExpense.amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha descrição e valor.",
        variant: "destructive",
      });
      return;
    }

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      data: {
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category,
        date: newExpense.date
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta despesa?")) {
      deleteExpenseMutation.mutate(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
    setShowExpenseForm(false);
    setNewExpense({
      description: "",
      amount: "",
      category: "ingredientes",
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Calculate expense breakdown by category for pie chart
  const expenseByCategory = expenses.reduce((acc, expense) => {
    const category = expense.category || 'outros';
    acc[category] = (acc[category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const pieData = [
    { name: 'Faturamento', value: kpis.faturamento.value, color: '#10b981' },
    ...Object.entries(expenseByCategory).map(([category, value], index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value,
      color: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'][index] || '#6b7280'
    }))
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-white to-slate-50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/admin")}
                  className="mr-4 p-2 hover:bg-slate-100 rounded-xl transition-all duration-200"
                  data-testid="button-back-admin"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                    📊
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard Analytics
                  </h1>
                </div>
              </div>
              <Button 
                onClick={() => setShowExpenseForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 rounded-xl px-6 py-3"
                data-testid="button-new-expense"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar Gasto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Period Selector */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-0 shadow-lg backdrop-blur-sm">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-6 text-slate-700 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Seleção de Período
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              {/* Quick periods */}
              <div className="flex gap-2 flex-wrap">
                {['7', '30', '90', '180', '365'].map((days) => (
                  <Button
                    key={days}
                    variant={period.quickPeriod === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickPeriod(days)}
                    className={`rounded-xl transition-all duration-200 font-medium ${
                      period.quickPeriod === days 
                        ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                        : 'border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700'
                    }`}
                    data-testid={`button-period-${days}`}
                  >
                    {days === '7' ? '7 dias' : 
                     days === '30' ? '30 dias' :
                     days === '90' ? '3 meses' :
                     days === '180' ? '6 meses' : '1 ano'}
                  </Button>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Data Inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={period.startDate}
                      onChange={(e) => setPeriod({...period, startDate: e.target.value, quickPeriod: ""})}
                      max="2025-12-31"
                      min="2024-01-01"
                      className="mt-1 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={period.endDate}
                      onChange={(e) => setPeriod({...period, endDate: e.target.value, quickPeriod: ""})}
                      max="2025-12-31"
                      min="2024-01-01"
                      className="mt-1 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl border border-indigo-200">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Período: {Math.ceil((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Form */}
        {showExpenseForm && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">
                {editingExpense ? 'Editar Despesa' : 'Registrar Nova Despesa'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Input
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Ex: Compra de ingredientes"
                    data-testid="input-expense-description"
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Valor *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    placeholder="0.00"
                    data-testid="input-expense-amount"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={newExpense.category}
                    onValueChange={(value) => setNewExpense({...newExpense, category: value})}
                  >
                    <SelectTrigger data-testid="select-expense-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingredientes">Ingredientes</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="aluguel">Aluguel</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="equipamentos">Equipamentos</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                    max="2025-12-31"
                    data-testid="input-expense-date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  data-testid="button-cancel-expense"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-expense"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingExpense 
                    ? (updateExpenseMutation.isPending ? 'Atualizando...' : 'Atualizar Despesa')
                    : (createExpenseMutation.isPending ? 'Salvando...' : 'Salvar Despesa')
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {/* Faturamento Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-emerald-50 to-green-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  💰
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+{kpis.faturamento.change}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Faturamento Total</p>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(kpis.faturamento.value)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Despesas Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-red-50 to-rose-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-rose-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  📤
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-semibold">{kpis.despesas.change}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Despesas Totais</p>
                <p className="text-3xl font-bold text-red-700">{formatCurrency(kpis.despesas.value)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Lucro Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  📈
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+{kpis.lucro.change}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Lucro Líquido</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(kpis.lucro.value)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Clientes Card */}
          <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-pink-500"></div>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white text-lg shadow-lg">
                  👥
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-semibold">+{kpis.clientes.change}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Clientes Médios/Dia</p>
                <p className="text-3xl font-bold text-purple-700">{kpis.clientes.value.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Area Chart - Faturamento */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-emerald-50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white">
                  📊
                </div>
                Evolução do Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="faturamento" 
                    stroke="#059669" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorFaturamento)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Faturamento vs Despesas */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white">
                  ⚖️
                </div>
                Faturamento vs Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'faturamento' ? 'Faturamento' : 'Despesas']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="faturamento" fill="#059669" name="Faturamento" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" fill="#dc2626" name="Despesas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

        {/* Bottom Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Line Chart - Lucro */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-indigo-50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  📈
                </div>
                Tendência de Lucro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number) => [formatCurrency(value), 'Lucro']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="lucro"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#colorLucro)"
                    fillOpacity={0.3}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#6366f1', stroke: 'white', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribuição */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-purple-50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white">
                  🎯
                </div>
                Distribuição Financeira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="white"
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>


        {/* Recent Expenses */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center text-white">
                📋
              </div>
              Despesas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenses.slice(0, 10).map((expense, index) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Receipt className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{expense.description}</p>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-xs font-medium">{expense.category}</span>
                        • {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-red-600 text-lg">{formatCurrency(parseFloat(expense.amount))}</p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditExpense(expense)}
                        className="h-8 w-8 p-0 border-slate-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        data-testid={`button-edit-expense-${expense.id}`}
                      >
                        <Edit className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deleteExpenseMutation.isPending}
                        className="h-8 w-8 p-0 border-slate-300 hover:border-red-400 hover:bg-red-50 rounded-lg transition-all duration-200"
                        data-testid={`button-delete-expense-${expense.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-medium text-lg">Nenhuma despesa registrada ainda.</p>
                  <p className="text-slate-400 text-sm mt-2">Clique em "Registrar Gasto" para adicionar uma despesa</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}