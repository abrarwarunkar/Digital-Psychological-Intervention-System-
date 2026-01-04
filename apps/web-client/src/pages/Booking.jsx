import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Booking = () => {
    const [counsellors, setCounsellors] = useState([]);
    const [selectedCounsellor, setSelectedCounsellor] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCounsellors = async () => {
            try {
                const response = await api.get('/bookings/counsellors');
                setCounsellors(response.data);
            } catch (error) {
                console.error('Failed to fetch counsellors', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounsellors();
    }, []);

    useEffect(() => {
        if (selectedCounsellor) {
            const fetchAvailability = async () => {
                try {
                    const response = await api.get(`/bookings/availability/${selectedCounsellor._id}`);
                    setAvailability(response.data);
                } catch (error) {
                    console.error('Failed to fetch availability', error);
                }
            };
            fetchAvailability();
        }
    }, [selectedCounsellor]);

    const handleBooking = async (e) => {
        e.preventDefault();
        if (!selectedCounsellor || !selectedDate || !selectedSlot) return;

        setSubmitting(true);
        try {
            await api.post('/bookings', {
                counsellorId: selectedCounsellor._id,
                date: selectedDate,
                timeSlot: selectedSlot,
                notes
            });
            alert('Booking confirmed!');
            navigate('/');
        } catch (error) {
            console.error('Booking failed', error);
            alert(error.response?.data?.message || 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to generate time slots based on availability (simplified)
    const getSlots = () => {
        if (!selectedDate || !availability.length) return [];
        const date = new Date(selectedDate);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'Long' });

        const dayAvail = availability.find(a => a.dayOfWeek === dayName);
        if (!dayAvail) return [];

        // Generate hourly slots for demo purposes
        const slots = [];
        let start = parseInt(dayAvail.startTime.split(':')[0]);
        const end = parseInt(dayAvail.endTime.split(':')[0]);

        for (let i = start; i < end; i++) {
            slots.push(`${i}:00`);
        }
        return slots;
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Book an Appointment</h2>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="font-medium text-slate-700 mb-4">1. Select a Counsellor</h3>
                    {loading ? <p>Loading...</p> : (
                        <div className="space-y-3">
                            {counsellors.map(c => (
                                <div
                                    key={c._id}
                                    onClick={() => setSelectedCounsellor(c)}
                                    className={`p-4 border rounded cursor-pointer transition-all ${selectedCounsellor?._id === c._id
                                            ? 'border-primary bg-teal-50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <p className="font-bold text-slate-800">{c.name}</p>
                                    <p className="text-sm text-slate-600">{c.email}</p>
                                </div>
                            ))}
                            {counsellors.length === 0 && <p className="text-slate-500">No counsellors available.</p>}
                        </div>
                    )}
                </div>

                {selectedCounsellor && (
                    <form onSubmit={handleBooking} className="space-y-6">
                        <div>
                            <h3 className="font-medium text-slate-700 mb-4">2. Select Date & Time</h3>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded mb-4"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />

                            {selectedDate && (
                                <div className="grid grid-cols-3 gap-2">
                                    {getSlots().map(slot => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-2 text-sm rounded border ${selectedSlot === slot
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                    {getSlots().length === 0 && <p className="col-span-3 text-sm text-slate-500">No slots available for this date.</p>}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                            <textarea
                                className="w-full p-2 border border-slate-300 rounded"
                                rows="3"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Anything you'd like the counsellor to know?"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !selectedSlot}
                            className="w-full bg-primary text-white py-3 rounded-md hover:bg-teal-800 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Booking;
