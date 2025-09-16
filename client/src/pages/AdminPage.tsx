import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminRewards } from "@/components/admin/AdminRewards";
import { AdminPointsRules } from "@/components/admin/AdminPointsRules";
import { AdminTiers } from "@/components/admin/AdminTiers";
import { AdminCampaigns } from "@/components/admin/AdminCampaigns";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminLeads } from "@/components/admin/AdminLeads";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  Gift, 
  Target, 
  Trophy, 
  Megaphone, 
  LogOut,
  Menu,
  Users,
  UserCheck,
  UserPlus
} from "lucide-react";

type AdminSection = 'dashboard' | 'rewards' | 'points-rules' | 'tiers' | 'campaigns' | 'users' | 'leads' | 'referrals';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Check for stored admin session
  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setCurrentAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  const handleLogin = (admin: AdminUser, token: string) => {
    setCurrentAdmin(admin);
    localStorage.setItem('adminUser', JSON.stringify(admin));
    localStorage.setItem('adminToken', token);
    console.log('✅ Admin login successful, token stored');
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    setCurrentSection('dashboard');
  };

  const handleNavClick = (section: AdminSection) => {
    setCurrentSection(section);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rewards', label: 'Recompensas', icon: Gift },
    { id: 'points-rules', label: 'Regras de Pontos', icon: Target },
    { id: 'tiers', label: 'Tiers de Fidelidade', icon: Trophy },
    { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
    { id: 'referrals', label: 'Indicações', icon: UserPlus },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'leads', label: 'Leads', icon: UserCheck },
  ];

  const NavigationMenu = ({ onItemClick }: { onItemClick: (section: AdminSection) => void }) => (
    <nav className="mt-8 px-4 space-y-2">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentSection === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id as AdminSection)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            data-testid={`nav-${item.id}`}
          >
            <Icon className={`h-5 w-5 ${(sidebarOpen || isMobile) ? 'mr-3' : ''}`} />
            {(sidebarOpen || isMobile) && (
              <span className="font-medium">{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

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
      case 'users':
        return <AdminUsers />;
      case 'leads':
        return <AdminLeads />;
      case 'referrals':
        return <AdminReferrals />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {isMobile ? (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 mr-4"
                      data-testid="toggle-mobile-menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <div className="bg-white h-full">
                      <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold text-gray-800">Menu Admin</h2>
                      </div>
                      <NavigationMenu onItemClick={handleNavClick} />
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-white hover:bg-white/10 mr-4"
                  data-testid="toggle-sidebar"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-lg md:text-xl font-bold" data-testid="admin-header">
                <span className="hidden sm:inline">Painel Administrativo - Fidelidade</span>
                <span className="sm:hidden">Admin</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <span className="text-xs md:text-sm hidden sm:block" data-testid="admin-username">
                Olá, {currentAdmin.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-white hover:bg-white/10"
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside 
            className={`bg-white shadow-lg transition-all duration-300 ${
              sidebarOpen ? 'w-64' : 'w-16'
            }`}
            data-testid="admin-sidebar"
          >
            <NavigationMenu onItemClick={handleNavClick} />
          </aside>
        )}

        {/* Main Content */}
        <main 
          className={`flex-1 p-4 md:p-6 transition-all duration-300 overflow-x-auto`}
          data-testid="admin-main-content"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
}