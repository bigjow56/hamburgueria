import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Checkout from "@/pages/checkout";
import { OrderReview } from "@/pages/order-review";
import Admin from "@/pages/admin";
import AdminPage from "@/pages/AdminPage";
import AdminLogin from "@/pages/admin-login";
import Analytics from "@/pages/analytics";
import LoyaltyPage from "@/pages/LoyaltyPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/order-review" component={OrderReview} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/fidelidade" component={LoyaltyPage} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/fidelidade" component={AdminPage} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
