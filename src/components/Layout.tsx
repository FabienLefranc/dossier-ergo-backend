import React from 'react';
import { ClipboardCheck, LogOut } from 'lucide-react';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onBack?: () => void;
  title?: string;
}

export default function Layout({ children, user, onBack, title }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 sm:pb-20">
      <header className="bg-apf-blue border-b border-apf-blue-dark sticky top-0 z-40 print:hidden text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => onBack?.()}>
            <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg border border-white/5 relative">
              <ClipboardCheck className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-apf-orange rounded-full border-2 border-apf-blue" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tighter leading-none">
                APF<span className="text-apf-orange font-bold font-sans">Ergo</span>
              </h1>
              <div className="text-[9px] sm:text-[10px] opacity-70 font-bold uppercase tracking-widest mt-0.5 sm:mt-1 hidden sm:block">
                Dossier Ergothérapique
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {title && (
              <div className="hidden md:block bg-white/10 px-3 py-1.5 rounded-md text-xs font-semibold border border-white/10 max-w-[200px] truncate">
                {title}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 mr-1 sm:mr-2">
                <span className="text-xs font-medium opacity-80 truncate max-w-[150px]">{user?.email}</span>
              </div>
              <button 
                onClick={() => api.auth.logout()}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
