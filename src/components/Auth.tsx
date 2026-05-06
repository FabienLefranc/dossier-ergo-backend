import React, { useState } from 'react';
import { ClipboardCheck, LogIn, ShieldCheck, Mail, Lock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface AuthProps {
  onLogin: (userData: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await api.auth.register({ email, password, name });
        const data = await api.auth.login({ email, password });
        onLogin(data.user);
      } else {
        const data = await api.auth.login({ email, password });
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 space-y-8 border border-slate-100"
      >
        <div className="text-center space-y-4">
          <div className="bg-apf-blue w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-apf-blue/20">
            <ClipboardCheck className="text-white w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
              APF<span className="text-apf-orange">Ergo</span>
            </h1>
            <p className="text-slate-500 font-medium">
              {isRegister ? 'Créez votre compte professionnel' : 'Gestionnaire de dossiers ergothérapiques'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                required
                type="text"
                placeholder="Votre nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              required
              type="email"
              placeholder="Email professionnel"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              required
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium"
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold px-2">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-apf-blue hover:bg-apf-blue-dark text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-apf-blue/20 active:scale-95 group disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : (
              <>
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                {isRegister ? "S'inscrire" : "Se connecter"}
              </>
            )}
          </button>
        </form>

        <button 
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-slate-400 text-sm font-bold hover:text-apf-blue transition-colors"
        >
          {isRegister ? "Déjà un compte ? Connectez-vous" : "Pas encore de compte ? S'inscrire"}
        </button>

        <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
          <div className="flex gap-3 text-left">
            <ShieldCheck className="text-apf-blue w-5 h-5 shrink-0" />
            <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-black tracking-widest">
              Vos dossiers sont stockés dans votre base de données MySQL sécurisée. 
              Accès réservé aux professionnels habilités.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
