import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ClipboardCheck, 
  FileText, 
  Printer, 
  Send, 
  User, 
  Home, 
  Move, 
  Bath, 
  Utensils, 
  Car, 
  Heart, 
  Target,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Save,
  RotateCcw,
  Users,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { ASSESSMENT_DOMAINS, Domain, Question } from '../constants';
import { api } from '../lib/api';

interface AssessmentData {
  [key: string]: {
    value: string;
    comment: string;
  };
}

interface Synthesis {
  functionalSummary: string;
  mainDifficulties: string[];
  preservedCapacities: string[];
  risks: string[];
  limitations: string[];
  restrictions: string[];
  environmentalFactors: string[];
  goals: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  recommendations: {
    technicalAids: string[];
    housingAdaptations: string[];
    referrals: string[];
  };
}

interface AssessmentFormProps {
  patientId: string;
  userId: string;
}

export default function AssessmentForm({ patientId, userId }: AssessmentFormProps) {
  const [formData, setFormData] = useState<AssessmentData>({});
  const [expandedDomains, setExpandedDomains] = useState<string[]>(['general']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzingDocs, setIsAnalyzingDocs] = useState(false);
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [synthesis, setSynthesis] = useState<Synthesis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const synthesisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const data = await api.assessments.list(patientId);
        if (data && data.length > 0) {
          const current = data.find((a: any) => a.assessment_type === 'current') || data[0];
          const parsedData = typeof current.data === 'string' ? JSON.parse(current.data) : current.data;
          setFormData(parsedData.formData || {});
          setSynthesis(parsedData.synthesis || null);
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [patientId]);

  const completedSectionsCount = useMemo(() => {
    return ASSESSMENT_DOMAINS.filter(domain => {
      return domain.questions.some(q => {
        const data = formData[q.id];
        return data && (data.value?.trim() || data.comment?.trim());
      });
    }).length;
  }, [formData]);

  const progressPercentage = Math.round((completedSectionsCount / ASSESSMENT_DOMAINS.length) * 100);

  const isSectionDone = (domainId: string) => {
    const domain = ASSESSMENT_DOMAINS.find(d => d.id === domainId);
    if (!domain) return false;
    return domain.questions.some(q => {
      const data = formData[q.id];
      return data && (data.value?.trim() || data.comment?.trim());
    });
  };

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleInputChange = (questionId: string, value: string, isComment = false) => {
    const newData = {
      ...formData,
      [questionId]: {
        ...formData[questionId],
        [isComment ? 'comment' : 'value']: value
      }
    };
    setFormData(newData);
    saveData(newData, synthesis);
  };

  const saveData = async (data: AssessmentData, synth: Synthesis | null) => {
    try {
      await api.assessments.save(patientId, 'current', {
        formData: data,
        synthesis: synth
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleManualSave = () => {
    saveData(formData, synthesis);
    showToast("Données sauvegardées !");
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setFormData({});
    setSynthesis(null);
    saveData({}, null);
    setShowResetConfirm(false);
    showToast("Formulaire réinitialisé");
  };

  const cleanJsonString = (str: string) => {
    try {
      const firstBrace = str.indexOf('{');
      const lastBrace = str.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return str.substring(firstBrace, lastBrace + 1);
      }
    } catch (e) {}
    return str.replace(/```json\n?|```/g, '').trim();
  };

  const generateSynthesis = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `
        En tant qu'expert ergothérapeute, analyse les données d'évaluation suivantes recueillies au domicile d'un patient.
        DONNÉES : ${JSON.stringify(formData, null, 2)}
        Génère une synthèse ergothérapique structurée au format JSON.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const cleanedText = cleanJsonString(response.text || '{}');
      const result = JSON.parse(cleanedText);
      setSynthesis(result);
      saveData(formData, result);
      
      setTimeout(() => {
        synthesisRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError("Erreur lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoFill = async (files: FileList | null, pastedText: string) => {
    if ((!files || files.length === 0) && !pastedText.trim()) {
      showToast("Veuillez fournir un document ou du texte.", "error");
      return;
    }

    setIsAnalyzingDocs(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
        Tu es un assistant expert pour ergothérapeute. Analyse les documents fournis (comptes-rendus, notes, etc.) 
        et extrais les informations pour remplir un formulaire d'évaluation ergothérapique structuré.
        
        Voici la liste des questions (ID et Libellé) attendues :
        ${ASSESSMENT_DOMAINS.map(d => d.questions.map(q => `- ID: ${q.id}, Label: ${q.label}`).join('\n')).join('\n')}
        
        Pour chaque question, détermine :
        1. La valeur (Oui/Non pour type yes_no, ou Facile/Moyen/Difficile/Impossible/NC pour type difficulty).
        2. Un commentaire explicatif basé sur les documents.
        
        Réponds UNIQUEMENT par un objet JSON au format suivant :
        {
          "question_id": { "value": "valeur_trouvée", "comment": "commentaire_extrait" }
        }
        
        Si une information n'est pas trouvée pour une question précise, ne l'inclus pas dans le JSON.
        Sois précis et professionnel dans les commentaires.
      `;

      const parts: any[] = [{ text: prompt }];

      if (pastedText.trim()) {
        parts.push({ text: `TEXTE COPIÉ :\n${pastedText}` });
      }

      if (files) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.size > 10 * 1024 * 1024) {
            showToast(`Le fichier ${file.name} est trop volumineux.`, "error");
            continue;
          }
          const base64 = await fileToBase64(file);
          parts.push({
            inlineData: {
              data: base64,
              mimeType: file.type || 'application/pdf'
            }
          });
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ parts }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || '';
      if (!responseText) throw new Error("Réponse vide de l'IA");
      
      const result = JSON.parse(cleanJsonString(responseText));
      const newFormData = { ...formData, ...result };
      setFormData(newFormData);
      saveData(newFormData, synthesis);
      setShowAutoFillModal(false);
      showToast("Formulaire pré-rempli !");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'analyse.", "error");
    } finally {
      setIsAnalyzingDocs(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getDomainIcon = (id: string) => {
    switch (id) {
      case 'general': return <User className="w-5 h-5" />;
      case 'housing': return <Home className="w-5 h-5" />;
      case 'indoor_mobility':
      case 'outdoor_mobility': return <Move className="w-5 h-5" />;
      case 'hygiene': return <Bath className="w-5 h-5" />;
      case 'meals': return <Utensils className="w-5 h-5" />;
      case 'driving': return <Car className="w-5 h-5" />;
      case 'leisure':
      case 'social_life': return <Heart className="w-5 h-5" />;
      case 'intimacy_parenting': return <Users className="w-5 h-5" />;
      case 'life_project': return <Target className="w-5 h-5" />;
      default: return <ClipboardCheck className="w-5 h-5" />;
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2" /> Chargement...</div>;

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      {/* ProgressBar */}
      <div className="sticky top-16 z-30 print:hidden bg-white/10 backdrop-blur pb-4 pt-2 -mx-4 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="bg-apf-blue h-full"
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Progression</span>
            <span className="text-[10px] text-apf-blue-dark font-black">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Form Content */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-2 print:hidden">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAutoFillModal(true)}
                className="flex items-center gap-2 bg-apf-blue/10 text-apf-blue-dark px-4 py-2 rounded-xl text-sm font-bold border border-apf-blue/20 hover:bg-apf-blue/20 transition-all"
              >
                <FileText className="w-4 h-4" />
                Auto-remplissage IA
              </button>
            </div>
            <div className="flex gap-2">
               <button onClick={handleReset} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><RotateCcw className="w-5 h-5" /></button>
               <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-apf-blue transition-colors"><Printer className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="space-y-4">
            {ASSESSMENT_DOMAINS.map((domain) => (
              <div key={domain.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden scroll-mt-32">
                <button 
                  onClick={() => toggleDomain(domain.id)}
                  className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${expandedDomains.includes(domain.id) ? 'bg-apf-blue/5' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSectionDone(domain.id) ? 'bg-apf-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {domain.num}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-800 leading-tight">{domain.title}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{domain.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-apf-blue opacity-50">{getDomainIcon(domain.id)}</span>
                    {expandedDomains.includes(domain.id) ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedDomains.includes(domain.id) && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-6 space-y-8">
                        {domain.questions.map((q) => (
                          <div key={q.id} className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">{q.label}</label>
                            
                            <div className="flex flex-wrap gap-2">
                              {q.type === 'yes_no' && (
                                ['Oui', 'Non', 'NC'].map(v => (
                                  <button 
                                    key={v}
                                    onClick={() => handleInputChange(q.id, v)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${formData[q.id]?.value === v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                                  >
                                    {v}
                                  </button>
                                ))
                              )}
                              {q.type === 'difficulty' && (
                                ['Facile', 'Moyen', 'Difficile', 'Impossible', 'NC'].map(v => (
                                  <button 
                                    key={v}
                                    onClick={() => handleInputChange(q.id, v)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${formData[q.id]?.value === v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
                                  >
                                    {v}
                                  </button>
                                ))
                              )}
                            </div>

                            <textarea 
                              placeholder="Notes et observations cliniques..."
                              value={formData[q.id]?.comment || (q.type === 'text' ? formData[q.id]?.value : '') || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value, q.type !== 'text')}
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-apf-blue outline-none min-h-[80px] shadow-inner"
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Synthesis Side */}
        <div className="xl:w-1/3 xl:sticky xl:top-32 h-fit space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <ClipboardCheck className="text-apf-orange w-6 h-6" />
              Synthèse IA
            </h3>
            <p className="text-sm text-slate-500">Générez une synthèse professionnelle basée sur vos observations.</p>
            
            <button 
              onClick={generateSynthesis}
              disabled={isGenerating || progressPercentage < 20}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Générer la synthèse
            </button>
            
            {progressPercentage < 20 && <p className="text-[10px] text-apf-orange-dark font-bold text-center">Remplissez au moins 20% pour générer la synthèse.</p>}
          </div>

          <AnimatePresence>
            {synthesis && (
              <motion.div 
                ref={synthesisRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border-2 border-apf-orange p-8 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setSynthesis(null)} className="text-slate-300 hover:text-slate-500"><RotateCcw className="w-4 h-4" /></button>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-6">Synthèse Clinique</h4>
                <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  <div className="bg-apf-orange/5 rounded-2xl p-4 border border-apf-orange/10">
                    <p className="font-bold text-apf-orange-dark mb-2">Résumé Fonctionnel</p>
                    {synthesis.functionalSummary}
                  </div>
                  {/* ... other synthesis sections ... */}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center text-rose-600">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Réinitialiser ?</h3>
                <p className="text-slate-500 text-sm">Toute la saisie de cette évaluation sera effacée définitivement.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmReset}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AutoFill Modal */}
      <AnimatePresence>
        {showAutoFillModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800">Auto-remplissage IA</h3>
                  <p className="text-slate-500 text-sm">Importez des documents (PDF, rapports) ou collez du texte.</p>
                </div>
                <button onClick={() => setShowAutoFillModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <RotateCcw className="w-5 h-5 text-slate-400 rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-apf-blue transition-colors group relative">
                  <input 
                    type="file" 
                    multiple 
                    accept="application/pdf,image/*,text/plain"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleAutoFill(files, "");
                      }
                    }}
                    disabled={isAnalyzingDocs}
                  />
                  <div className="bg-apf-blue/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="text-apf-blue w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">Cliquez pour importer des fichiers</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, Comptes-rendus, notes de visite...</p>
                </div>

                <div className="flex items-center gap-4 text-slate-300">
                  <div className="h-px bg-slate-100 flex-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white px-2">Ou</span>
                  <div className="h-px bg-slate-100 flex-1" />
                </div>

                <textarea 
                  id="pastedText"
                  placeholder="Collez ici le contenu d'un compte-rendu ou des notes cliniques..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-apf-blue outline-none min-h-[120px] shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAutoFillModal(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                  disabled={isAnalyzingDocs}
                >
                  Annuler
                </button>
                <button 
                  onClick={() => {
                    const text = (document.getElementById('pastedText') as HTMLTextAreaElement).value;
                    handleAutoFill(null, text);
                  }}
                  disabled={isAnalyzingDocs}
                  className="flex-[2] flex items-center justify-center gap-2 bg-apf-blue hover:bg-apf-blue-dark disabled:bg-slate-200 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-apf-blue/20"
                >
                  {isAnalyzingDocs ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Lancer l'analyse</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`px-6 py-3 rounded-full shadow-lg text-white text-sm font-bold flex items-center gap-2 ${toast.type === 'success' ? 'bg-slate-800' : 'bg-rose-600'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-apf-orange" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function handlePrint() {
  window.print();
}
