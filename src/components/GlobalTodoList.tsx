import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  User,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

type Category = 'personal' | 'patient' | 'administrative';

interface GlobalTodo {
  id: number;
  title: string;
  completed: boolean;
  urgent: boolean;
  due_date: string | null;
  category: Category;
  patient_id: string | null;
  patient_name: string | null;
  created_at: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const CATEGORY_CONFIG: Record<Category, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  personal: {
    label: 'Perso',
    icon: <User className="w-4 h-4" />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  patient: {
    label: 'Par patient',
    icon: <ListTodo className="w-4 h-4" />,
    color: 'text-apf-blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  administrative: {
    label: 'Administratif',
    icon: <Briefcase className="w-4 h-4" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

export default function GlobalTodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<GlobalTodo[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('personal');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [newTodo, setNewTodo] = useState({
    title: '',
    urgent: false,
    due_date: '',
    category: 'personal' as Category,
    patient_id: '',
  });

  useEffect(() => {
    fetchTodos();
    fetchPatients();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const data = await api.globalTodos.list();
      setTodos(data);
    } catch (e) {
      console.error('Erreur chargement todos globaux', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await api.patients.list();
      setPatients(data.map((p: any) => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
      })));
    } catch (e) {
      console.error('Erreur chargement patients', e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    try {
      const patientName = newTodo.category === 'patient' && newTodo.patient_id
        ? patients.find(p => p.id === newTodo.patient_id)
            ? `${patients.find(p => p.id === newTodo.patient_id)!.firstName} ${patients.find(p => p.id === newTodo.patient_id)!.lastName}`
            : null
        : null;

      await api.globalTodos.create({
        title: newTodo.title,
        urgent: newTodo.urgent,
        due_date: newTodo.due_date || null,
        category: newTodo.category,
        patient_id: newTodo.category === 'patient' && newTodo.patient_id ? newTodo.patient_id : null,
        patient_name: patientName,
      });
      setNewTodo({ title: '', urgent: false, due_date: '', category: activeCategory, patient_id: '' });
      setShowAddForm(false);
      fetchTodos();
    } catch (e) {
      console.error('Erreur création todo', e);
    }
  };

  const handleToggle = async (todo: GlobalTodo) => {
    try {
      await api.globalTodos.toggle(todo.id, !todo.completed);
      setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t));
    } catch (e) {
      console.error('Erreur toggle todo', e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.globalTodos.delete(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error('Erreur suppression todo', e);
    }
  };

  const filteredTodos = todos.filter(t => t.category === activeCategory);
  const pending = filteredTodos.filter(t => !t.completed).sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });
  const completed = filteredTodos.filter(t => t.completed);

  const isOverdue = (due_date: string | null) => {
    if (!due_date) return false;
    return new Date(due_date) < new Date(new Date().toDateString());
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const urgentCount = todos.filter(t => t.urgent && !t.completed).length;

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
            <ListTodo className="text-apf-blue w-6 h-6 sm:w-7 sm:h-7" />
            Todo List Globale
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {urgentCount > 0
              ? <span className="text-red-500 font-bold">⚠️ {urgentCount} tâche{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''} en attente</span>
              : 'Gérez toutes vos tâches en un seul endroit.'}
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setNewTodo(n => ({ ...n, category: activeCategory })); }}
          className="w-full sm:w-auto bg-apf-blue hover:bg-apf-blue-dark text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-apf-blue/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouvelle tâche
        </button>
      </div>

      {/* Onglets catégories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const count = todos.filter(t => t.category === cat && !t.completed).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cfg.icon}
              {cfg.label}
              {count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/60' : 'bg-slate-100'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Formulaire d'ajout */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="bg-apf-blue/5 border border-apf-blue/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4">
              <h3 className="font-black text-apf-blue text-xs uppercase tracking-widest">Nouvelle tâche — {CATEGORY_CONFIG[newTodo.category].label}</h3>

              {/* Catégorie */}
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(CATEGORY_CONFIG) as Category[]).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewTodo(n => ({ ...n, category: cat, patient_id: '' }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      newTodo.category === cat
                        ? `${CATEGORY_CONFIG[cat].bg} ${CATEGORY_CONFIG[cat].color} ${CATEGORY_CONFIG[cat].border}`
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    {CATEGORY_CONFIG[cat].icon}
                    {CATEGORY_CONFIG[cat].label}
                  </button>
                ))}
              </div>

              {/* Titre */}
              <input
                required
                type="text"
                placeholder="Description de la tâche..."
                value={newTodo.title}
                onChange={e => setNewTodo(n => ({ ...n, title: e.target.value }))}
                className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date d'échéance */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date d'échéance</label>
                  <input
                    type="date"
                    value={newTodo.due_date}
                    onChange={e => setNewTodo(n => ({ ...n, due_date: e.target.value }))}
                    className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                  />
                </div>

                {/* Patient (si catégorie patient) */}
                {newTodo.category === 'patient' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personne accompagnée</label>
                    <select
                      value={newTodo.patient_id}
                      onChange={e => setNewTodo(n => ({ ...n, patient_id: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    >
                      <option value="">— Choisir —</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Urgent */}
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <div
                  onClick={() => setNewTodo(n => ({ ...n, urgent: !n.urgent }))}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    newTodo.urgent ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'
                  }`}
                >
                  {newTodo.urgent && <AlertCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-bold text-slate-600">Marquer comme urgent 🔴</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="flex-1 p-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-sm">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-[2] p-3 rounded-xl font-bold text-white bg-apf-blue hover:bg-apf-blue-dark transition-all text-sm">
                  Ajouter
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liste des tâches */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-apf-blue animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {pending.length === 0 && !showAddForm && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="font-bold text-slate-500 text-sm">Aucune tâche en attente dans cette catégorie</p>
              <button onClick={() => setShowAddForm(true)} className="text-apf-blue font-bold text-sm hover:underline flex items-center gap-1 mx-auto">
                <Plus className="w-4 h-4" /> Ajouter une tâche
              </button>
            </div>
          )}

          {pending.map(todo => (
            <motion.div
              layout
              key={todo.id}
              className={`bg-white rounded-2xl border p-4 flex items-start gap-3 transition-all ${
                todo.urgent ? 'border-red-200 shadow-sm shadow-red-50' : 'border-slate-200'
              }`}
            >
              <button onClick={() => handleToggle(todo)} className="mt-0.5 flex-shrink-0 text-slate-300 hover:text-green-500 transition-colors">
                <Circle className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  {todo.urgent && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{todo.title}</p>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {todo.patient_name && (
                    <span className="text-[11px] text-apf-blue font-bold flex items-center gap-1">
                      <User className="w-3 h-3" />{todo.patient_name}
                    </span>
                  )}
                  {todo.due_date && (
                    <span className={`text-[11px] font-bold flex items-center gap-1 ${isOverdue(todo.due_date) ? 'text-red-500' : 'text-slate-400'}`}>
                      <Calendar className="w-3 h-3" />
                      {isOverdue(todo.due_date) ? '⚠️ ' : ''}{formatDate(todo.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-slate-200 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}

          {/* Tâches terminées */}
          {completed.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mb-3"
              >
                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Terminées ({completed.length})
              </button>
              <AnimatePresence>
                {showCompleted && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {completed.map(todo => (
                      <div key={todo.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center gap-3 opacity-60">
                        <button onClick={() => handleToggle(todo)} className="flex-shrink-0 text-green-400 hover:text-slate-300 transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <p className="flex-1 text-sm text-slate-400 line-through">{todo.title}</p>
                        <button onClick={() => handleDelete(todo.id)} className="flex-shrink-0 text-slate-200 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
