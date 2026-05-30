import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FolderOpen, 
  ClipboardCheck, 
  ArrowLeft, 
  Box, 
  FileCheck,
  ListTodo,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AssessmentForm from './AssessmentForm';
import TodoList from './TodoList';
import MdphDossier from './MdphDossier';
import CpamDossier from './CpamDossier';
import DocumentManager from './DocumentManager';
import { api } from '../lib/api';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  pathology: string;
}

interface PatientDossierProps {
  patient: Patient;
  userId: string;
  onBack: () => void;
}

type Tab = 'assessment' | 'cpam' | 'mdph' | 'documents' | 'summary' | 'todo';

export default function PatientDossier({ patient, userId, onBack }: PatientDossierProps) {
  const [activeTab, setActiveTab] = useState<Tab>('todo');
  const [todoCount, setTodoCount] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await api.tasks.list(patient.id);
        const total = tasks.length;
        const pending = tasks.filter((t: any) => !t.completed).length;
        setTodoCount({ total, pending });
      } catch (error) {
        console.error("Error fetching tasks count:", error);
      }
    };
    fetchTasks();
  }, [patient.id, userId]);

  const tabs = [
    { id: 'todo', label: 'À faire', icon: <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'assessment', label: 'Évaluation', icon: <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'cpam', label: 'CPAM', icon: <FileCheck className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'mdph', label: 'MDPH', icon: <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Patient Header */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-apf-blue" />
        
        <div className="flex items-start gap-3 sm:gap-6 pl-2">
          <button 
            onClick={onBack}
            className="p-2 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl sm:rounded-2xl text-slate-400 hover:text-slate-600 transition-all border border-slate-100 shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight truncate">
                {patient.firstName} {patient.lastName}
              </h2>
              <span className="bg-apf-blue/10 text-apf-blue-dark text-[10px] sm:text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider shrink-0">
                Accompagnement Actif
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Box className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
                ID: {String(patient.id).substring(0, 8)}...
              </span>
              {patient.pathology && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-apf-blue" />
                  {patient.pathology}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Todo Summary */}
        <div 
          onClick={() => setActiveTab('todo')}
          className="cursor-pointer bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-apf-blue/30 transition-all self-start"
        >
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors ${todoCount.pending > 0 ? 'bg-apf-orange/20 text-apf-orange-dark' : 'bg-apf-blue/10 text-apf-blue'}`}>
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">À FAIRE</div>
            <div className="text-xs sm:text-sm font-bold text-slate-700">
              {todoCount.pending > 0 ? (
                <span className="text-apf-orange-dark">{todoCount.pending} tâche(s) en attente</span>
              ) : (
                <span className="text-apf-blue flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Tout est fait
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation — scrollable sur mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold whitespace-nowrap transition-all border text-xs sm:text-sm ${
              activeTab === tab.id 
                ? 'bg-apf-blue text-white border-apf-blue shadow-lg shadow-apf-blue/20' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'todo' && todoCount.pending > 0 && (
              <span className="bg-apf-orange text-white text-[10px] w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black">
                {todoCount.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px] sm:min-h-[600px]">
        <AnimatePresence mode="wait">
          {activeTab === 'todo' && (
            <motion.div key="todo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TodoList patientId={patient.id} userId={userId} />
            </motion.div>
          )}
          {activeTab === 'assessment' && (
            <motion.div key="assessment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <AssessmentForm patientId={patient.id} userId={userId} />
            </motion.div>
          )}
          {activeTab === 'cpam' && (
            <motion.div key="cpam" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <CpamDossier patientId={patient.id} userId={userId} />
            </motion.div>
          )}
          {activeTab === 'mdph' && (
            <motion.div key="mdph" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MdphDossier patientId={patient.id} userId={userId} />
            </motion.div>
          )}
          {activeTab === 'documents' && (
            <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DocumentManager patientId={patient.id} userId={userId} type="general" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
