import { Inter } from 'next/font/google';
import Sidebar from '@/components/layout/Sidebar';
import { getUserRoleAndData } from '@/lib/auth';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getUserRoleAndData();
  
  if (role !== 'admin') {
    redirect('/not-authorized');
  }

  return (
    <div className={`flex h-screen bg-slate-50 ${inter.className}`}>
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
