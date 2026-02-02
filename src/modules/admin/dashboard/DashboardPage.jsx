import { useState, useCallback } from 'react';
import { useDashboardData } from '../../../hooks/useDashboardData';
import DashboardHeader from './DashboardHeader';
import HeroCards from './HeroCards';
import MetricsGrid from './MetricsGrid';
import ConversationVolumeChart from './ConversationVolumeChart';
import ResolutionBreakdownChart from './ResolutionBreakdownChart';
import DeliveryOverview from './DeliveryOverview';
import RecentConversations from './RecentConversations';
import HourlyActivityChart from './HourlyActivityChart';
import TemplatePerformance from './TemplatePerformance';

export default function DashboardPage() {
    const { data, loading, error } = useDashboardData();
    const [highlightedSection, setHighlightedSection] = useState(null);

    // Handle scroll to section from search
    const handleScrollToSection = useCallback((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedSection(sectionId);
            // Remove highlight after 2 seconds
            setTimeout(() => setHighlightedSection(null), 2000);
        }
    }, []);

    // Get highlight class
    const getHighlightClass = (sectionId) => {
        return highlightedSection === sectionId
            ? 'ring-2 ring-violet-500 ring-offset-2 transition-all duration-300'
            : '';
    };

    return (
        <>
            {/* Top Header Bar */}
            <DashboardHeader onScrollToSection={handleScrollToSection} />

            {/* Dashboard Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
                <p className="text-gray-500 text-sm mb-8">Monitor your WhatsApp Business performance</p>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12 h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                        <span className="ml-3 text-gray-500">Loading dashboard data...</span>
                    </div>
                ) : (
                    <>
                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-red-600 text-sm">Error loading data: {error}</p>
                                <p className="text-red-500 text-xs mt-1">Using fallback mock data</p>
                            </div>
                        )}

                        {/* Hero Cards */}
                        <div id="hero-cards" className={`rounded-xl ${getHighlightClass('hero-cards')}`}>
                            <HeroCards
                                walletBalance={data.walletBalance}
                                activeConversations={data.totalConversations}
                                whatsappCost={data.whatsappCost}
                            />
                        </div>

                        {/* Metrics Grid */}
                        <div id="metrics-grid" className={`rounded-xl ${getHighlightClass('metrics-grid')}`}>
                            <MetricsGrid
                                activeUsers={data.activeUsers}
                                costPerConversation={data.costPerConversation}
                                avgResponseTime={data.avgResponseTime}
                                deliveryStats={data.deliveryStats}
                                humanHandledConversations={data.humanHandledConversations}
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-3 gap-5 mb-6">
                            <div id="conversation-volume" className={`col-span-2 rounded-xl ${getHighlightClass('conversation-volume')}`}>
                                <ConversationVolumeChart data={data.conversationVolumeData} />
                            </div>
                            <div id="resolution-breakdown" className={`rounded-xl ${getHighlightClass('resolution-breakdown')}`}>
                                <ResolutionBreakdownChart />
                            </div>
                        </div>

                        {/* Message Delivery Overview */}
                        <div id="delivery-overview" className={`rounded-xl ${getHighlightClass('delivery-overview')}`}>
                            <DeliveryOverview deliveryStats={data.deliveryStats} />
                        </div>

                        {/* Bottom Section */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Recent Conversations */}
                            <div id="recent-conversations" className={`rounded-xl ${getHighlightClass('recent-conversations')}`}>
                                <RecentConversations conversations={data.recentConversations} />
                            </div>

                            {/* Right Column - Hourly Activity + Template Performance */}
                            <div className="flex flex-col gap-6">
                                <div id="hourly-activity" className={`rounded-xl ${getHighlightClass('hourly-activity')}`}>
                                    <HourlyActivityChart data={data.hourlyActivityData} />
                                </div>
                                <div id="template-performance" className={`rounded-xl ${getHighlightClass('template-performance')}`}>
                                    <TemplatePerformance />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
