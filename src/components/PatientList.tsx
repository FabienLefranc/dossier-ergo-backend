import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ChevronRight, 
  Loader2, 
  User, 
  Calendar, 
  Stethoscope,
  Plus,
  ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  pathology: string;
  createdAt: any;
}

interface PatientListProps {
  userId: string;
  onSelectPatient: (patient: Patient) => void;
}

export default function PatientList({ userId, onSelectPatient }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', birthDate: '', pathology: '' });

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.patients.list();
      // Map MySQL fields to camelCase if needed, but they are already mostly okay or I'll handle them
      const list = data.map((p: any) => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        birthDate: p.birth_date,
        pathology: p.pathology,
        createdAt: p.created_at
      }));
      setPatients(list);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const TaskBadge = ({ patientId }: { patientId: string }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      api.tasks.list(patientId).then(tasks => {
        setCount(tasks.filter((t: any) => !t.completed).length);
      });
    }, [patientId]);

    if (count === 0) return null;

    return (
      <div className="flex items-center gap-1.5 bg-apf-orange/10 text-apf-orange-dark px-2.5 py-1 rounded-lg border border-apf-orange/20 animate-pulse transition-all">
        <ListTodo className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
          {count} {count === 1 ? 'Action' : 'Actions'}
        </span>
      </div>
    );
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.firstName || !newPatient.lastName) return;

    try {
      await api.patients.create(newPatient);
      setIsAdding(false);
      setNewPatient({ firstName: '', lastName: '', birthDate: '', pathology: '' });
      fetchPatients();
      alert("Patient enregistré avec succès !");
    } catch (error: any) {
      console.error("Error adding patient:", error);
      const detail = error.details ? ` (${error.details})` : '';
      alert(`Erreur lors de l'enregistrement : ${error.message}${detail}. Vérifiez que votre base de données MySQL autorise les connexions distantes et que vos paramètres sont corrects dans le menu Settings.`);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    p.pathology.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Users className="text-apf-blue w-7 h-7" />
            Mes Patients
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gérez vos accompagnements et dossiers cliniques.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-apf-blue hover:bg-apf-blue-dark text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-apf-blue/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nouveau Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text"
          placeholder="Rechercher un patient (nom, pathologie...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium"
        />
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddPatient} className="bg-apf-blue/5 border border-apf-blue/10 rounded-3xl p-8 space-y-6 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Prénom</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                    className="w-full p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Nom</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                    className="w-full p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Date de Naissance</label>
                  <input 
                    type="date" 
                    value={newPatient.birthDate}
                    onChange={e => setNewPatient({...newPatient, birthDate: e.target.value})}
                    className="w-full p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Pathologie</label>
                  <input 
                    type="text" 
                    value={newPatient.pathology}
                    onChange={e => setNewPatient({...newPatient, pathology: e.target.value})}
                    placeholder="SEP, SLA, AVC..."
                    className="w-full p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 p-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-[2] p-4 rounded-xl font-bold text-white bg-apf-blue hover:bg-apf-blue-dark transition-all shadow-lg shadow-apf-blue/20"
                >
                  Enregistrer le patient
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-12 h-12 text-apf-blue animate-spin" />
          <p className="text-slate-400 font-medium">Chargement des patients...</p>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <motion.div 
              layout
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className="group bg-white rounded-3xl border border-slate-200 p-6 hover:border-apf-blue hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-apf-blue/5 transition-colors">
                <User className="w-20 h-20 -mr-8 -mt-8 rotate-12" />
              </div>
              
              <div className="relative space-y-4">
                <div className="w-12 h-12 bg-apf-blue/10 rounded-2xl flex items-center justify-center text-apf-blue group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <TaskBadge patientId={patient.id} />
                  </div>
                  {patient.pathology && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-apf-blue uppercase mt-1">
                      <Stethoscope className="w-3 h-3" />
                      {patient.pathology}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-slate-50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                    <Calendar className="w-4 h-4" />
                    Né le {new Date(patient.birthDate).toLocaleDateString() || 'NC'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Accéder au dossier</span>
                  <ChevronRight className="w-5 h-5 text-apf-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center space-y-6">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Users className="text-slate-300 w-10 h-10" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="font-bold text-slate-800 text-lg">Aucun patient trouvé</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Commencez par ajouter votre premier patient pour créer son dossier ergothérapique.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 text-apf-blue font-bold hover:underline"
          >
            <Plus className="w-4 h-4" />
            Ajouter manuellement
          </button>
        </div>
      )}
    </div>
  );
}
