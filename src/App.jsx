import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/modules/auth/ProtectedRoute';
import LoginPage from '@/modules/auth/LoginPage';
import Layout from '@/modules/admin/layout/Layout';

// Pages
import DashboardPage from '@/modules/admin/dashboard/DashboardPage';
import ConversationsPage from '@/modules/admin/conversations/ConversationsPage';
import PendingConversationsPage from '@/modules/admin/pending-conversations/PendingConversationsPage';

import CampaignsPage from '@/modules/admin/campaigns/CampaignsPage';
import KnowledgeBasePage from '@/modules/admin/knowledge-base/KnowledgeBasePage';
import ContactsPage from '@/modules/admin/contacts/ContactsPage';
import TemplatesPage from '@/modules/admin/templates/TemplatesPage';
import UsersPage from '@/modules/admin/users/UsersPage';

import RoleManagementPage from '@/modules/superadmin/RoleManagementPage';
import MenuBuilderPage from '@/modules/superadmin/MenuBuilderPage';
import PermissionRoute from '@/modules/auth/PermissionRoute';
import SmartRedirect from '@/modules/auth/SmartRedirect';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<SmartRedirect />} />
                <Route element={<PermissionRoute requiredScreen="dashboard" />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="conversations" />}>
                  <Route path="conversations" element={<ConversationsPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="agent/conversations/pending" />}>
                  <Route path="agent/conversations/pending" element={<PendingConversationsPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="agent/conversations/my" />}>
                  <Route path="agent/conversations/my" element={<ConversationsPage />} />
                </Route>

                <Route element={<PermissionRoute requiredScreen="campaigns" />}>
                  <Route path="campaigns" element={<CampaignsPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="knowledge-base" />}>
                  <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="contacts" />}>
                  <Route path="contacts" element={<ContactsPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="templates" />}>
                  <Route path="templates" element={<TemplatesPage />} />
                </Route>


                {/* RBAC Protected Routes */}
                <Route element={<PermissionRoute requiredScreen="roles" />}>
                  <Route path="roles" element={<RoleManagementPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="menu-builder" />}>
                  <Route path="menu-builder" element={<MenuBuilderPage />} />
                </Route>
                <Route element={<PermissionRoute requiredScreen="users" />}>
                  <Route path="users" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

