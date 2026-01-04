import { useState, useEffect } from 'react';
import api from '../services/api';

const Challenges = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const res = await api.get('/gamification/challenges');
            setChallenges(res.data);
        } catch (error) {
            console.error('Failed to fetch challenges', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (challengeId) => {
        try {
            const res = await api.post('/gamification/claim', { challengeId });
            alert(`🎉 +${res.data.pointsAdded} Points! Streak: ${res.data.streak}`);
            fetchChallenges(); // Refresh to update status
            // Optionally trigger a global state update for points
        } catch (error) {
            console.error('Failed to claim challenge', error);
            alert(error.response?.data?.message || 'Failed to claim');
        }
    };

    if (loading) return <div className="text-center py-4 text-text/50">Loading challenges...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <span className="text-secondary">🎯</span> Daily Challenges
            </h3>

            <div className="space-y-4">
                {challenges.map(challenge => (
                    <div
                        key={challenge._id}
                        className={`p-4 rounded-xl border transition-all ${challenge.completed
                                ? 'bg-green-50 border-green-100 opacity-70'
                                : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-sm'
                            }`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className="text-2xl">{challenge.icon}</div>
                                <div>
                                    <h4 className={`font-bold ${challenge.completed ? 'text-green-800' : 'text-text'}`}>
                                        {challenge.title}
                                    </h4>
                                    <p className="text-sm text-text/60 mt-1">{challenge.description}</p>
                                    <div className="mt-2 text-xs font-bold text-primary bg-primary/5 inline-block px-2 py-1 rounded-lg">
                                        +{challenge.points} Points
                                    </div>
                                </div>
                            </div>

                            {challenge.completed ? (
                                <div className="bg-green-100 text-green-600 p-2 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleClaim(challenge._id)}
                                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    Claim
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {challenges.length === 0 && (
                    <div className="text-center py-8 text-text/40">
                        No active challenges right now. Check back tomorrow!
                    </div>
                )}
            </div>
        </div>
    );
};

export default Challenges;
