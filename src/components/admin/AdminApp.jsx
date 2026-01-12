import { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardPage from './DashboardPage';
import ConversationsPage from './ConversationsPage';

export default function AdminApp() {
    const [activePage, setActivePage] = useState('dashboard');

    const handleNavigate = (page) => {
        setActivePage(page);
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar activePage={activePage} onNavigate={handleNavigate} />
            <main className="flex-1 flex flex-col overflow-hidden">
                {activePage === 'dashboard' && <DashboardPage />}
                {activePage === 'conversations' && <ConversationsPage />}
            </main>
        </div>
    );
}
