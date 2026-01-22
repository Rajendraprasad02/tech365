import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import DashboardPage from '../dashboard/DashboardPage';
import ConversationsPage from '../conversations/ConversationsPage';
import CampaignsPage from '../campaigns/CampaignsPage';
import KnowledgeBasePage from '../knowledge-base/KnowledgeBasePage';
import ContactsPage from '../contacts/ContactsPage';
import TemplatesPage from '../templates/TemplatesPage';

export default function Layout() {
    const [activePage, setActivePage] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const handleNavigate = (page) => {
        setActivePage(page);
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <span className="ml-2 font-semibold text-gray-900">ChatFlow</span>
            </div>

            <Sidebar
                activePage={activePage}
                onNavigate={handleNavigate}
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="flex-1 flex flex-col overflow-hidden pt-16 md:pt-0 w-full relative">
                {activePage === 'dashboard' && <DashboardPage />}
                {activePage === 'conversations' && <ConversationsPage />}
                {activePage === 'campaigns' && <CampaignsPage />}
                {activePage === 'knowledge-base' && <KnowledgeBasePage />}
                {activePage === 'contacts' && <ContactsPage />}
                {activePage === 'templates' && <TemplatesPage />}
            </main>
        </div>
    );
}

