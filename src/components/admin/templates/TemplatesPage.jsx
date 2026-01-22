import { useState, useEffect } from 'react';
import { getWhatsAppTemplates } from '../../../services/api';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await getWhatsAppTemplates();
            if (response && response.templates) {
                setTemplates(response.templates);
            } else {
                setTemplates([]);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
            setError("Failed to load templates.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center h-full text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="px-8 py-6 bg-white border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">WhatsApp Templates</h1>
                <p className="text-gray-500 text-sm">View available message templates from Meta</p>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div key={template.name} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                    <span className={`inline-flex items-center px-2 py-1 round-md text-xs font-medium mt-1 ${template.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        template.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {template.status}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">{template.language?.code || template.language}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-900">Category:</span> {template.category}
                                </div>

                                {template.components && template.components.map((comp, idx) => (
                                    <div key={idx} className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                        <span className="text-xs font-semibold text-gray-400 uppercase block mb-1">{comp.type}</span>
                                        {comp.text || (comp.type === 'HEADER' && comp.format) || 'No text preview'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {templates.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No templates found.
                    </div>
                )}
            </div>
        </div>
    );
}
