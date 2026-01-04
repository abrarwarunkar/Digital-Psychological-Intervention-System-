import { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState(null);
    const [flaggedPosts, setFlaggedPosts] = useState([]);
    const [escalations, setEscalations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, content

    // Form States
    const [resourceForm, setResourceForm] = useState({ title: '', description: '', category: 'General', url: '', type: 'article' });
    const [postForm, setPostForm] = useState({ title: '', content: '', category: 'General' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, flaggedRes, insightsRes, escalationsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/moderation'),
                api.get('/admin/insights'),
                api.get('/escalations')
            ]);
            setStats(statsRes.data);
            setFlaggedPosts(flaggedRes.data);
            setInsights(insightsRes.data);
            setEscalations(escalationsRes.data.filter(e => e.status !== 'resolved'));
        } catch (error) {
            console.error('Failed to fetch admin data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/moderation/${id}`);
            setFlaggedPosts(prev => prev.filter(post => post._id !== id));
        } catch (error) {
            console.error('Failed to delete post', error);
            alert('Failed to delete post');
        }
    };

    const handleResolveEscalation = async (id) => {
        try {
            await api.put(`/escalations/${id}`, { status: 'resolved' });
            setEscalations(prev => prev.filter(e => e._id !== id));
            alert('Alert marked as resolved.');
        } catch (error) {
            console.error('Failed to resolve escalation', error);
            alert('Failed to resolve alert');
        }
    };

    const handleCreateResource = async (e) => {
        e.preventDefault();
        try {
            await api.post('/resources', resourceForm);
            alert('Resource created successfully!');
            setResourceForm({ title: '', description: '', category: 'General', url: '', type: 'article' });
        } catch (error) {
            console.error(error);
            alert('Failed to create resource');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await api.post('/forum', { ...postForm, isAnonymous: false });
            alert('Forum post created successfully!');
            setPostForm({ title: '', content: '', category: 'General' });
        } catch (error) {
            console.error(error);
            alert('Failed to create post');
        }
    };

    if (loading) return <div className="text-center py-10">Loading admin dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-100">
                <h2 className="text-2xl font-bold text-text">Admin Dashboard</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-primary text-white shadow-md' : 'bg-white text-text/60 hover:bg-slate-50'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('content')}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-primary text-white shadow-md' : 'bg-white text-text/60 hover:bg-slate-50'}`}
                    >
                        Content Management
                    </button>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="space-y-8">
                    {/* High Risk Alerts */}
                    {escalations.length > 0 && (
                        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm animate-pulse-slow">
                            <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                                <span>🚨</span> High Risk Alerts ({escalations.length})
                            </h3>
                            <div className="space-y-3">
                                {escalations.map(alert => (
                                    <div key={alert._id} className="bg-white p-4 rounded-xl border border-red-100 flex justify-between items-center shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-text text-lg">{alert.userId?.name || 'Unknown User'}</span>
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{alert.riskLevel}</span>
                                            </div>
                                            <p className="text-text/70 text-sm">{alert.reason}</p>
                                            <p className="text-text/40 text-xs mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                                        </div>
                                        <button
                                            onClick={() => handleResolveEscalation(alert._id)}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-all shadow-md hover:shadow-lg"
                                        >
                                            Resolve
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-4xl mb-2">👥</div>
                            <h3 className="text-text/60 font-bold text-sm uppercase tracking-wider">Total Users</h3>
                            <p className="text-3xl font-bold text-text mt-1">{stats?.totalUsers || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-4xl mb-2">📝</div>
                            <h3 className="text-text/60 font-bold text-sm uppercase tracking-wider">Screenings</h3>
                            <p className="text-3xl font-bold text-text mt-1">{stats?.totalScreenings || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-4xl mb-2">📅</div>
                            <h3 className="text-text/60 font-bold text-sm uppercase tracking-wider">Appointments</h3>
                            <p className="text-3xl font-bold text-text mt-1">{stats?.totalBookings || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="text-4xl mb-2">🚩</div>
                            <h3 className="text-text/60 font-bold text-sm uppercase tracking-wider">Flagged Posts</h3>
                            <p className="text-3xl font-bold text-red-500 mt-1">{flaggedPosts.length}</p>
                        </div>
                    </div>

                    {/* ML Insights */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                            <span className="text-secondary">🧠</span> AI Insights
                        </h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-text mb-4">Risk Trends</h4>
                                <div className="space-y-3">
                                    {insights?.riskTrends ? (
                                        Object.entries(insights.riskTrends).map(([level, count]) => (
                                            <div key={level} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                                <span className="capitalize font-medium text-text">{level}</span>
                                                <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">{count}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-text/40 italic">No trend data available</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-text mb-4">Common Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {insights?.keywordAnalysis ? (
                                        insights.keywordAnalysis.map((kw, idx) => (
                                            <span key={idx} className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-bold">
                                                {kw._id} ({kw.count})
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-text/40 italic">No keyword data available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Moderation Queue */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6 flex items-center gap-2">
                            <span className="text-red-500">🛡️</span> Moderation Queue
                        </h3>
                        {flaggedPosts.length > 0 ? (
                            <div className="space-y-4">
                                {flaggedPosts.map(post => (
                                    <div key={post._id} className="p-4 bg-red-50 border border-red-100 rounded-xl flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-red-900">{post.title}</h4>
                                            <p className="text-red-800/80 mt-1 text-sm">{post.content}</p>
                                            <div className="mt-2 text-xs font-bold text-red-700 uppercase tracking-wider">
                                                Flags: {post.flags}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(post._id)}
                                            className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors shadow-sm border border-red-200"
                                        >
                                            Delete Post
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-green-50 rounded-xl border border-green-100">
                                <p className="text-green-800 font-medium">All clear! No flagged posts.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Add Resource Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6">Add New Resource</h3>
                        <form onSubmit={handleCreateResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={resourceForm.title}
                                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Description</label>
                                <textarea
                                    value={resourceForm.description}
                                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text/70 mb-1.5">Category</label>
                                    <select
                                        value={resourceForm.category}
                                        onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                                    >
                                        <option value="General">General</option>
                                        <option value="Anxiety">Anxiety</option>
                                        <option value="Depression">Depression</option>
                                        <option value="Academic Stress">Academic Stress</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text/70 mb-1.5">Type</label>
                                    <select
                                        value={resourceForm.type}
                                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                                    >
                                        <option value="article">Article</option>
                                        <option value="video">Video</option>
                                        <option value="helpline">Helpline</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">URL</label>
                                <input
                                    type="url"
                                    value={resourceForm.url}
                                    onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-3 rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg mt-4">
                                Add Resource
                            </button>
                        </form>
                    </div>

                    {/* Add Forum Post Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-text mb-6">Create Official Post</h3>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={postForm.title}
                                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Category</label>
                                <select
                                    value={postForm.category}
                                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                                >
                                    <option value="General">General</option>
                                    <option value="Anxiety">Anxiety</option>
                                    <option value="Depression">Depression</option>
                                    <option value="Academic Stress">Academic Stress</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Content</label>
                                <textarea
                                    value={postForm.content}
                                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    rows="4"
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-secondary text-white py-3 rounded-full font-bold hover:bg-secondary/90 transition-all shadow-md hover:shadow-lg mt-4">
                                Post Announcement
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
