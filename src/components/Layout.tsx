import React from 'react';
import { ClipboardCheck, LogOut, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onBack?: () => void;
  title?: string;
}

export default function Layout({ children, user, onBack, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <header className="bg-apf-blue border-b border-apf-blue-dark sticky top-0 z-40 print:hidden text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onBack?.()}>
            <div className="bg-white/10 p-2 rounded-lg border border-white/5 relative">
              <ClipboardCheck className="text-white w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-apf-orange rounded-full border-2 border-apf-blue" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">
                APF<span className="text-apf-orange font-bold font-sans">Ergo</span>
              </h1>
              <div className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">
                Dossier Ergothérapique
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {title && (
              <div className="hidden md:block bg-white/10 px-3 py-1.5 rounded-md text-xs font-semibold border border-white/10">
                {title}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <span className="text-xs font-medium opacity-80">{user?.email}</span>
              </div>
              <button 
                onClick={() => api.auth.logout()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
