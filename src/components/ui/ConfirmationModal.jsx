import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from './button';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = 'Confirm Action', 
    message = 'Are you sure you want to proceed?', 
    confirmText = 'Confirm', 
    cancelText = 'Cancel',
    type = 'info', // 'info', 'success', 'warning', 'danger'
    loading = false
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle className="text-green-500" size={24} />,
                    bg: 'bg-green-50',
                    border: 'border-green-100',
                    button: 'bg-green-600 hover:bg-green-700'
                };
            case 'warning':
                return {
                    icon: <AlertCircle className="text-amber-500" size={24} />,
                    bg: 'bg-amber-50',
                    border: 'border-amber-100',
                    button: 'bg-amber-600 hover:bg-amber-700'
                };
            case 'danger':
                return {
                    icon: <AlertCircle className="text-red-500" size={24} />,
                    bg: 'bg-red-50',
                    border: 'border-red-100',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            default:
                return {
                    icon: <Info className="text-blue-500" size={24} />,
                    bg: 'bg-blue-50',
                    border: 'border-blue-100',
                    button: 'bg-primary hover:bg-primary-600'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${styles.bg} ${styles.border} border`}>
                            {styles.icon}
                        </div>
                        <div className="flex-1 text-sm text-gray-600 leading-relaxed pt-1">
                            {message}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex gap-3">
                    {cancelText && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 rounded-xl h-11"
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 rounded-xl h-11 text-white shadow-lg ${styles.button} transition-all active:scale-95`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
