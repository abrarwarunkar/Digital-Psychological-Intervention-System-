import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../state/authStore';
import ResourceRecommendation from '../components/ResourceRecommendation';
import MoodTracker from '../components/MoodTracker';
import Challenges from '../components/Challenges';
import Badges from '../components/Badges';

const StudentDashboard = () => {
    const { user } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, bookingsRes] = await Promise.all([
                    api.get('/screening/user'),
                    api.get('/bookings')
                ]);
                setHistory(historyRes.data);
                setBookings(bookingsRes.data);
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getRiskColor = (level) => {
        switch (level) {
            case 'none': return 'bg-green-100 text-green-800';
            case 'mild': return 'bg-yellow-100 text-yellow-800';
            case 'moderate': return 'bg-orange-100 text-orange-800';
            case 'moderately severe': return 'bg-red-100 text-red-800';
            case 'severe': return 'bg-red-200 text-red-900';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8 rounded-2xl border border-primary/5">
                <h2 className="text-3xl font-bold text-text mb-2">Welcome back, {user?.name}</h2>
                <p className="text-text/70 text-lg">How are you feeling today?</p>

                <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                        to="/screening"
                        className="bg-primary text-white px-8 py-3 rounded-full hover:bg-primary/90 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        Take a Screening
                    </Link>
                    <Link
                        to="/booking"
                        className="bg-white text-primary border border-primary/20 px-8 py-3 rounded-full hover:bg-primary/5 transition-all font-medium shadow-sm"
                    >
                        Book Appointment
                    </Link>
                    <Link
                        to="/chat"
                        className="bg-secondary text-white px-8 py-3 rounded-full hover:bg-secondary/90 transition-all shadow-md hover:shadow-lg font-medium"
                    >
                        Chat with AI
                    </Link>
                    <Link
                        to="/resources"
                        className="text-text/70 px-8 py-3 rounded-full hover:bg-white/50 transition-all font-medium"
                    >
                        Browse Resources
                    </Link>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Daily Challenges */}
                    <Challenges />

                    {/* Upcoming Appointments */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                            <span className="text-secondary">📅</span> Upcoming Appointments
                        </h3>
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                                <div className="h-16 bg-slate-100 rounded-xl"></div>
                            </div>
                        ) : bookings.length > 0 ? (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <div key={booking._id} className="p-4 bg-background rounded-xl border border-slate-100 flex justify-between items-center hover:border-primary/20 transition-colors">
                                        <div>
                                            <p className="font-bold text-text">
                                                {new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-sm text-text/60">{booking.timeSlot} with {booking.counsellorId?.name}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Confirmed</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-background rounded-xl border border-dashed border-slate-200">
                                <p className="text-text/50">No upcoming appointments.</p>
                                <Link to="/booking" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">Book one now</Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Screenings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                            <span className="text-secondary">📋</span> Recent Screenings
                        </h3>
                        {loading ? (
                            <p className="text-text/50">Loading history...</p>
                        ) : history.length > 0 ? (
                            <div className="space-y-4">
                                {history.slice(0, 3).map((result) => (
                                    <div key={result._id} className="flex justify-between items-center p-4 bg-background rounded-xl border border-slate-100">
                                        <div>
                                            <span className="font-bold text-text block">{result.type}</span>
                                            <span className="text-text/50 text-sm">
                                                {new Date(result.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getRiskColor(result.riskLevel)}`}>
                                            {result.riskLevel}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-background rounded-xl border border-dashed border-slate-200">
                                <p className="text-text/50">No screening history found.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <MoodTracker />
                    <Badges />
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <ResourceRecommendation context="dashboard" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
