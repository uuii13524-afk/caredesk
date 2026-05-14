import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        "lg:ml-16"
      )}>
        {/* Top bar for mobile */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b h-14 flex items-center px-4 lg:px-6 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setCollapsed(false)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
        </header>

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}