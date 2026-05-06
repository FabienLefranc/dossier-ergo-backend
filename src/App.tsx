import React, { useState, useEffect } from 'react';
import { api } from './lib/api';
import Auth from './components/Auth';
import PatientList from './components/PatientList';
import PatientDossier from './components/PatientDossier';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  pathology: string;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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

  return (
    <Layout 
      user={user} 
      onBack={() => setSelectedPatient(null)}
      title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Tableau de bord"}
    >
      {selectedPatient ? (
        <PatientDossier 
          patient={selectedPatient} 
          userId={user.id} 
          onBack={() => setSelectedPatient(null)} 
        />
      ) : (
        <PatientList 
          userId={user.id} 
          onSelectPatient={(p) => setSelectedPatient(p)} 
        />
      )}
    </Layout>
  );
}
