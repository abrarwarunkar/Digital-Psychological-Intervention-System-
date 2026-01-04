import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import api from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student',
        consentGiven: false,
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (!formData.consentGiven) {
            return setError('You must agree to the data collection policy');
        }

        try {
            const response = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                consentGiven: formData.consentGiven,
            });

            const { accessToken, refreshToken, ...user } = response.data;
            login(user, accessToken, refreshToken);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-slate-50 py-12">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">Create Account</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                        >
                            <option value="student">Student</option>
                            <option value="counsellor">Counsellor</option>
                        </select>
                    </div>

                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <input
                                id="consent"
                                name="consentGiven"
                                type="checkbox"
                                checked={formData.consentGiven}
                                onChange={handleChange}
                                className="focus:ring-primary h-4 w-4 text-primary border-slate-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="consent" className="font-medium text-slate-700">
                                I agree to the data collection and privacy policy.
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-teal-800 transition-colors"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-slate-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
