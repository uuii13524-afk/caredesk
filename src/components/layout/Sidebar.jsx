import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Calendar, Users, FileText, CreditCard, 
  UserCog, Star, Package, Settings, Activity, LogOut, ChevronLeft, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";

const navItems = [
  { path: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { path: "/appointments", label: "予約管理", icon: Calendar },
  { path: "/patients", label: "患者管理", icon: Users },
  { path: "/treatment-records", label: "施術記録", icon: FileText },
  { path: "/courses", label: "コース管理", icon: Package },
  { path: "/invoices", label: "請求管理", icon: CreditCard },
  { path: "/staff", label: "スタッフ管理", icon: UserCog },
  { path: "/reviews", label: "レビュー", icon: Star },
  { path: "/settings", label: "設定", icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      <aside className={cn(
        "fixed top-0 left-0 h-full bg-sidebar text-sidebar-foreground z-50 transition-all duration-300 flex flex-col",
        collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "translate-x-0 w-64"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Activity className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              <span className="font-bold text-lg">CareDesk</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && setCollapsed(true)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => base44.auth.logout("/")}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground w-full transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>ログアウト</span>}
          </button>
        </div>
      </aside>
    </>
  );
}