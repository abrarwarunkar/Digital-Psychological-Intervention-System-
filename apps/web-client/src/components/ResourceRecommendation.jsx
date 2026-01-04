import { useState, useEffect } from 'react';
import { Star, ThumbsUp, Clock, ArrowRight } from 'lucide-react';
import api from '../services/api';

const ResourceRecommendation = ({ context = 'dashboard' }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackGiven, setFeedbackGiven] = useState({});

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await api.get(`/recommendations?context=${context}&limit=3`);
                setRecommendations(response.data.recommendations);
            } catch (error) {
                console.error('Failed to fetch recommendations', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [context]);

    const handleFeedback = async (resourceId, action, rating = null) => {
        try {
            await api.post('/recommendations/feedback', {
                resourceId,
                action,
                rating,
                context
            });

            setFeedbackGiven(prev => ({
                ...prev,
                [resourceId]: true
            }));

        } catch (error) {
            console.error('Failed to send feedback', error);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-48 bg-slate-100 rounded-xl"></div>
                <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
        );
    }

    if (recommendations.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    Recommended for You
                </h3>
                <span className="text-sm text-slate-500">Based on your recent activity</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                    <div
                        key={rec.resourceId}
                        className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                                    {rec.category}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 5 min
                                </span>
                            </div>

                            <h4 className="font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
                                {rec.title}
                            </h4>

                            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                {rec.description}
                            </p>

                            {rec.reason && (
                                <div className="mb-4 text-xs bg-slate-50 text-slate-600 p-2 rounded border border-slate-100">
                                    💡 {rec.reason}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => handleFeedback(rec.resourceId, 'clicked')}
                                    className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                                >
                                    Read Now <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => handleFeedback(rec.resourceId, 'saved')}
                                    disabled={feedbackGiven[rec.resourceId]}
                                    className={`p-2 rounded-full hover:bg-slate-50 transition-colors ${feedbackGiven[rec.resourceId] ? 'text-teal-500' : 'text-slate-400'
                                        }`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourceRecommendation;
