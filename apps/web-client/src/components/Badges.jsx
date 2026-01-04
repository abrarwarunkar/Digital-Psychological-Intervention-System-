import { useState, useEffect } from 'react';
import api from '../services/api';

const BADGE_INFO = {
    'first_step': { label: 'First Step', icon: '🌱', description: 'Completed your first challenge' },
    'streak_3': { label: 'On Fire', icon: '🔥', description: '3-day streak' },
    'streak_7': { label: 'Unstoppable', icon: '🚀', description: '7-day streak' },
    'mood_master': { label: 'Mood Master', icon: '🧘', description: 'Logged mood 10 times' }
};

const Badges = () => {
    const [progress, setProgress] = useState(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await api.get('/gamification/progress');
                setProgress(res.data);
            } catch (error) {
                console.error('Failed to fetch progress', error);
            }
        };
        fetchProgress();
    }, []);

    if (!progress) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-text flex items-center gap-2">
                    <span className="text-secondary">🏆</span> Achievements
                </h3>
                <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {progress.points} Points
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(BADGE_INFO).map(([id, info]) => {
                    const hasBadge = progress.badges.includes(id);
                    return (
                        <div
                            key={id}
                            className={`p-4 rounded-xl border text-center transition-all ${hasBadge
                                    ? 'bg-yellow-50 border-yellow-200 shadow-sm'
                                    : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                                }`}
                        >
                            <div className="text-3xl mb-2">{info.icon}</div>
                            <h4 className="font-bold text-sm text-text">{info.label}</h4>
                            <p className="text-xs text-text/60 mt-1">{info.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Badges;
