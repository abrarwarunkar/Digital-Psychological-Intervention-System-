import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../state/authStore';

const Groups = () => {
    const { user } = useAuthStore();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discovery'); // discovery, my-groups
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupPosts, setGroupPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', category: 'General', type: 'public' });

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchGroupPosts(selectedGroup._id);
        }
    }, [selectedGroup]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await api.get('/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Failed to fetch groups', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupPosts = async (groupId) => {
        try {
            const res = await api.get(`/groups/${groupId}/posts`);
            setGroupPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch group posts', error);
        }
    };

    const handleJoin = async (groupId) => {
        try {
            await api.post(`/groups/${groupId}/join`);
            fetchGroups(); // Refresh list to update status
            alert('Joined group successfully!');
        } catch (error) {
            console.error('Failed to join group', error);
            alert('Failed to join group');
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            await api.post('/groups', newGroup);
            setShowCreateModal(false);
            setNewGroup({ name: '', description: '', category: 'General', type: 'public' });
            fetchGroups();
            alert('Group created successfully!');
        } catch (error) {
            console.error('Failed to create group', error);
            alert('Failed to create group');
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        try {
            await api.post(`/groups/${selectedGroup._id}/posts`, { content: newPostContent });
            setNewPostContent('');
            fetchGroupPosts(selectedGroup._id);
        } catch (error) {
            console.error('Failed to post', error);
            alert('Failed to post');
        }
    };

    if (loading && !groups.length) return <div className="text-center py-10">Loading groups...</div>;

    if (selectedGroup) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <button onClick={() => setSelectedGroup(null)} className="text-primary hover:underline flex items-center gap-2 mb-4">
                    ← Back to Groups
                </button>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-text flex items-center gap-3">
                                <span className="text-4xl">{selectedGroup.icon}</span> {selectedGroup.name}
                            </h2>
                            <p className="text-text/60 mt-2 text-lg">{selectedGroup.description}</p>
                        </div>
                        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold">
                            {selectedGroup.membersCount} Members
                        </span>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-xl font-bold text-text mb-4">Discussion Board</h3>

                        <form onSubmit={handleCreatePost} className="mb-8">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share something with the group..."
                                className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                                rows="3"
                            />
                            <div className="flex justify-end mt-2">
                                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-full font-bold hover:bg-primary/90 transition-all shadow-md">
                                    Post
                                </button>
                            </div>
                        </form>

                        <div className="space-y-4">
                            {groupPosts.map(post => (
                                <div key={post._id} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-text">{post.userId?.name}</span>
                                        <span className="text-xs text-text/40">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-text/80 leading-relaxed">{post.content}</p>
                                </div>
                            ))}
                            {groupPosts.length === 0 && (
                                <div className="text-center py-8 text-text/40">No posts yet. Start the conversation!</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayedGroups = activeTab === 'discovery'
        ? groups
        : groups.filter(g => g.isJoined);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-6 rounded-2xl border border-slate-100">
                <div>
                    <h2 className="text-2xl font-bold text-text">Peer Support Groups</h2>
                    <p className="text-text/60 text-sm">Find your community and share your journey</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                >
                    + Create Group
                </button>
            </div>

            <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-full w-fit">
                <button
                    onClick={() => setActiveTab('discovery')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'discovery' ? 'bg-white text-primary shadow-sm' : 'text-text/60 hover:text-text'}`}
                >
                    Discover Groups
                </button>
                <button
                    onClick={() => setActiveTab('my-groups')}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'my-groups' ? 'bg-white text-primary shadow-sm' : 'text-text/60 hover:text-text'}`}
                >
                    My Groups
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedGroups.map(group => (
                    <div key={group._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-primary/30 transition-all hover:shadow-md group">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-4xl bg-slate-50 p-3 rounded-xl">{group.icon}</span>
                            <span className="bg-slate-100 text-text/60 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {group.category}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors">{group.name}</h3>
                        <p className="text-text/60 text-sm mb-6 line-clamp-2">{group.description}</p>

                        <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-text/40 font-medium">{group.membersCount} Members</span>
                            {group.isJoined ? (
                                <button
                                    onClick={() => setSelectedGroup(group)}
                                    className="bg-secondary text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-secondary/90 transition-all shadow-sm"
                                >
                                    View Group
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleJoin(group._id)}
                                    className="bg-white text-primary border border-primary/20 px-6 py-2 rounded-full text-sm font-bold hover:bg-primary/5 transition-all"
                                >
                                    Join Group
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold text-text mb-6">Create Support Group</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Category</label>
                                <select
                                    value={newGroup.category}
                                    onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                                >
                                    <option value="General">General</option>
                                    <option value="Anxiety">Anxiety</option>
                                    <option value="Depression">Depression</option>
                                    <option value="Academic Stress">Academic Stress</option>
                                    <option value="Relationships">Relationships</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text/70 mb-1.5">Description</label>
                                <textarea
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2.5 text-text/60 hover:text-text font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-8 py-2.5 rounded-full font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;
