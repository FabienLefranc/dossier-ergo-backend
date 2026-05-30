import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Box, 
  Home, 
  Car, 
  FileText, 
  FileCheck, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  MessageSquare, 
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

interface Financials {
  totalCost: number;
  mdphRetainedAmount: number;
  pchAmount: number;
  fdcRequested: boolean;
  fdcAmount: number;
  solihaRequested?: boolean;
  solihaAmount?: number;
  otherAids: string;
}

interface PchItem {
  id: string;
  type: 'technical_aid' | 'housing' | 'vehicle' | 'other';
  title: string;
  description: string;
  status: string;
  patientId: string;
  userId: string;
  notes: Note[];
  photos: string[];
  argumentairePdf: string;
  devis1Pdf: string;
  devis2Pdf: string;
  financials: Financials;
}

interface MdphDossierProps {
  patientId: string;
  userId: string;
}

export default function MdphDossier({ patientId, userId }: MdphDossierProps) {
  const [items, setItems] = useState<PchItem[]>([]);
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
      const results = await api.data.get(patientId, 'mdph_items');
      setItems(results || []);
    } catch (error) {
      console.error("Error fetching MDPH items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [patientId, userId]);

  const handleFileUpload = async (itemId: string, field: keyof PchItem, file: File) => {
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
      alert("Fichier envoyé avec succès !");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Erreur lors de l'envoi.");
    } finally {
      setUploading(null);
    }
  };

  const saveItems = async (newItems: PchItem[]) => {
    await api.data.save(patientId, 'mdph_items', newItems);
    setItems(newItems);
  };

  const handleManualSave = async () => {
    setSaving(true);
    try {
      await api.data.save(patientId, 'mdph_items', items);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (type: PchItem['type'], title: string) => {
    const newItem: PchItem = {
      id: Date.now().toString(),
      patientId,
      userId,
      type,
      title,
      description: '',
      status: 'in_progress',
      notes: [],
      photos: [],
      argumentairePdf: '',
      devis1Pdf: '',
      devis2Pdf: '',
      financials: {
        totalCost: 0,
        mdphRetainedAmount: 0,
        pchAmount: 0,
        fdcRequested: false,
        fdcAmount: 0,
        solihaRequested: false,
        solihaAmount: 0,
        otherAids: ''
      }
    };
    await saveItems([newItem, ...items]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<PchItem>) => {
    // Mise à jour locale uniquement — sauvegarde via bouton "Enregistrer"
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  };

  const removePdf = async (itemId: string, field: keyof PchItem) => {
    if (!confirm('Supprimer ce document ?')) return;
    const newItems = items.map(i => i.id === itemId ? { ...i, [field]: '' } : i);
    await saveItems(newItems);
  };

  const removePhoto = async (item: PchItem, photoUrl: string) => {
    const photos = item.photos.filter(p => p !== photoUrl);
    const newItems = items.map(i => i.id === item.id ? { ...i, photos } : i);
    await saveItems(newItems);
  };

  const addNote = async (item: PchItem) => {
    if (!newNote.trim()) return;
    const notes = [...(item.notes || []), { date: new Date().toISOString(), text: newNote }];
    const newItems = items.map(i => i.id === item.id ? { ...i, notes } : i);
    await saveItems(newItems);
    setNewNote('');
  };

  const updateNote = async (item: PchItem, index: number, newText: string) => {
    const notes = [...item.notes];
    notes[index] = { ...notes[index], text: newText };
    const newItems = items.map(i => i.id === item.id ? { ...i, notes } : i);
    await saveItems(newItems);
    setEditingNote(null);
  };

  const deleteNote = async (item: PchItem, index: number) => {
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
    { id: 'technical_aid', title: 'Aides Techniques', icon: <Box />, color: 'bg-blue-500' },
    { id: 'housing', title: 'Logement', icon: <Home />, color: 'bg-amber-500' },
    { id: 'vehicle', title: 'Véhicule', icon: <Car />, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-apf-blue animate-spin" />
        <p className="text-slate-400 font-medium">Chargement du dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Category Selection / Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = items.filter(i => i.type === cat.id).length;
          return (
            <div 
              key={cat.id} 
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all group"
            >
              <div className={`${cat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800">{cat.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{count} élément(s)</p>
              <button 
                onClick={() => handleAddItem(cat.id as any, cat.title)}
                className="mt-4 flex items-center gap-2 text-xs font-bold text-apf-blue hover:underline transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un élément
              </button>
            </div>
          );
        })}
      </div>

      {/* List of Items with Detailed View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-slate-800 italic">Détails de l'accompagnement MDPH</h3>
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
            <p>Aucun élément enregistré. Utilisez les boutons ci-dessus pour commencer.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all">
              {/* Header / Summary Card */}
              <button 
                onClick={() => toggleExpanded(item.id)}
                className={`w-full px-8 py-6 flex items-center justify-between transition-colors ${expandedId === item.id ? 'bg-apf-blue text-white' : 'hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${expandedId === item.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                    {item.type === 'technical_aid' ? <Box /> : item.type === 'housing' ? <Home /> : <Car />}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg leading-none">{item.title}</h4>
                    <div className={`text-xs mt-1 font-medium ${expandedId === item.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {item.status === 'draft' || item.status === 'in_progress' ? 'En cours' : item.status === 'submitted' ? 'Dossier déposé' : item.status === 'completed' ? 'Terminé' : 'En attente'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  {item.financials?.totalCost > 0 && (
                    <div className="hidden sm:block text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimation</div>
                      <div className="font-black text-lg">{item.financials.totalCost} €</div>
                    </div>
                  )}
                  {expandedId === item.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </div>
              </button>

              {/* Expanded Detail Window */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-8 space-y-10">
                      {/* Section Title & Description */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Description de l'aide / Projet</label>
                          <textarea 
                            value={item.description}
                            onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-apf-blue transition-all"
                            placeholder="Décrivez les spécificités de l'aide technique ou des travaux..."
                          />
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Statut du dossier</label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
                                { value: 'pending', label: 'En attente', color: 'bg-amber-500' },
                                { value: 'completed', label: 'Terminé', color: 'bg-green-500' },
                              ].map((s) => (
                                <button
                                  key={s.value}
                                  onClick={() => handleUpdateItem(item.id, { status: s.value })}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                                    (item.status === s.value || (s.value === 'in_progress' && (item.status === 'draft' || !item.status)))
                                      ? `${s.color} text-white shadow-sm`
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                          <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
                            <Euro className="w-4 h-4 text-apf-blue" />
                            Plan de Financement
                          </h5>
                          <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                            {/* Step 1: Coût total */}
                            <div className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-colors ${item.financials?.totalCost > 0 ? 'border-apf-blue' : 'border-slate-300'}`}>
                                <Euro className={`w-3 h-3 ${item.financials?.totalCost > 0 ? 'text-apf-blue' : 'text-slate-300'}`} />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coût Total du Projet</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <input 
                                    type="number" 
                                    value={item.financials?.totalCost || 0}
                                    onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, totalCost: Number(e.target.value) } })}
                                    className="text-lg font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-apf-blue outline-none w-24"
                                  /> €
                                </div>
                              </div>
                            </div>

                            {/* Step 2: Montant MDPH retenu */}
                            <div className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-colors ${item.financials?.mdphRetainedAmount > 0 ? 'border-apf-blue' : 'border-slate-300'}`}>
                                <CheckCircle2 className={`w-3 h-3 ${item.financials?.mdphRetainedAmount > 0 ? 'text-apf-blue' : 'text-slate-300'}`} />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant MDPH Retenu</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <input 
                                    type="number" 
                                    value={item.financials?.mdphRetainedAmount || 0}
                                    onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, mdphRetainedAmount: Number(e.target.value) } })}
                                    className="text-lg font-black text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-apf-blue outline-none w-24"
                                  /> €
                                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Montant sur lequel la PCH sera calculée</p>
                                </div>
                              </div>
                            </div>

                            {/* Step 3: PCH */}
                            <div className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-colors ${item.financials?.pchAmount > 0 ? 'border-apf-blue' : 'border-slate-300'}`}>
                                <CheckCircle2 className={`w-3 h-3 ${item.financials?.pchAmount > 0 ? 'text-apf-blue' : 'text-slate-300'}`} />
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aide PCH Notifiée</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <input 
                                      type="number" 
                                      value={item.financials?.pchAmount || 0}
                                      onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, pchAmount: Number(e.target.value) } })}
                                      className="text-lg font-black text-apf-blue bg-transparent border-b border-dashed border-slate-300 focus:border-apf-blue outline-none w-24"
                                    /> €
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Step 4: SOLIHA (Housing only) */}
                            {item.type === 'housing' && (
                              <div className="relative pl-10">
                                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-colors ${item.financials?.solihaRequested ? 'border-emerald-500' : 'border-slate-300'}`}>
                                  <Home className={`w-3 h-3 ${item.financials?.solihaRequested ? 'text-emerald-500' : 'text-slate-300'}`} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SOLIHA / Prim'Adapt</div>
                                    <button 
                                      onClick={() => handleUpdateItem(item.id, { financials: { ...item.financials, solihaRequested: !item.financials?.solihaRequested } })}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.financials?.solihaRequested ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}
                                    >
                                      {item.financials?.solihaRequested ? 'DEMANDÉ' : 'À DEMANDER'}
                                    </button>
                                  </div>
                                  {item.financials?.solihaRequested && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        value={item.financials?.solihaAmount || 0}
                                        onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, solihaAmount: Number(e.target.value) } })}
                                        className="text-lg font-black text-emerald-600 bg-transparent border-b border-dashed border-slate-300 focus:border-apf-blue outline-none w-24"
                                      /> €
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Step 5: FDC */}
                            <div className="relative pl-10">
                              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center transition-colors ${item.financials?.fdcRequested ? 'border-apf-orange' : 'border-slate-300'}`}>
                                <FileText className={`w-3 h-3 ${item.financials?.fdcRequested ? 'text-apf-orange' : 'text-slate-300'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Droit au FDC</div>
                                  <button 
                                    onClick={() => handleUpdateItem(item.id, { financials: { ...item.financials, fdcRequested: !item.financials?.fdcRequested } })}
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.financials?.fdcRequested ? 'bg-apf-orange text-white' : 'bg-slate-200 text-slate-400'}`}
                                  >
                                    {item.financials?.fdcRequested ? 'DEMANDÉ' : 'À DEMANDER'}
                                  </button>
                                </div>
                                {item.financials?.fdcRequested && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <input 
                                      type="number" 
                                      value={item.financials?.fdcAmount || 0}
                                      onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, fdcAmount: Number(e.target.value) } })}
                                      className="text-lg font-black text-apf-orange-dark bg-transparent border-b border-dashed border-slate-300 focus:border-apf-blue outline-none w-24"
                                    /> €
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Step 6: Reste à charge */}
                            <div className="relative pl-10">
                              <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center">
                                <AlertCircle className="w-3 h-3 text-white" />
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reste à charge (RAC)</div>
                                <div className="text-2xl font-black text-slate-900">
                                  {Math.max(0, 
                                    (item.financials?.totalCost || 0) - 
                                    (item.financials?.pchAmount || 0) - 
                                    (item.financials?.fdcAmount || 0) - 
                                    (item.financials?.solihaAmount || 0)
                                  ).toFixed(2)} €
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                  <div className="text-[9px] font-bold text-slate-400 uppercase mb-2 italic">Autres aides à solliciter ?</div>
                                  <textarea 
                                    value={item.financials?.otherAids || ''}
                                    onChange={(e) => handleUpdateItem(item.id, { financials: { ...item.financials, otherAids: e.target.value } })}
                                    className="w-full p-2 bg-slate-50 rounded-lg text-xs outline-none min-h-[50px] resize-none"
                                    placeholder="Ex: Mutuelle, CPAM (Secu), Mairies..."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Documents (PDF) Section */}
                      <div className="space-y-4">
                        <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-apf-blue" />
                          Documents & Justificatifs (PDF)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { label: 'Argumentaire Ergo', key: 'argumentairePdf' as keyof PchItem, color: 'border-apf-blue' },
                            { label: 'Devis n°1', key: 'devis1Pdf' as keyof PchItem, color: 'border-slate-200' },
                            { label: 'Devis n°2', key: 'devis2Pdf' as keyof PchItem, color: 'border-slate-200' },
                          ].map((docItem) => {
                            const isExisting = item[docItem.key];
                            const isCurrentUploading = uploading === `${item.id}-${docItem.key}`;
                            return (
                              <div key={docItem.key} className={`border-2 border-dashed ${docItem.color} rounded-2xl p-6 text-center hover:bg-slate-50 transition-all cursor-pointer relative group`}>
                                <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors ${isExisting ? 'bg-apf-blue text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-apf-blue group-hover:text-white'}`}>
                                  {isCurrentUploading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                  ) : isExisting ? (
                                    <FileCheck className="w-6 h-6" />
                                  ) : (
                                    <FileText className="w-6 h-6" />
                                  )}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{docItem.label}</span>
                                  {isExisting && (
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                      <a 
                                        href={item[docItem.key] as string} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-[10px] text-apf-blue hover:underline font-bold"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        VOIR LE DOCUMENT
                                      </a>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); removePdf(item.id, docItem.key); }}
                                        className="text-[10px] text-rose-500 hover:underline font-bold flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" /> SUPPRIMER
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <input 
                                  type="file" 
                                  accept=".pdf"
                                  className={`absolute inset-0 opacity-0 ${isExisting ? 'hidden' : 'cursor-pointer'}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(item.id, docItem.key, file);
                                  }}
                                  disabled={!!uploading || !!isExisting}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes & Photos Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Timeline / Notes */}
                        <div className="space-y-4">
                          <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-4 h-4 text-apf-blue" />
                            Historique & Notes
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
                              <p className="text-sm text-slate-400 italic">Aucune note pour le moment.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Ajouter un commentaire..."
                              className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-apf-blue"
                              onKeyPress={(e) => e.key === 'Enter' && addNote(item)}
                            />
                            <button 
                              onClick={() => addNote(item)}
                              className="bg-apf-blue text-white p-3 rounded-xl hover:bg-apf-blue-dark transition-all"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Photos */}
                        <div className="space-y-4">
                          <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                             <Camera className="w-4 h-4 text-apf-orange" />
                             Photos des Aides Techniques
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-apf-orange/50 transition-all cursor-pointer relative overflow-hidden group">
                              {uploading === `${item.id}-photos` ? (
                                <Loader2 className="w-8 h-8 animate-spin text-apf-orange" />
                              ) : (
                                <>
                                  <Camera className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                  <span className="text-[10px] font-bold">AJOUTER PHOTO</span>
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
                                <img src={photo} alt="Technical aid" className="w-full h-full object-cover" />
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
