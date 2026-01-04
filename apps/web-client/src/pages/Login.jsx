import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, refreshToken, ...user } = response.data;

            login(user, accessToken, refreshToken);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-[calc(100vh-100px)] flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-teal-800 transition-colors"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-slate-600">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
