import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FileText, 
  FileCheck, 
  Trash2, 
  Loader2, 
  Search,
  Filter,
  Folder,
  Download,
  Calendar,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

interface Note {
  date: any;
  text: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  url: string;
  fileName: string;
  notes: Note[];
  createdAt: any;
}

interface DocumentManagerProps {
  patientId: string;
  userId: string;
  type: 'cpam' | 'general';
}

export default function DocumentManager({ patientId, userId, type }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [newNote, setNewNote] = useState<{ docId: string, text: string } | null>(null);
  const [editingNote, setEditingNote] = useState<{ docId: string, index: number, text: string } | null>(null);

  const storageKey = type === 'cpam' ? `cpam_docs` : `patient_docs`;

  const fetchDocuments = async () => {
    try {
      setLoading(true);      
      const data = await api.data.get(patientId, storageKey);
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [patientId, userId, storageKey]);

  const saveDocuments = async (newDocs: Document[]) => {
    await api.data.save(patientId, storageKey, newDocs);
    setDocuments(newDocs);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, category?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await api.files.upload(file);

      const newDoc: Document = {
        id: Date.now().toString(),
        title: file.name.split('.')[0],
        category: category || 'Autre',
        url,
        fileName: file.name,
        notes: [],
        createdAt: { seconds: Date.now() / 1000 }
      };

      await saveDocuments([newDoc, ...documents]);
      alert("Document envoyé avec succès !");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Erreur lors de l'envoi.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddNote = async (docObj: Document) => {
    if (!newNote || !newNote.text.trim()) return;
    const newDocs = documents.map(d => {
      if (d.id === docObj.id) {
        return { ...d, notes: [...(d.notes || []), { date: new Date().toISOString(), text: newNote.text }] };
      }
      return d;
    });
    await saveDocuments(newDocs);
    setNewNote(null);
  };

  const updateNote = async (docObj: Document, index: number, newText: string) => {
    const newDocs = documents.map(d => {
      if (d.id === docObj.id) {
        const notes = [...d.notes];
        notes[index] = { ...notes[index], text: newText };
        return { ...d, notes };
      }
      return d;
    });
    await saveDocuments(newDocs);
    setEditingNote(null);
  };

  const deleteNote = async (docObj: Document, index: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    const newDocs = documents.map(d => {
      if (d.id === docObj.id) {
        return { ...d, notes: d.notes.filter((_, i) => i !== index) };
      }
      return d;
    });
    await saveDocuments(newDocs);
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    const newDocs = documents.filter(d => d.id !== docId);
    await saveDocuments(newDocs);
  };

  const filteredDocs = documents.filter(d => 
    (filter === 'all' || d.category === filter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()))
  );

  const cpamCategories = [
    { id: 'vph', label: 'Acquisition VPH', color: 'bg-apf-blue' },
    { id: 'essais', label: 'Essais Techniques', color: 'bg-apf-orange' },
    { id: 'cerfa', label: 'Documents Cerfa', color: 'bg-slate-700' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 text-apf-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CPAM Layout */}
      {type === 'cpam' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cpamCategories.map((cat) => (
            <div key={cat.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all group relative">
              <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {cat.id === 'vph' ? <FileText /> : cat.id === 'essais' ? <FileCheck /> : <Folder />}
              </div>
              <h3 className="text-lg font-black text-slate-800">{cat.label}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {documents.filter(d => d.category === cat.id).length} document(s)
              </p>
              <div className="mt-4 relative">
                 <button className="flex items-center gap-2 text-xs font-bold text-apf-blue hover:underline">
                    <Plus className="w-4 h-4" />
                    Ajouter un document
                 </button>
                 <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, cat.id)}
                  disabled={uploading}
                 />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Document List View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher un document..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-apf-blue outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="text-slate-400 w-4 h-4" />
            <select 
              className="bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold px-3 py-2 outline-none h-9"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tous les types</option>
              {type === 'cpam' ? (
                cpamCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
              ) : (
                <>
                  <option value="Notif">Notifications</option>
                  <option value="CR">Comptes-rendus</option>
                  <option value="Prescription">Prescriptions</option>
                  <option value="Autre">Autres</option>
                </>
              )}
            </select>
            
            {type === 'general' && (
              <div className="relative">
                <button className="bg-apf-blue text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-apf-blue-dark transition-all">
                  <Plus className="w-4 h-4" />
                  Importer
                </button>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => handleFileUpload(e, 'Autre')}
                  disabled={uploading}
                />
              </div>
            )}
          </div>
        </div>

        {uploading && (
          <div className="p-4 bg-apf-blue/5 border-b border-apf-blue/10 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-apf-blue animate-spin" />
            <span className="text-xs font-bold text-apf-blue uppercase tracking-widest">Envoi en cours...</span>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {filteredDocs.length === 0 ? (
            <div className="p-20 text-center text-slate-400 italic">
              Aucun document trouvé.
            </div>
          ) : (
            filteredDocs.map((docItem) => (
              <div key={docItem.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-apf-blue group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{docItem.title}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-apf-blue">{docItem.category}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {docItem.createdAt ? new Date(docItem.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : 'Date inconnue'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a 
                      href={docItem.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-2 text-slate-400 hover:text-apf-blue transition-colors"
                      title="Voir"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => handleDelete(docItem.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-4 ml-14 space-y-3">
                  {docItem.notes?.map((note, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 group/note relative">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-[9px] font-black text-apf-blue uppercase">
                          <Calendar className="w-3 h-3" />
                          {new Date(note.date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingNote({ docId: docItem.id, index: idx, text: note.text })}
                            className="text-slate-400 hover:text-apf-blue"
                          >
                            <FileText className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => deleteNote(docItem, idx)}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {editingNote?.docId === docItem.id && editingNote?.index === idx ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editingNote.text}
                            onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-apf-blue"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 text-[9px] font-bold">
                            <button onClick={() => setEditingNote(null)} className="text-slate-400">ANNULER</button>
                            <button onClick={() => updateNote(docItem, idx, editingNote.text)} className="text-apf-blue">SAUVEGARDER</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">"{note.text}"</p>
                      )}
                    </div>
                  ))}

                  {newNote?.docId === docItem.id ? (
                    <div className="space-y-2">
                      <textarea 
                        placeholder="Votre commentaire..."
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-apf-blue transition-all"
                        value={newNote.text}
                        onChange={(e) => setNewNote({ ...newNote, text: e.target.value })}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setNewNote(null)}
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={() => handleAddNote(docItem)}
                          className="text-[10px] font-bold text-white bg-apf-blue uppercase tracking-widest px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          Ajouter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setNewNote({ docId: docItem.id, text: '' })}
                      className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-apf-blue transition-colors px-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      AJOUTER UN COMMENTAIRE
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {type === 'cpam' && filteredDocs.length > 0 && (
         <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 italic font-medium">
            Tous les documents pour la CPAM sont centralisés ici pour faciliter la transmission.
         </div>
      )}
    </div>
  );
}
