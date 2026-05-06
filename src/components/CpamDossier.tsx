import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Box, 
  ClipboardCheck, 
  FileCheck, 
  FileText,
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Camera, 
  Euro, 
  ArrowRight,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FolderOpen,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';

interface Note {
  date: any;
  text: string;
}

interface CpamItem {
  id: string;
  category: 'vph' | 'essais' | 'cerfa';
  title: string;
  description: string;
  status: string;
  patientId: string;
  userId: string;
  notes: Note[];
  photos: string[];
  ficheBesoinsPdf: string;
  preconisationPdf: string;
  devisPdf: string;
  createdAt: any;
}

interface CpamDossierProps {
  patientId: string;
  userId: string;
}

export default function CpamDossier({ patientId, userId }: CpamDossierProps) {
  const [items, setItems] = useState<CpamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<{ itemId: string, index: number, text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const results = await api.data.get(patientId, 'cpam_items');
      setItems(results || []);
    } catch (error) {
      console.error("Error fetching CPAM items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [patientId, userId]);

  const saveItems = async (newItems: CpamItem[]) => {
    await api.data.save(patientId, 'cpam_items', newItems);
    setItems(newItems);
  };

  const handleManualSave = async () => {
    setSaving(true);
    try {
      await api.data.save(patientId, 'cpam_items', items);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (itemId: string, field: keyof CpamItem, file: File) => {
    if (!file) return;
    const uploadId = `${itemId}-${field}`;
    setUploading(uploadId);
    
    try {
      const { url } = await api.files.upload(file);
      
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          if (field === 'photos') {
            return { ...item, photos: [...(item.photos || []), url] };
          }
          return { ...item, [field]: url };
        }
        return item;
      });

      await saveItems(updatedItems);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'envoi.");
    } finally {
      setUploading(null);
    }
  };

  const handleAddItem = async (category: CpamItem['category'], title: string) => {
    const newItem: CpamItem = {
      id: Date.now().toString(),
      patientId,
      userId,
      category,
      title,
      description: '',
      status: 'draft',
      notes: [],
      photos: [],
      ficheBesoinsPdf: '',
      preconisationPdf: '',
      devisPdf: '',
      createdAt: { seconds: Date.now() / 1000 }
    };
    await saveItems([newItem, ...items]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<CpamItem>) => {
    // Mise à jour locale uniquement — sauvegarde via bouton "Enregistrer"
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  };

  const removePhoto = async (item: CpamItem, photoUrl: string) => {
    const photos = item.photos.filter(p => p !== photoUrl);
    const newItems = items.map(i => i.id === item.id ? { ...i, photos } : i);
    await saveItems(newItems);
  };

  const addNote = async (item: CpamItem) => {
    if (!newNote.trim()) return;
    const notes = [...(item.notes || []), { date: new Date().toISOString(), text: newNote }];
    const newItems = items.map(i => i.id === item.id ? { ...i, notes } : i);
    await saveItems(newItems);
    setNewNote('');
  };

  const updateNote = async (item: CpamItem, index: number, newText: string) => {
    const notes = [...item.notes];
    notes[index] = { ...notes[index], text: newText };
    const newItems = items.map(i => i.id === item.id ? { ...i, notes } : i);
    await saveItems(newItems);
    setEditingNote(null);
  };

  const deleteNote = async (item: CpamItem, index: number) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    const notes = item.notes.filter((_, i) => i !== index);
    const newItems = items.map(i => i.id === item.id ? { ...i, notes } : i);
    await saveItems(newItems);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Supprimer cet élément ?')) return;
    const newItems = items.filter(i => i.id !== itemId);
    await saveItems(newItems);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const categories = [
    { id: 'vph', title: 'Acquisition VPH', icon: <Box />, color: 'bg-apf-blue', desc: 'Fauteuils roulants' },
    { id: 'essais', title: 'Essais Techniques', icon: <ClipboardCheck />, color: 'bg-apf-orange', desc: "Comptes-rendus d'essais" },
    { id: 'cerfa', title: 'Documents Cerfa', icon: <FileCheck />, color: 'bg-slate-700', desc: 'Formulaires obligatoires' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-apf-blue animate-spin" />
        <p className="text-slate-400 font-medium">Chargement du dossier CPAM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = items.filter(i => i.category === cat.id).length;
          return (
            <div key={cat.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all group">
              <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800">{cat.title}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{cat.desc} — {count} élément(s)</p>
              <button 
                onClick={() => handleAddItem(cat.id as any, cat.title)}
                className="mt-4 flex items-center gap-2 text-xs font-bold text-apf-blue hover:underline transition-colors"
              >
                <Plus className="w-4 h-4" />
                Démarrer un suivi
              </button>
            </div>
          );
        })}
      </div>

      {/* List of CPAM Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-800 italic">Suivi des dossiers VPH & Prises en charge</h3>
          {items.length > 0 && (
            <button
              onClick={handleManualSave}
              disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                saveSuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-apf-blue hover:bg-apf-blue-dark text-white'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Enregistrement...' : saveSuccess ? 'Enregistré !' : 'Enregistrer'}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Aucun dossier CPAM en cours. Commencez par sélectionner une catégorie.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all">
              {/* Header */}
              <button 
                onClick={() => toggleExpanded(item.id)}
                className={`w-full px-8 py-6 flex items-center justify-between transition-colors ${expandedId === item.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expandedId === item.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                    {item.category === 'vph' ? <Box /> : item.category === 'essais' ? <ClipboardCheck /> : <FileCheck />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none">{item.title}</h4>
                    <div className={`text-xs mt-1 font-medium ${expandedId === item.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {item.status === 'draft' ? 'En cours de rédaction' : 'Dossier CPAM en suivi'}
                    </div>
                  </div>
                </div>
                {expandedId === item.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </button>

              {/* Expansion */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-8 space-y-10">

                      {/* Description */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Description / Observations</label>
                        <textarea 
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-apf-blue transition-all"
                          placeholder="Précisions sur le VPH, les essais ou les documents..."
                        />
                      </div>

                      {/* Documents Section */}
                      <div className="space-y-4">
                        <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-apf-blue" />
                          Documents Techniques obligatoires
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { label: 'Fiche de besoins', key: 'ficheBesoinsPdf' as keyof CpamItem },
                            { label: 'Préconisations', key: 'preconisationPdf' as keyof CpamItem },
                            { label: 'Devis VPH', key: 'devisPdf' as keyof CpamItem },
                          ].map((docItem) => {
                            const isExisting = item[docItem.key];
                            const isCurrentUploading = uploading === `${item.id}-${docItem.key}`;
                            return (
                              <div key={docItem.key} className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-all relative group">
                                <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${isExisting ? 'bg-apf-blue text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-apf-blue group-hover:text-white'}`}>
                                  {isCurrentUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : isExisting ? <FileCheck className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{docItem.label}</span>
                                  {isExisting && (
                                    <a href={item[docItem.key] as string} target="_blank" rel="noreferrer" className="text-[10px] text-apf-blue hover:underline mt-1 font-bold">
                                      VOIR LE PDF
                                    </a>
                                  )}
                                </div>
                                <input 
                                  type="file" 
                                  accept=".pdf"
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(item.id, docItem.key, file);
                                  }}
                                  disabled={!!uploading}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes & Photos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Notes */}
                        <div className="space-y-4">
                          <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-apf-blue" />
                            Commentaires & Étapes (CPAM)
                          </h5>
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                            {item.notes?.map((note, idx) => (
                              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2 text-[10px] font-black text-apf-blue uppercase">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(note.date).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setEditingNote({ itemId: item.id, index: idx, text: note.text })}
                                      className="text-slate-400 hover:text-apf-blue transition-colors"
                                    >
                                      <FileText className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => deleteNote(item, idx)}
                                      className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {editingNote?.itemId === item.id && editingNote?.index === idx ? (
                                  <div className="space-y-2">
                                    <textarea 
                                      value={editingNote.text}
                                      onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                      className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-apf-blue"
                                      autoFocus
                                    />
                                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                                      <button onClick={() => setEditingNote(null)} className="text-slate-400">ANNULER</button>
                                      <button onClick={() => updateNote(item, idx, editingNote.text)} className="text-apf-blue">SAUVEGARDER</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-600 leading-relaxed">{note.text}</p>
                                )}
                              </div>
                            ))}
                            {(!item.notes || item.notes.length === 0) && (
                              <p className="text-sm text-slate-400 italic">Aucun commentaire sur ce dossier.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Étape franchie, appel CPAM..."
                              className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-900"
                              onKeyPress={(e) => e.key === 'Enter' && addNote(item)}
                            />
                            <button 
                              onClick={() => addNote(item)}
                              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-black transition-all"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Photos */}
                        <div className="space-y-4">
                          <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                             <Camera className="w-4 h-4 text-apf-orange" />
                             Photos des essais
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-apf-orange/50 transition-all cursor-pointer relative overflow-hidden group">
                              {uploading === `${item.id}-photos` ? <Loader2 className="w-8 h-8 animate-spin text-apf-orange" /> : (
                                <>
                                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-bold uppercase">Ajouter Photo</span>
                                </>
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(item.id, 'photos', file);
                                }}
                                disabled={!!uploading}
                              />
                            </div>
                            {item.photos?.map((photo, idx) => (
                              <div key={idx} className="aspect-square rounded-2xl bg-slate-200 overflow-hidden relative group">
                                <img src={photo} alt="Wheelchair trial" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => removePhoto(item, photo)}
                                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-6 border-t border-slate-100 flex justify-between gap-3">
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-6 py-2 bg-rose-50 text-rose-500 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Supprimer
                        </button>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => toggleExpanded(item.id)}
                            className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                          >
                            Fermer
                          </button>
                          <button 
                            onClick={handleManualSave}
                            disabled={saving}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${saveSuccess ? 'bg-green-500 text-white' : 'bg-apf-blue text-white hover:bg-apf-blue-dark'}`}
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Enregistrement...' : saveSuccess ? 'Enregistré !' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
