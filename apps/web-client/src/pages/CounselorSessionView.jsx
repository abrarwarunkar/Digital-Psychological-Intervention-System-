import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, AlertTriangle, Activity, Save } from 'lucide-react';
import api from '../services/api';

const CounselorSessionView = () => {
    const { sessionId } = useParams();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // In a real app, we'd check if a summary exists first
                // For demo, we'll generate one on load
                const response = await api.post(`/chat/session/${sessionId || 'current'}/summarize`);
                setSummary(response.data);
            } catch (error) {
                console.error('Failed to fetch summary', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [sessionId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Mock save
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Session notes saved successfully');
        } catch (error) {
            console.error('Failed to save', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!summary) return <div>Failed to load session summary.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Session Summary
                </h2>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {summary.isAiGenerated ? 'AI Generated' : 'Manual'}
                </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Main Summary Column */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">Session Overview</h3>
                        <textarea
                            className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            defaultValue={summary.summary}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-teal-600" />
                            Action Items
                        </h3>
                        <ul className="space-y-2">
                            {summary.actionItems.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span className="text-slate-700">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Risk Level */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">Risk Assessment</h3>
                        <div className={`p-4 rounded-lg border ${summary.riskLevel === 'low' ? 'bg-green-50 border-green-100 text-green-800' :
                                summary.riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-800' :
                                    'bg-red-50 border-red-100 text-red-800'
                            }`}>
                            <div className="flex items-center gap-2 font-bold capitalize">
                                <AlertTriangle className="w-5 h-5" />
                                {summary.riskLevel} Risk
                            </div>
                        </div>
                    </div>

                    {/* Key Concerns */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">Key Concerns</h3>
                        <div className="flex flex-wrap gap-2">
                            {summary.mainConcerns.map((concern, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                                    {concern}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Coping Strategies */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4">Strategies Discussed</h3>
                        <div className="space-y-2">
                            {summary.copingStrategies.map((strategy, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    {strategy}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-teal-800 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CounselorSessionView;
