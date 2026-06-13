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
  ListTodo,
  Pencil,
  X,
  Check,
  ArrowUpDown,
  Trash2
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
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchPatients();
  }, [userId]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await api.patients.list();
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
      alert("Personne accompagnée enregistrée avec succès !");
    } catch (error: any) {
      console.error("Error adding patient:", error);
      const detail = error.details ? ` (${error.details})` : '';
      alert(`Erreur lors de l'enregistrement : ${error.message}${detail}.`);
    }
  };

  const handleDeletePatient = async (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Supprimer la fiche de ${patient.firstName} ${patient.lastName} ? Cette action est irréversible.`)) return;
    try {
      await api.patients.delete(patient.id);
      fetchPatients();
    } catch (error: any) {
      alert(`Erreur lors de la suppression : ${error.message}`);
    }
  };

  const handleEditPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      await api.patients.update(editingPatient.id, {
        firstName: editingPatient.firstName,
        lastName: editingPatient.lastName,
        birthDate: editingPatient.birthDate,
        pathology: editingPatient.pathology,
      });
      setEditingPatient(null);
      fetchPatients();
    } catch (error: any) {
      console.error("Error updating patient:", error);
      alert(`Erreur lors de la modification : ${error.message || 'Vérifiez que le backend est bien démarré sur Render.'}`);
    }
  };

  const filteredPatients = patients
    .filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (p.pathology || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <Users className="text-apf-blue w-6 h-6 sm:w-7 sm:h-7" />
            Mes Personnes Accompagnées
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gérez vos accompagnements et dossiers cliniques.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto bg-apf-blue hover:bg-apf-blue-dark text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-apf-blue/20 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nouvelle Personne
        </button>
      </div>

      {/* Search + Tri */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Rechercher (nom, pathologie...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium text-sm sm:text-base"
          />
        </div>
        <button
          onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-apf-blue hover:text-apf-blue transition-all font-bold text-slate-500 text-sm whitespace-nowrap"
          title={sortOrder === 'asc' ? 'Tri A→Z' : 'Tri Z→A'}
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddPatient} className="bg-apf-blue/5 border border-apf-blue/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-inner">
              <h3 className="font-black text-apf-blue text-sm uppercase tracking-widest">Nouvelle personne accompagnée</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Prénom</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.firstName}
                    onChange={e => setNewPatient({...newPatient, firstName: e.target.value})}
                    className="w-full p-3 sm:p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Nom</label>
                  <input 
                    required
                    type="text" 
                    value={newPatient.lastName}
                    onChange={e => setNewPatient({...newPatient, lastName: e.target.value})}
                    className="w-full p-3 sm:p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Date de Naissance</label>
                  <input 
                    type="date" 
                    value={newPatient.birthDate}
                    onChange={e => setNewPatient({...newPatient, birthDate: e.target.value})}
                    className="w-full p-3 sm:p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-black text-apf-blue uppercase tracking-widest">Pathologie</label>
                  <input 
                    type="text" 
                    value={newPatient.pathology}
                    onChange={e => setNewPatient({...newPatient, pathology: e.target.value})}
                    placeholder="SEP, SLA, AVC..."
                    className="w-full p-3 sm:p-4 bg-white border border-apf-blue/20 rounded-xl focus:ring-2 focus:ring-apf-blue outline-none transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 p-3 sm:p-4 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-sm sm:text-base"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-[2] p-3 sm:p-4 rounded-xl font-bold text-white bg-apf-blue hover:bg-apf-blue-dark transition-all shadow-lg shadow-apf-blue/20 text-sm sm:text-base"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 sm:p-20 space-y-4">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-apf-blue animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Chargement...</p>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredPatients.map((patient) => (
            <motion.div 
              layout
              key={patient.id}
              className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200 hover:border-apf-blue hover:shadow-xl transition-all relative overflow-hidden"
            >
              {/* Edit form overlay */}
              {editingPatient?.id === patient.id ? (
                <form onSubmit={handleEditPatient} className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-apf-blue uppercase tracking-widest">Modifier la fiche</span>
                    <button type="button" onClick={() => setEditingPatient(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prénom</label>
                      <input
                        required
                        type="text"
                        value={editingPatient.firstName}
                        onChange={e => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
                      <input
                        required
                        type="text"
                        value={editingPatient.lastName}
                        onChange={e => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naissance</label>
                      <input
                        type="date"
                        value={editingPatient.birthDate ? editingPatient.birthDate.split('T')[0] : ''}
                        onChange={e => setEditingPatient({ ...editingPatient, birthDate: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pathologie</label>
                      <input
                        type="text"
                        value={editingPatient.pathology || ''}
                        onChange={e => setEditingPatient({ ...editingPatient, pathology: e.target.value })}
                        placeholder="SEP, SLA..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingPatient(null)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] py-2.5 rounded-xl font-bold text-white bg-apf-blue hover:bg-apf-blue-dark transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Enregistrer
                    </button>
                  </div>
                </form>
              ) : (
                <div
                  onClick={() => onSelectPatient(patient)}
                  className="p-5 sm:p-6 cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-apf-blue/5 transition-colors">
                    <User className="w-16 h-16 sm:w-20 sm:h-20 -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 rotate-12" />
                  </div>
                  
                  <div className="relative space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-apf-blue/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-apf-blue group-hover:scale-110 transition-transform">
                        <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPatient(patient); }}
                          className="p-2 rounded-xl text-slate-300 hover:text-apf-blue hover:bg-apf-blue/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Modifier la fiche"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePatient(patient, e)}
                          className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                          title="Supprimer la fiche"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight">
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

                    <div className="space-y-2 border-t border-slate-50 pt-3 sm:pt-4">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Calendar className="w-4 h-4" />
                        {patient.birthDate ? `Né(e) le ${new Date(patient.birthDate).toLocaleDateString('fr-FR')}` : 'Date non renseignée'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Accéder au dossier</span>
                      <ChevronRight className="w-5 h-5 text-apf-blue opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 p-12 sm:p-20 text-center space-y-4 sm:space-y-6">
          <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto">
            <Users className="text-slate-300 w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="max-w-xs mx-auto">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg">Aucune personne trouvée</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Commencez par ajouter votre première personne accompagnée pour créer son dossier ergothérapique.
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 text-apf-blue font-bold hover:underline text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter manuellement
          </button>
        </div>
      )}
    </div>
  );
}
