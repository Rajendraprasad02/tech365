import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback(({ title, description, variant = 'default', duration = 3000 }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ title, description, variant, onClose }) => {
    const icons = {
        default: <Info size={18} />,
        success: <CheckCircle size={18} />,
        destructive: <AlertCircle size={18} />,
        warning: <AlertTriangle size={18} />
    };

    const variants = {
        default: "bg-white border-gray-200 text-gray-900",
        success: "bg-white border-green-200 text-gray-900 ring-1 ring-green-50",
        destructive: "bg-white border-red-200 text-red-900 ring-1 ring-red-50",
        warning: "bg-white border-amber-200 text-gray-900 ring-1 ring-amber-50"
    };

    const iconColors = {
        default: "text-blue-500",
        success: "text-green-500",
        destructive: "text-red-500",
        warning: "text-amber-500"
    };

    return (
        <div className={cn(
            "pointer-events-auto flex w-full items-start gap-4 rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-right-full duration-300",
            variants[variant] || variants.default
        )}>
            <div className={cn("mt-0.5", iconColors[variant] || iconColors.default)}>
                {icons[variant] || icons.default}
            </div>
            <div className="grid gap-1 flex-1">
                {title && <div className="text-sm font-semibold">{title}</div>}
                {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            <button
                onClick={onClose}
                className="opacity-50 hover:opacity-100 transition-opacity p-1 -mr-2 -mt-2"
            >
                <X size={16} />
            </button>
        </div>
    );
};
