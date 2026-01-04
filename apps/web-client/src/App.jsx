import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuthStore } from './state/authStore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'
import Screening from './pages/Screening'
import Booking from './pages/Booking'
import Chat from './pages/Chat'
import Resources from './pages/Resources'
import Forum from './pages/Forum'
import Groups from './pages/Groups'
import AdminDashboard from './pages/AdminDashboard'

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
    const { isAuthenticated, logout, user } = useAuthStore();

    return (
        <Router>
            <div className="min-h-screen flex flex-col bg-background font-sans text-text">
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 transition-all">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <Link to="/" className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
                            <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">✿</span>
                            MindfulSpace
                        </Link>
                        <nav>
                            {isAuthenticated ? (
                                <div className="flex items-center gap-6">
                                    <Link to="/chat" className="text-text/70 hover:text-primary font-medium transition-colors">AI Chat</Link>
                                    <Link to="/groups" className="text-text/70 hover:text-primary font-medium transition-colors">Groups</Link>
                                    <Link to="/resources" className="text-text/70 hover:text-primary font-medium transition-colors">Resources</Link>
                                    <Link to="/forum" className="text-text/70 hover:text-primary font-medium transition-colors">Forum</Link>
                                    {user?.role === 'admin' && (
                                        <Link to="/admin" className="text-red-500 hover:text-red-700 font-medium transition-colors">Admin</Link>
                                    )}
                                    <div className="h-4 w-px bg-slate-200"></div>
                                    <span className="text-sm text-text/60 font-medium">Hi, {user?.name.split(' ')[0]}</span>
                                    <button
                                        onClick={logout}
                                        className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-4 items-center">
                                    <Link to="/login" className="text-text/70 hover:text-primary font-medium transition-colors">Login</Link>
                                    <Link to="/signup" className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-sm hover:shadow-md font-medium text-sm">Get Started</Link>
                                </div>
                            )}
                        </nav>
                    </div>
                </header>
                <main className="flex-grow container mx-auto px-6 py-8">
                    <Routes>
                        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
                        <Route path="/screening" element={
                            <ProtectedRoute>
                                <Screening />
                            </ProtectedRoute>
                        } />
                        <Route path="/booking" element={
                            <ProtectedRoute>
                                <Booking />
                            </ProtectedRoute>
                        } />
                        <Route path="/chat" element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        } />
                        <Route path="/resources" element={
                            <ProtectedRoute>
                                <Resources />
                            </ProtectedRoute>
                        } />
                        <Route path="/forum" element={
                            <ProtectedRoute>
                                <Forum />
                            </ProtectedRoute>
                        } />
                        <Route path="/groups" element={
                            <ProtectedRoute>
                                <Groups />
                            </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/" element={
                            <ProtectedRoute>
                                <StudentDashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </main>
                <footer className="bg-white border-t border-slate-100 py-8 text-center text-text/40 text-sm mt-auto">
                    <p>&copy; 2023 MindfulSpace. Prioritizing your mental well-being.</p>
                </footer>
            </div>
        </Router>
    )
}

export default App
