import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuthStore } from '../state/authStore';

const Forum = () => {
    const { user } = useAuthStore();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General', isAnonymous: false });
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    const categories = ['All', 'General', 'Anxiety', 'Depression', 'Academic Stress', 'Relationships'];

    useEffect(() => {
        fetchPosts();
    }, [category]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const query = category !== 'All' ? `?category=${category}` : '';
            const response = await api.get(`/forum${query}`);
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            await api.post('/forum', newPost);
            setShowModal(false);
            setNewPost({ title: '', content: '', category: 'General', isAnonymous: false });
            fetchPosts();
        } catch (error) {
            console.error('Failed to create post', error);
            alert('Failed to create post');
        }
    };

    const handleReply = async (postId) => {
        if (!replyContent.trim()) return;
        try {
            await api.post(`/forum/${postId}/reply`, { content: replyContent, isAnonymous: false }); // Default not anon for replies for now
            setReplyContent('');
            setReplyingTo(null);
            fetchPosts();
        } catch (error) {
            console.error('Failed to reply', error);
        }
    };

    const handleFlag = async (postId) => {
        if (!window.confirm('Are you sure you want to flag this post as inappropriate?')) return;
        try {
            await api.post(`/forum/${postId}/flag`);
            alert('Post flagged for review');
        } catch (error) {
            console.error('Failed to flag post', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Community Forum</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-teal-800 transition-colors"
                >
                    Create Post
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === cat
                                ? 'bg-primary text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center text-slate-500 py-10">Loading discussions...</p>
            ) : posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post._id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-800">{post.userId?.name || 'Anonymous'}</span>
                                    <span className="text-xs text-slate-400">• {new Date(post.createdAt).toLocaleDateString()}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                        {post.category}
                                    </span>
                                </div>
                                <button onClick={() => handleFlag(post._id)} className="text-slate-400 hover:text-red-500 text-sm">
                                    Flag
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{post.title}</h3>
                            <p className="text-slate-600 mb-4">{post.content}</p>

                            {/* Replies Section */}
                            <div className="bg-slate-50 p-4 rounded-md space-y-3">
                                {post.replies.map((reply, idx) => (
                                    <div key={idx} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                        <p className="text-xs font-bold text-slate-700 mb-1">{reply.userId?.name || 'Anonymous'}</p>
                                        <p className="text-sm text-slate-600">{reply.content}</p>
                                    </div>
                                ))}

                                {replyingTo === post._id ? (
                                    <div className="mt-3">
                                        <textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-md text-sm mb-2"
                                            placeholder="Write a supportive reply..."
                                            rows="2"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleReply(post._id)}
                                                className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
                                            >
                                                Reply
                                            </button>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="text-slate-500 text-sm hover:text-slate-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setReplyingTo(post._id)}
                                        className="text-primary text-sm font-medium hover:underline mt-2"
                                    >
                                        Reply to this post
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-slate-100">
                    <p className="text-slate-500">No posts found. Be the first to share!</p>
                </div>
            )}

            {/* Create Post Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Post</h3>
                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newPost.title}
                                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    value={newPost.category}
                                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                >
                                    {categories.filter(c => c !== 'All').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                                <textarea
                                    value={newPost.content}
                                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                    className="w-full p-2 border border-slate-300 rounded-md"
                                    rows="4"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="anon"
                                    checked={newPost.isAnonymous}
                                    onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <label htmlFor="anon" className="text-sm text-slate-700">Post Anonymously</label>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="text-slate-500 hover:text-slate-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-teal-800"
                                >
                                    Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forum;
