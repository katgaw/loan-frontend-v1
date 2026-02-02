"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { LoanListPage } from "@/components/loan-list-page";
import { LoanDetailPage } from "@/components/loan-detail-page";
import { RedFlagReviewPage } from "@/components/red-flag-review-page";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Search, User } from "lucide-react";
import { Suspense } from "react";
import Loading from "./loading";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"list" | "detail" | "redFlagReview">("list");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Main Content */}
      <div className={sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"} style={{ transition: "margin-left 300ms" }}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                5
              </span>
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Suspense fallback={<Loading />}>
            {activeTab === "list" && <LoanListPage onNavigateToDetail={() => setActiveTab("detail")} />}
            {activeTab === "detail" && <LoanDetailPage onNavigateToRedFlagReview={() => setActiveTab("redFlagReview")} />}
            {activeTab === "redFlagReview" && <RedFlagReviewPage onBack={() => setActiveTab("detail")} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
