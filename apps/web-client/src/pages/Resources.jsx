import { useState, useEffect } from 'react';
import api from '../services/api';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');

    const categories = ['All', 'Anxiety', 'Depression', 'Stress', 'Sleep', 'General'];

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            try {
                const query = category !== 'All' ? `?category=${category}` : '';
                const response = await api.get(`/resources${query}`);
                setResources(response.data);
            } catch (error) {
                console.error('Failed to fetch resources', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [category]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Mental Health Resources</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
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
            </div>

            {loading ? (
                <p className="text-center text-slate-500 py-10">Loading resources...</p>
            ) : resources.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(resource => (
                        <div key={resource._id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded font-medium">
                                    {resource.category}
                                </span>
                                <span className="text-xs text-slate-400 uppercase">{resource.type}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{resource.title}</h3>
                            <p className="text-slate-600 text-sm mb-4 line-clamp-3">{resource.description}</p>
                            <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-medium text-sm hover:underline inline-flex items-center gap-1"
                            >
                                View Resource <span>&rarr;</span>
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-lg border border-slate-100">
                    <p className="text-slate-500">No resources found for this category.</p>
                </div>
            )}
        </div>
    );
};

export default Resources;
