import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import api from '../services/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const MOODS = [
    { value: 1, emoji: '😢', label: 'Very Low' },
    { value: 2, emoji: '😐', label: 'Low' },
    { value: 3, emoji: '🙂', label: 'Okay' },
    { value: 4, emoji: '😀', label: 'Good' },
    { value: 5, emoji: '🤩', label: 'Great' }
];

const MoodTracker = () => {
    const [history, setHistory] = useState([]);
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/mood/history');
            setHistory(res.data);
        } catch (error) {
            console.error('Failed to fetch mood history', error);
        }
    };

    const handleLogMood = async () => {
        if (!selectedMood) return;
        setSubmitting(true);
        try {
            await api.post('/mood', { mood: selectedMood, note });
            await fetchHistory();
            setSelectedMood(null);
            setNote('');
        } catch (error) {
            console.error('Failed to log mood', error);
            alert('Failed to log mood');
        } finally {
            setSubmitting(false);
        }
    };

    const chartData = {
        labels: history.map(entry => new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Mood Trend',
                data: history.map(entry => entry.mood),
                borderColor: 'rgb(13, 148, 136)',
                backgroundColor: 'rgba(13, 148, 136, 0.5)',
                tension: 0.3
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                min: 1,
                max: 5,
                ticks: {
                    stepSize: 1,
                    callback: (value) => MOODS.find(m => m.value === value)?.emoji || value
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                <span className="text-secondary">💭</span> Mood Tracker
            </h3>

            {/* Input Section */}
            <div className="mb-8">
                <p className="text-sm text-text/60 mb-4 font-medium">How are you feeling today?</p>
                <div className="flex justify-between max-w-xs mb-6 mx-auto">
                    {MOODS.map(m => (
                        <button
                            key={m.value}
                            onClick={() => setSelectedMood(m.value)}
                            className={`text-4xl transition-all duration-300 hover:scale-110 p-2 rounded-full ${selectedMood === m.value ? 'scale-125 bg-primary/10' : 'opacity-60 hover:opacity-100 hover:bg-slate-50'}`}
                            title={m.label}
                        >
                            {m.emoji}
                        </button>
                    ))}
                </div>

                {selectedMood && (
                    <div className="space-y-4 animate-fade-in">
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="What's on your mind? (optional)"
                            className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none bg-background"
                            rows="3"
                        />
                        <button
                            onClick={handleLogMood}
                            disabled={submitting}
                            className="w-full bg-primary text-white py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:shadow-none"
                        >
                            {submitting ? 'Logging...' : 'Log Mood'}
                        </button>
                    </div>
                )}
            </div>

            {/* Chart Section */}
            {history.length > 0 ? (
                <div className="h-48">
                    <Line data={chartData} options={chartOptions} />
                </div>
            ) : (
                <div className="text-center py-8 text-text/40 text-sm bg-background rounded-xl border border-dashed border-slate-200">
                    No mood data yet. Start logging!
                </div>
            )}
        </div>
    );
};

export default MoodTracker;
