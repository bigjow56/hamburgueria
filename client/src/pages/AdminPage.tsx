import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminRewards } from "@/components/admin/AdminRewards";
import { AdminPointsRules } from "@/components/admin/AdminPointsRules";
import { AdminTiers } from "@/components/admin/AdminTiers";
import { AdminCampaigns } from "@/components/admin/AdminCampaigns";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Gift, 
  Target, 
  Trophy, 
  Megaphone, 
  LogOut,
  Menu 
} from "lucide-react";

type AdminSection = 'dashboard' | 'rewards' | 'points-rules' | 'tiers' | 'campaigns';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

export default function AdminPage() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [currentSection, setCurrentSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check for stored admin session
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setCurrentAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const handleLogin = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    localStorage.setItem('adminUser', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('adminUser');
    setCurrentSection('dashboard');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'points-rules', label: 'Regras de Pontos', icon: Target },
    { id: 'tiers', label: 'Tiers de Fidelidade', icon: Trophy },
    { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
  ];

  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AdminLogin onLogin={handleLogin} />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'rewards':
        return <AdminRewards />;
      case 'points-rules':
        return <AdminPointsRules />;
      case 'tiers':
        return <AdminTiers />;
      case 'campaigns':
        return <AdminCampaigns />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:bg-white/10 mr-4"
                data-testid="toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold" data-testid="admin-header">
                Painel Administrativo - Fidelidade
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm" data-testid="admin-username">
                Olá, {currentAdmin.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/10"
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`bg-white shadow-lg transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
          data-testid="admin-sidebar"
        >
          <nav className="mt-8 px-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id as AdminSection)}
                  className={`w-full flex items-center px-4 py-3 mt-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  data-testid={`nav-${item.id}`}
                >
                  <Icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main 
          className={`flex-1 p-6 transition-all duration-300 ${
            sidebarOpen ? 'ml-0' : 'ml-0'
          }`}
          data-testid="admin-main-content"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
}