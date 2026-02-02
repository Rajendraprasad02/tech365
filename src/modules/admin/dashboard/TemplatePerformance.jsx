// Static data removed

export default function TemplatePerformance() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 flex-1 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0082FB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <div>
                    <div className="text-lg font-semibold text-gray-900">Template Performance</div>
                    <div className="text-sm text-gray-500">Message template analytics</div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1 h-40 text-gray-400">
                <div className="text-2xl font-bold text-gray-300">NRTD</div>
                <div className="text-xs">Not Real-Time Data</div>
            </div>
        </div>
    );
}
