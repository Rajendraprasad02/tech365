import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const CloseChatModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [feedback, setFeedback] = useState('');
    const [reportUser, setReportUser] = useState(false);
    const [reportReason, setReportReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        onConfirm({
            feedback,
            report_user: reportUser,
            report_reason: reportUser ? reportReason : null
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-lg font-bold text-gray-900">Close Conversation</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-sm flex gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <p>Closing this chat will archive it. Please provide feedback or report the user if necessary.</p>
                        </div>

                        {/* Feedback Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Agent Feedback <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="E.g. Customer was interested but needs a discount..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] text-sm resize-none"
                            />
                        </div>

                        {/* Report User Toggle */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={reportUser}
                                    onChange={(e) => setReportUser(e.target.checked)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Report this user (Spam/Abuse)</span>
                            </label>

                            {/* Report Reason */}
                            {reportUser && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-2">
                                        Select a Reason
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Spam', 'Abusive Language', 'Wrong Number', 'Other'].map((reason) => (
                                            <button
                                                key={reason}
                                                type="button"
                                                onClick={() => setReportReason(reason)}
                                                className={`px-3 py-2 text-sm border rounded-lg transition-all text-left ${reportReason === reason
                                                        ? 'bg-red-50 border-red-200 text-red-700 font-medium ring-1 ring-red-200'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {reason}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-xl h-11"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || (reportUser && !reportReason)}
                        className={`flex-1 rounded-xl h-11 text-white shadow-lg transition-all active:scale-95 ${reportUser ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <span className="loader-sm border-white"></span>
                                <span>Processing...</span>
                            </div>
                        ) : (reportUser ? 'Report & Close' : 'Close Chat')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CloseChatModal;
