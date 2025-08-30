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
  Calendar
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

  // Generate data for the selected period
  const chartData = useMemo(() => {
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const data: DailyData[] = [];

    // Filter orders and expenses by period
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt!);
      return orderDate >= startDate && orderDate <= endDate && order.paymentStatus === 'completed';
    });

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Create daily aggregation
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDate = d.toISOString().split('T')[0];
      
      const dayOrders = filteredOrders.filter(order => 
        order.createdAt!.split('T')[0] === currentDate
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
      date: new Date(newExpense.date).toISOString()
    });
  };

  const pieData = [
    { name: 'Faturamento', value: kpis.faturamento.value, color: '#10b981' },
    { name: 'Despesas', value: kpis.despesas.value, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center mb-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/admin")}
                  className="mr-4 p-2"
                  data-testid="button-back-admin"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Analytics</h1>
              </div>
              <Button 
                onClick={() => setShowExpenseForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-new-expense"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar Gasto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Period Selector */}
        <Card className="mb-6 bg-blue-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Seleção de Período</h2>
            <div className="flex flex-wrap items-center gap-4">
              {/* Quick periods */}
              <div className="flex gap-2">
                {['7', '30', '90', '180', '365'].map((days) => (
                  <Button
                    key={days}
                    variant={period.quickPeriod === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickPeriod(days)}
                    data-testid={`button-period-${days}`}
                  >
                    {days === '7' ? '7 dias' : 
                     days === '30' ? '30 dias' :
                     days === '90' ? '3 meses' :
                     days === '180' ? '6 meses' : '1 ano'}
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <div>
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={period.startDate}
                    onChange={(e) => setPeriod({...period, startDate: e.target.value, quickPeriod: ""})}
                    max="2024-12-31"
                    min="2024-01-01"
                    data-testid="input-start-date"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={period.endDate}
                    onChange={(e) => setPeriod({...period, endDate: e.target.value, quickPeriod: ""})}
                    max="2024-12-31"
                    min="2024-01-01"
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  Período: {Math.ceil((new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} dias
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faturamento Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(kpis.faturamento.value)}</p>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{kpis.faturamento.change}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Despesas Totais</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(kpis.despesas.value)}</p>
                </div>
                <div className="flex items-center">
                  <Receipt className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">{kpis.despesas.change}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lucro Líquido</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(kpis.lucro.value)}</p>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{kpis.lucro.change}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clientes Médios/Dia</p>
                  <p className="text-2xl font-bold text-purple-600">{kpis.clientes.value.toFixed(1)}</p>
                </div>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{kpis.clientes.change}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Area Chart - Faturamento */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Faturamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="faturamento" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorFaturamento)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Faturamento vs Despesas */}
          <Card>
            <CardHeader>
              <CardTitle>Faturamento vs Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'faturamento' ? 'Faturamento' : 'Despesas']}
                  />
                  <Legend />
                  <Bar dataKey="faturamento" fill="#10b981" name="Faturamento" />
                  <Bar dataKey="despesas" fill="#ef4444" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Lucro */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    labelFormatter={(label) => `Data: ${formatDate(label)}`}
                    formatter={(value: number) => [formatCurrency(value), 'Lucro']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lucro" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Distribuição */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Expense Form */}
        {showExpenseForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Registrar Nova Despesa</CardTitle>
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
                    max="2024-12-31"
                    data-testid="input-expense-date"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowExpenseForm(false)}
                  data-testid="button-cancel-expense"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateExpense}
                  disabled={createExpenseMutation.isPending}
                  data-testid="button-save-expense"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createExpenseMutation.isPending ? 'Salvando...' : 'Salvar Despesa'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenses.slice(0, 10).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-gray-600">
                      {expense.category} • {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(parseFloat(expense.amount))}</p>
                  </div>
                </div>
              ))}
              {expenses.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhuma despesa registrada ainda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}