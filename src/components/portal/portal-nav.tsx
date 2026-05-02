"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocationScanner } from "@/components/location-scanner";

interface NavItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  action?: () => void;
}

interface PortalNavProps {
  role: "student" | "staff";
  name: string;
  email: string;
  onLogout: () => void;
  pendingCount?: number;
}

export function PortalNav({
  role,
  name,
  email,
  onLogout,
  pendingCount = 0,
}: PortalNavProps) {
  const pathname = usePathname();
  const [isLocationScannerOpen, setIsLocationScannerOpen] = useState(false);

  const studentLinks: NavItem[] = [
    {
      href: "/student/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/student/ragging",
      label: "Report Ragging",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      href: "/student/projects",
      label: "Submit Project",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      href: "/student/doubts",
      label: "Doubts / Q&A",
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      label: "Campus Locator",
      icon: <MapPin className="h-4 w-4" />,
      action: () => setIsLocationScannerOpen(true),
    },
  ];

  const staffLinks: NavItem[] = [
    {
      href: "/staff/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: pendingCount,
    },
    {
      href: "/staff/ragging",
      label: "Ragging Reports",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      href: "/staff/projects",
      label: "Project Approvals",
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      href: "/staff/clubs",
      label: "Manage Clubs",
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/staff/announcements",
      label: "Announcements",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      href: "/staff/doubts",
      label: "Doubts / Q&A",
      icon: <MessageSquare className="h-4 w-4" />,
    },
  ];

  const links = role === "staff" ? staffLinks : studentLinks;

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Brand */}
      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          {role === "staff" ? (
            <Shield className="h-5 w-5 text-red-600" />
          ) : (
            <Settings className="h-5 w-5 text-red-600" />
          )}
          <span className="font-bold text-red-700 dark:text-red-400">
            {role === "staff" ? "Staff Portal" : "Student Portal"}
          </span>
        </div>
        <p className="text-xs text-zinc-500 truncate">CU-UP</p>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
              {name}
            </p>
            <p className="text-xs text-zinc-500 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          if (link.href) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                {link.icon}
                <span>{link.label}</span>
                {link.badge != null && link.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto text-xs px-1.5 py-0.5 min-w-[1.25rem] justify-center"
                  >
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          }

          return (
            <button
              key={link.label}
              onClick={link.action}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {link.icon}
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Back to site + Logout */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          ← Back to main site
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Location Scanner Modal */}
      {role === "student" && (
        <LocationScanner
          isOpen={isLocationScannerOpen}
          onOpenChange={setIsLocationScannerOpen}
        />
      )}
    </aside>
  );
}
