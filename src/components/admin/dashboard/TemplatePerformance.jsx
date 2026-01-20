import { templates } from '../../../constants';

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
            <div className="flex flex-col">
                {templates.map((template, index) => (
                    <div
                        key={index}
                        className={`flex justify-between items-center py-4 border-b border-gray-100 ${index === 0 ? 'border-t' : ''}`}
                    >
                        <div>
                            <div className="font-semibold text-gray-900 text-[15px]">{template.name}</div>
                            <div className="text-[13px] text-gray-500">{template.type}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-gray-900 text-lg">{template.sent.toLocaleString()}</div>
                            <div className="text-[13px] text-gray-500">sent</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
