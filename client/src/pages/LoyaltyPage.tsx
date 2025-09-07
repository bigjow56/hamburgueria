import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Star, Gift, Trophy, Crown, Award, Phone, UserPlus, LogIn } from "lucide-react";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  pointsBalance: number;
  totalPointsEarned: number;
  loyaltyTier: string;
}

interface LoyaltyTransaction {
  id: string;
  pointsChange: number;
  transactionType: string;
  description: string;
  orderAmount?: number;
  createdAt: string;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  isActive: boolean;
}

interface LoyaltyRedemption {
  id: string;
  rewardName: string;
  pointsCost: number;
  status: string;
  createdAt: string;
}

interface LoyaltyData {
  user: User;
  transactions: LoyaltyTransaction[];
  availableRewards: LoyaltyReward[];
  redemptions: LoyaltyRedemption[];
}

const tierIcons = {
  bronze: Star,
  silver: Award,
  gold: Trophy,
  platinum: Crown,
};

const tierColors = {
  bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  silver: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  platinum: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function LoyaltyPage() {
  const [phone, setPhone] = useState("");
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: ""
  });

  const fetchLoyaltyData = async () => {
    if (!phone.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu telefone.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/loyalty/${encodeURIComponent(phone)}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Usuário não encontrado",
            description: "Não encontramos sua conta. Que tal se cadastrar no programa de fidelidade?",
            variant: "destructive",
          });
        } else {
          throw new Error("Erro no servidor");
        }
        return;
      }
      const data = await response.json();
      setLoyaltyData(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao buscar dados de fidelidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async () => {
    if (!registerForm.name.trim() || !registerForm.phone.trim() || !registerForm.email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await fetch("/api/loyalty/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error === "USER_EXISTS") {
          toast({
            title: "Usuário já existe",
            description: "Já existe uma conta com este telefone. Use a aba 'Consultar' para acessar seus pontos.",
            variant: "destructive",
          });
        } else {
          throw new Error(result.message || "Erro ao cadastrar usuário");
        }
        return;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: result.message || "Você foi cadastrado no programa de fidelidade!",
      });

      // Clear form and show user data
      setRegisterForm({ name: "", phone: "", email: "", address: "" });
      setPhone(registerForm.phone);
      fetchLoyaltyData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao cadastrar usuário",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const redeemReward = async (rewardId: string) => {
    if (!loyaltyData) return;

    try {
      const response = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loyaltyData.user.id,
          rewardId: rewardId,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao resgatar recompensa");
      }

      const result = await response.json();
      toast({
        title: "Recompensa resgatada!",
        description: `Você resgatou: ${result.reward.name}`,
      });
      
      // Refresh data
      fetchLoyaltyData();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao resgatar recompensa",
        variant: "destructive",
      });
    }
  };

  const getTierIcon = (tier: string) => {
    const IconComponent = tierIcons[tier as keyof typeof tierIcons] || Star;
    return <IconComponent className="w-5 h-5" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          🎉 Programa de Fidelidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Ganhe pontos a cada compra e troque por recompensas incríveis! 
          1 real = 1 ponto, e novos clientes ganham 100 pontos de bônus!
        </p>
      </div>

      {/* Login/Register Tabs */}
      <Card className="mb-6" data-testid="loyalty-access-card">
        <CardHeader>
          <CardTitle className="text-center">Acesse seu Programa de Fidelidade</CardTitle>
          <CardDescription className="text-center">
            Consulte seus pontos ou cadastre-se para começar a ganhar recompensas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="flex items-center gap-2" data-testid="tab-login">
                <LogIn className="w-4 h-4" />
                Consultar
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2" data-testid="tab-register">
                <UserPlus className="w-4 h-4" />
                Cadastrar
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="loginPhone" className="text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    id="loginPhone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-login-phone"
                  />
                </div>
                <Button 
                  onClick={fetchLoyaltyData} 
                  disabled={loading}
                  className="w-full"
                  data-testid="button-login"
                >
                  {loading ? "Consultando..." : "Consultar Pontos"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="registerName" className="text-sm font-medium">
                      Nome Completo *
                    </label>
                    <Input
                      id="registerName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                      data-testid="input-register-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="registerPhone" className="text-sm font-medium">
                      Telefone *
                    </label>
                    <Input
                      id="registerPhone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-register-phone"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="registerEmail" className="text-sm font-medium">
                    Email *
                  </label>
                  <Input
                    id="registerEmail"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    data-testid="input-register-email"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="registerAddress" className="text-sm font-medium">
                    Endereço (Opcional)
                  </label>
                  <Input
                    id="registerAddress"
                    type="text"
                    placeholder="Rua, número, bairro"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, address: e.target.value }))}
                    data-testid="input-register-address"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    🎉 <strong>Bônus de Boas-vindas:</strong> Ganhe 100 pontos ao se cadastrar!
                  </p>
                </div>
                
                <Button 
                  onClick={registerUser} 
                  disabled={registerLoading}
                  className="w-full"
                  data-testid="button-register"
                >
                  {registerLoading ? "Cadastrando..." : "Cadastrar e Ganhar Pontos"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {loyaltyData && (
        <>
          {/* User Info */}
          <Card className="mb-6" data-testid="user-info-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Olá, {loyaltyData.user.name}! 👋</span>
                <Badge 
                  className={tierColors[loyaltyData.user.loyaltyTier as keyof typeof tierColors]}
                  data-testid={`tier-${loyaltyData.user.loyaltyTier}`}
                >
                  {getTierIcon(loyaltyData.user.loyaltyTier)}
                  {loyaltyData.user.loyaltyTier.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="points-balance">
                    {loyaltyData.user.pointsBalance}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Pontos Disponíveis
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="total-points">
                    {loyaltyData.user.totalPointsEarned}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Total de Pontos
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="tier-display">
                    {loyaltyData.user.loyaltyTier.toUpperCase()}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    Seu Nível
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Rewards */}
          <Card className="mb-6" data-testid="rewards-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Recompensas Disponíveis
              </CardTitle>
              <CardDescription>
                Troque seus pontos por essas recompensas incríveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loyaltyData.availableRewards.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma recompensa disponível no momento.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {loyaltyData.availableRewards.map((reward) => (
                    <div 
                      key={reward.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`reward-${reward.id}`}
                    >
                      <h4 className="font-semibold mb-2">{reward.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {reward.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" data-testid={`reward-cost-${reward.id}`}>
                          {reward.pointsCost} pontos
                        </Badge>
                        <Button
                          size="sm"
                          disabled={loyaltyData.user.pointsBalance < reward.pointsCost}
                          onClick={() => redeemReward(reward.id)}
                          data-testid={`button-redeem-${reward.id}`}
                        >
                          {loyaltyData.user.pointsBalance < reward.pointsCost 
                            ? "Pontos Insuficientes" 
                            : "Resgatar"
                          }
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="mb-6" data-testid="transactions-card">
            <CardHeader>
              <CardTitle>Histórico de Pontos</CardTitle>
              <CardDescription>
                Veja como você ganhou seus pontos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loyaltyData.transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma transação encontrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {loyaltyData.transactions.map((transaction, index) => (
                    <div key={transaction.id} data-testid={`transaction-${index}`}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(transaction.createdAt)}
                            {transaction.orderAmount && (
                              <span> • Pedido: R$ {transaction.orderAmount.toFixed(2)}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span 
                            className={`font-semibold ${
                              transaction.pointsChange > 0 
                                ? "text-green-600 dark:text-green-400" 
                                : "text-red-600 dark:text-red-400"
                            }`}
                            data-testid={`transaction-points-${index}`}
                          >
                            {transaction.pointsChange > 0 ? "+" : ""}
                            {transaction.pointsChange}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.transactionType}
                          </p>
                        </div>
                      </div>
                      {index < loyaltyData.transactions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redemption History */}
          {loyaltyData.redemptions.length > 0 && (
            <Card data-testid="redemptions-card">
              <CardHeader>
                <CardTitle>Histórico de Resgates</CardTitle>
                <CardDescription>
                  Suas recompensas resgatadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loyaltyData.redemptions.map((redemption, index) => (
                    <div key={redemption.id} data-testid={`redemption-${index}`}>
                      <div className="flex items-center justify-between py-3">
                        <div className="flex-1">
                          <p className="font-medium">{redemption.rewardName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(redemption.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={redemption.status === 'redeemed' ? 'default' : 'secondary'}
                            data-testid={`redemption-status-${index}`}
                          >
                            {redemption.status === 'redeemed' ? 'Resgatado' : redemption.status}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            -{redemption.pointsCost} pontos
                          </p>
                        </div>
                      </div>
                      {index < loyaltyData.redemptions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}