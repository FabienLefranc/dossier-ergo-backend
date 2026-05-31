import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import Auth from './components/Auth';
import PatientList from './components/PatientList';
import PatientDossier from './components/PatientDossier';
import GlobalTodoList from './components/GlobalTodoList';
import Layout from './components/Layout';
import { Loader2, Users, ListTodo } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  pathology: string;
}

type MainTab = 'patients' | 'todos';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>('patients');

  useEffect(() => {
    const u = api.auth.getUser();
    if (!u) {
      const defaultUser = { id: 1, name: 'Fabien', email: 'fabien.lefranc16@gmail.com' };
      localStorage.setItem('user', JSON.stringify(defaultUser));
      localStorage.setItem('token', 'dev-token');
      setUser(defaultUser);
    } else {
      setUser(u);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-apf-blue animate-spin" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (selectedPatient) return `${selectedPatient.firstName} ${selectedPatient.lastName}`;
    if (mainTab === 'todos') return 'Todo List Globale';
    return 'Tableau de bord';
  };

  return (
    <Layout
      user={user}
      onBack={selectedPatient ? () => setSelectedPatient(null) : undefined}
      title={getTitle()}
    >
      {selectedPatient ? (
        <PatientDossier
          patient={selectedPatient}
          userId={user.id}
          onBack={() => setSelectedPatient(null)}
        />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Onglets principaux */}
          <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <button
              onClick={() => setMainTab('patients')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mainTab === 'patients'
                  ? 'bg-apf-blue text-white shadow-md shadow-apf-blue/20'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Personnes
            </button>
            <button
              onClick={() => setMainTab('todos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mainTab === 'todos'
                  ? 'bg-apf-blue text-white shadow-md shadow-apf-blue/20'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Todo List
            </button>
          </div>

          {mainTab === 'patients' ? (
            <PatientList
              userId={user.id}
              onSelectPatient={(p) => setSelectedPatient(p)}
            />
          ) : (
            <GlobalTodoList userId={user.id} />
          )}
        </div>
      )}
    </Layout>
  );
}
