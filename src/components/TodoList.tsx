import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Loader2, 
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

interface Task {
  id: any;
  title: string;
  completed: boolean;
  createdAt: any;
}

interface TodoListProps {
  patientId: string;
  userId: string;
}

export default function TodoList({ patientId, userId }: TodoListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.tasks.list(patientId);
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [patientId, userId]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAdding(true);
    try {
      await api.tasks.create(patientId, newTaskTitle.trim());
      setNewTaskTitle('');
      fetchTasks();
    } catch (error) {
      console.error("Error adding task:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await api.tasks.toggle(task.id, !task.completed);
      fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (taskId: any) => {
    try {
      await api.tasks.delete(taskId);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-apf-blue animate-spin" />
        <p className="text-slate-400 font-medium">Chargement de la liste...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <ListTodo className="text-apf-blue w-7 h-7" />
            À faire
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {tasks.length > 0 
              ? `${completedCount} tâches terminées sur ${tasks.length}`
              : "Aucune tâche pour le moment."}
          </p>
        </div>
      </div>

      <form onSubmit={addTask} className="flex gap-3">
        <input 
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Ajouter une tâche (ex: Appeler le fournisseur, Vérifier la rampe...)"
          className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-apf-blue outline-none transition-all font-medium"
          disabled={isAdding}
        />
        <button 
          type="submit"
          disabled={isAdding || !newTaskTitle.trim()}
          className="bg-apf-blue hover:bg-apf-blue-dark disabled:bg-slate-200 text-white px-6 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-apf-blue/20 active:scale-95"
        >
          {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          <span>Ajouter</span>
        </button>
      </form>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex items-center gap-4 bg-white p-4 rounded-2xl border transition-all ${
                task.completed ? 'border-slate-100 opacity-60' : 'border-slate-200 shadow-sm'
              }`}
            >
              <button 
                onClick={() => toggleTask(task)}
                className={`transition-colors ${task.completed ? 'text-apf-orange' : 'text-slate-300 hover:text-apf-blue'}`}
              >
                {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </button>
              
              <span className={`flex-1 font-medium text-slate-800 transition-all ${task.completed ? 'line-through text-slate-400' : ''}`}>
                {task.title}
              </span>

              <button 
                onClick={() => deleteTask(task.id)}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ListTodo className="text-slate-300 w-8 h-8" />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="font-bold text-slate-800">Tout est à jour !</h3>
              <p className="text-sm text-slate-400 mt-1">
                Aucune tâche programmée pour ce patient. Utilisez le champ ci-dessus pour en ajouter une.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}