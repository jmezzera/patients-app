"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu, X,
  LayoutDashboard, Users, CalendarDays, BarChart3, Clock, Activity,
  Leaf, User, Ruler, TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import type { Route } from "next";
import { LocaleSwitcher } from "@/components/locale-switcher";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Users, CalendarDays, BarChart3, Clock, Activity,
  Leaf, User, Ruler, TrendingUp,
};

export type NavItem = {
  href: string;
  icon: string;
  label: string;
  isExternal?: boolean;
};

function SidebarLink({
  href,
  icon,
  label,
  isExternal,
  active,
  onClick,
}: NavItem & { active: boolean; onClick?: () => void }) {
  const Icon = ICONS[icon] ?? LayoutDashboard;
  const cls = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-white/15 text-white font-medium"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

  if (isExternal) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        {label}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={cls} onClick={onClick}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {items.map((item) => (
        <SidebarLink
          key={item.href}
          {...item}
          active={pathname === item.href || pathname.startsWith(item.href + "/")}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
      <UserButton />
      <LocaleSwitcher />
    </div>
  );
}

export function Sidebar({ navItems }: { navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);

  // Close drawer on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-primary">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Link href="/dashboard" className="text-base font-bold tracking-tight text-white">
            Jami
          </Link>
        </div>
        <NavLinks items={navItems} />
        <Footer />
      </aside>

      {/* Mobile top bar — hidden on desktop */}
      <header className="md:hidden flex h-14 flex-shrink-0 items-center justify-between bg-primary px-4">
        <Link href="/dashboard" className="text-base font-bold text-white">
          Jami
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-primary shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
              <span className="text-base font-bold text-white">Jami</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks items={navItems} onNavigate={() => setOpen(false)} />
            <Footer />
          </aside>
        </div>
      )}
    </>
  );
}
