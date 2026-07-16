'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Building2,
  BarChart3,
  BookOpen,
  LogOut,
  Sheet,
  IndianRupee,
} from 'lucide-react';
import { logout } from '@/app/login/actions';

import ProfileDropdown from './ProfileDropdown';

interface SidebarProps {
  role: 'admin' | 'company';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'J-Coin Sheet', href: '/admin/sheet', icon: Sheet },
    { name: 'Rentals', href: '/admin/rentals', icon: IndianRupee },
    { name: 'Activities', href: '/admin/activities', icon: BookOpen },
    { name: 'Companies', href: '/admin/companies', icon: Building2 },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ];

  const companyLinks = [
    { name: 'Dashboard', href: '/company', icon: LayoutDashboard },
    { name: 'My MoU', href: '/company/mou', icon: FileText },
    { name: 'Compliance', href: '/company/compliance', icon: BookOpen },
  ];

  const links = role === 'admin' ? adminLinks : companyLinks;

  return (
    <div className="flex flex-col w-64 h-screen bg-slate-900 text-white shadow-xl relative z-20">
      <div className="flex items-center justify-between h-20 px-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-lg shrink-0">
            J
          </div>
          <h1 className="text-xl font-bold tracking-wider">J-COINS</h1>
        </div>
        <ProfileDropdown />
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
          {role === 'admin' ? 'Administration' : 'Company Portal'}
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === '/admin' || link.href === '/company'
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 text-slate-400" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
