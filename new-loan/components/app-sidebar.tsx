"use client";

import { cn } from "@/lib/utils";
import {
  FileText,
  BarChart3,
  Shield,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

interface AppSidebarProps {
  activeTab: "list" | "detail";
  onTabChange: (tab: "list" | "detail") => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  { icon: FileText, label: "Loan List", tab: "list" as const },
  { icon: BarChart3, label: "Loan Detail", tab: "detail" as const },
];

export function AppSidebar({ activeTab, onTabChange, isCollapsed = false, onToggleCollapse }: AppSidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        isCollapsed ? "justify-center px-2" : "gap-3 px-6"
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Loan Surveillance</h1>
            <p className="text-xs text-sidebar-foreground/60">Multifamily</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 py-4", isCollapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.tab && onTabChange(item.tab)}
            disabled={item.disabled}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
              isCollapsed ? "justify-center px-2" : "gap-3 px-3",
              item.tab === activeTab
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              item.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
            {!isCollapsed && item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className={cn("border-t border-sidebar-border", isCollapsed ? "p-2" : "p-3")}>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex w-full items-center rounded-lg py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              isCollapsed ? "justify-center px-2" : "gap-2 px-3"
            )}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* User Section */}
      <div className={cn("border-t border-sidebar-border", isCollapsed ? "p-2" : "p-3")}>
        <div className={cn(
          "flex items-center rounded-lg py-2",
          isCollapsed ? "justify-center px-2" : "gap-3 px-3"
        )}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            RM
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">Risk Manager</p>
              <p className="text-xs text-sidebar-foreground/60">Loan Auditing</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <div className="mt-2 flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
              <HelpCircle className="h-4 w-4" />
              Help
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
