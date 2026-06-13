import React, { useState, useEffect } from 'react';
import {
  ListTodo, Plus, Trash2, CheckCircle2, Circle,
  AlertCircle, Calendar, User, Briefcase, ChevronDown,
  ChevronUp, Loader2
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

const emptyForm = () => ({
  title: '',
  urgent: false,
  due_date: '',
  category: 'personal' as Category,
  patient_id: '',
});

export default function GlobalTodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<GlobalTodo[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLeft, setShowAddLeft] = useState(false);
  const [showAddRight, setShowAddRight] = useState(false);
  const [showCompletedLeft, setShowCompletedLeft] = useState(false);
  const [showCompletedRight, setShowCompletedRight] = useState(false);
  const [newLeft, setNewLeft] = useState(emptyForm());
  const [newRight, setNewRight] = useState({ ...emptyForm(), category: 'patient' as Category });

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
        id: String(p.id),
        firstName: p.first_name,
        lastName: p.last_name,
      })));
    } catch (e) {
      console.error('Erreur chargement patients', e);
    }
  };

  const handleAdd = async (form: typeof newLeft, isPatient: boolean) => {
    if (!form.title.trim()) return;
    if (isPatient && !form.patient_id) return;
    try {
      const patient = isPatient ? patients.find(p => p.id === form.patient_id) : null;
      const patient_name = patient ? `${patient.firstName} ${patient.lastName}` : null;

      await api.globalTodos.create({
        title: form.title,
        urgent: form.urgent,
        due_date: form.due_date || null,
        category: isPatient ? 'patient' : form.category,
        patient_id: isPatient ? form.patient_id : null,
        patient_name,
      });

      // Si tâche patient → aussi dans la todo list du patient
      if (isPatient && form.patient_id) {
        await api.tasks.create(form.patient_id, form.title);
      }

      fetchTodos();
      if (isPatient) {
        setNewRight({ ...emptyForm(), category: 'patient' });
        setShowAddRight(false);
      } else {
        setNewLeft(emptyForm());
        setShowAddLeft(false);
      }
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

  const isOverdue = (due_date: string | null) => {
    if (!due_date) return false;
    return new Date(due_date) < new Date(new Date().toDateString());
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const sortTodos = (list: GlobalTodo[]) =>
    list.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  const leftTodos = todos.filter(t => t.category === 'personal' || t.category === 'administrative');
  const rightTodos = todos.filter(t => t.category === 'patient');
  const leftPending = sortTodos(leftTodos.filter(t => !t.completed));
  const leftDone = leftTodos.filter(t => t.completed);
  const rightPending = sortTodos(rightTodos.filter(t => !t.completed));
  const rightDone = rightTodos.filter(t => t.completed);
  const urgentCount = todos.filter(t => t.urgent && !t.completed).length;

  const TodoItem = ({ todo }: { todo: GlobalTodo }) => (
    <motion.div layout key={todo.id}
      className={`bg-white rounded-2xl border p-3 sm:p-4 flex items-start gap-3 transition-all ${todo.urgent ? 'border-red-200 shadow-sm shadow-red-50' : 'border-slate-200'}`}
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
          {todo.category === 'administrative' && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Admin
            </span>
          )}
          {todo.category === 'personal' && (
            <span className="text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              <User className="w-3 h-3" /> Perso
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-slate-800 leading-snug mt-1">{todo.title}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
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
  );

  const DoneSection = ({ list, show, setShow }: { list: GlobalTodo[]; show: boolean; setShow: (v: boolean) => void }) => (
    list.length > 0 ? (
      <div className="pt-2">
        <button onClick={() => setShow(!show)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors mb-2">
          {show ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Terminées ({list.length})
        </button>
        <AnimatePresence>
          {show && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {list.map(todo => (
                <div key={todo.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-3 flex items-center gap-3 opacity-60">
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
    ) : null
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
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

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-apf-blue animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">

          {/* ── COLONNE GAUCHE : Perso + Administratif ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" /> Perso &amp;
                  <Briefcase className="w-4 h-4 text-amber-500" /> Administratif
                </span>
                {leftPending.length > 0 && (
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{leftPending.length}</span>
                )}
              </div>
              <button
                onClick={() => { setShowAddLeft(true); setNewLeft(emptyForm()); }}
                className="flex items-center gap-1.5 text-xs font-bold text-apf-blue hover:bg-apf-blue/10 px-3 py-1.5 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            {/* Formulaire gauche */}
            <AnimatePresence>
              {showAddLeft && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-apf-blue/5 border border-apf-blue/10 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2">
                      {(['personal', 'administrative'] as Category[]).map(cat => (
                        <button key={cat} type="button"
                          onClick={() => setNewLeft(n => ({ ...n, category: cat }))}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            newLeft.category === cat
                              ? cat === 'personal' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}>
                          {cat === 'personal' ? <User className="w-3.5 h-3.5" /> : <Briefcase className="w-3.5 h-3.5" />}
                          {cat === 'personal' ? 'Perso' : 'Administratif'}
                        </button>
                      ))}
                    </div>
                    <input required type="text" placeholder="Description de la tâche..."
                      value={newLeft.title}
                      onChange={e => setNewLeft(n => ({ ...n, title: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    />
                    <input type="date" value={newLeft.due_date}
                      onChange={e => setNewLeft(n => ({ ...n, due_date: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    />
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <div onClick={() => setNewLeft(n => ({ ...n, urgent: !n.urgent }))}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newLeft.urgent ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}>
                        {newLeft.urgent && <AlertCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-600">Urgent 🔴</span>
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowAddLeft(false)}
                        className="flex-1 p-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 text-sm">Annuler</button>
                      <button type="button" onClick={() => handleAdd(newLeft, false)}
                        className="flex-[2] p-2.5 rounded-xl font-bold text-white bg-apf-blue text-sm">Ajouter</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {leftPending.length === 0 && !showAddLeft && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
                <div className="text-2xl">🎉</div>
                <p className="text-sm font-bold text-slate-400">Aucune tâche en attente</p>
                <button onClick={() => setShowAddLeft(true)} className="text-apf-blue font-bold text-xs hover:underline flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
                </button>
              </div>
            )}

            <div className="space-y-2">
              {leftPending.map(todo => <TodoItem key={todo.id} todo={todo} />)}
            </div>
            <DoneSection list={leftDone} show={showCompletedLeft} setShow={setShowCompletedLeft} />
          </div>

          {/* ── COLONNE DROITE : Par patient ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-apf-blue" /> Par personne accompagnée
                </span>
                {rightPending.length > 0 && (
                  <span className="text-[10px] font-black bg-blue-100 text-apf-blue px-2 py-0.5 rounded-full">{rightPending.length}</span>
                )}
              </div>
              <button
                onClick={() => { setShowAddRight(true); setNewRight({ ...emptyForm(), category: 'patient' }); }}
                className="flex items-center gap-1.5 text-xs font-bold text-apf-blue hover:bg-apf-blue/10 px-3 py-1.5 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>

            {/* Formulaire droite */}
            <AnimatePresence>
              {showAddRight && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="bg-apf-blue/5 border border-apf-blue/10 rounded-2xl p-4 space-y-3">
                    <select value={newRight.patient_id}
                      onChange={e => setNewRight(n => ({ ...n, patient_id: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    >
                      <option value="">— Choisir une personne —</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                    <input required type="text" placeholder="Description de la tâche..."
                      value={newRight.title}
                      onChange={e => setNewRight(n => ({ ...n, title: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    />
                    <input type="date" value={newRight.due_date}
                      onChange={e => setNewRight(n => ({ ...n, due_date: e.target.value }))}
                      className="w-full p-3 bg-white border border-apf-blue/20 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                    />
                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                      <div onClick={() => setNewRight(n => ({ ...n, urgent: !n.urgent }))}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${newRight.urgent ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}>
                        {newRight.urgent && <AlertCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-600">Urgent 🔴</span>
                    </label>
                    <p className="text-[11px] text-apf-blue font-bold">✓ La tâche apparaîtra aussi dans l'onglet "À faire" de la fiche patient</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowAddRight(false)}
                        className="flex-1 p-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 text-sm">Annuler</button>
                      <button type="button" onClick={() => handleAdd(newRight, true)}
                        className="flex-[2] p-2.5 rounded-xl font-bold text-white bg-apf-blue text-sm">Ajouter</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {rightPending.length === 0 && !showAddRight && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-2">
                <div className="text-2xl">👤</div>
                <p className="text-sm font-bold text-slate-400">Aucune tâche par patient</p>
                <button onClick={() => setShowAddRight(true)} className="text-apf-blue font-bold text-xs hover:underline flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
                </button>
              </div>
            )}

            <div className="space-y-2">
              {rightPending.map(todo => <TodoItem key={todo.id} todo={todo} />)}
            </div>
            <DoneSection list={rightDone} show={showCompletedRight} setShow={setShowCompletedRight} />
          </div>

        </div>
      )}
    </div>
  );
}
