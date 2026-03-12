import { useState, useEffect } from 'react';
import {
    Layout, Plus, Save, Trash2, ChevronUp, ChevronDown, Edit2, GripVertical,
    Folder, FileText, Loader2, Check, X, Shield, AlertTriangle
} from 'lucide-react';
import { getMenuCreator, updateMenuCreator, getRoles } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';

const ICON_OPTIONS = [
    'Layout', 'Plus', 'Save', 'Trash2', 'ChevronUp', 'ChevronDown', 'Edit2', 'GripVertical',
    'Folder', 'FileText', 'Shield', 'AlertTriangle', 'Users', 'Settings', 'MessageSquare',
    'Contact', 'HelpCircle', 'BarChart3', 'Link', 'Database', 'Mail', 'Smartphone', 'Search',
    'Clock', 'Bell', 'CheckCircle', 'AlertCircle', 'Lock', 'Unlock', 'Power', 'Maximize', 'Package', 'ShoppingBag', 'Layers'
];

const FORBIDDEN_NAMES = ['metrics', 'leads', 'sessions', 'dashboard', 'users', 'roles', 'menu-builder', 'role-permissions', 'profile', 'settings', 'notifications', 'audit logs'];
const CRITICAL_ROUTES = ['/dashboard', '/users', '/roles', '/menu-builder', '/role-permissions'];

/* --- DND Components --- */

function SortableModule({ module, children, onEdit, onAddScreen, onToggleStatus, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: module.id, data: { type: 'module', module } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={`bg-white border text-card-foreground shadow-sm rounded-xl mb-4 overflow-hidden ${isDragging ? 'z-50 ring-2 ring-primary shadow-lg' : 'border-gray-200'} ${!module.isActive ? 'opacity-70 bg-gray-50/50' : ''}`}>
            <div className="bg-gray-50/50 p-4 flex items-center justify-between group rounded-t-xl transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1">
                        <GripVertical size={20} />
                    </button>
                    <div className={`p-2 rounded-lg ${module.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                        <Folder size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{module.name}</span>
                            {!module.isActive && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">Inactive</span>}
                        </div>
                        <div className="text-xs text-gray-400 font-mono hidden md:block">Route: {module.route || 'Parent'}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
                        <span className="text-[10px] font-medium text-gray-400 uppercase">Status</span>
                        <Switch
                            checked={module.isActive}
                            onCheckedChange={() => onToggleStatus(module.id)}
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-500 hover:text-primary hover:bg-primary/5 rounded-full w-8 h-8 p-0">
                            <Edit2 size={16} />
                        </Button>
                        {!module.systemDefault && !module.isSystem && !FORBIDDEN_NAMES.includes(module.name?.toLowerCase()) && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full w-8 h-8 p-0">
                                <Trash2 size={16} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-2 pl-4 md:pl-10 space-y-2 bg-white">
                {children}
                <div className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-primary gap-2 pl-2 hover:bg-primary/5 rounded-lg border border-dashed border-gray-200" onClick={onAddScreen}>
                        <Plus size={16} /> Add Screen
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SortableScreen({ screen, onEdit, onToggleStatus, onDelete }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: screen.id, data: { type: 'screen', screen } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const IconComp = LucideIcons[screen.icon] || FileText;

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-3 rounded-xl border ${isDragging ? 'bg-primary/5 border-primary/20 shadow-md' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'} transition-all group ${!screen.isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1">
                    <GripVertical size={18} />
                </button>
                <div className={`p-2 rounded-lg ${screen.isActive ? 'bg-gray-50 text-gray-600 group-hover:bg-primary/5 group-hover:text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <IconComp size={18} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{screen.name}</span>
                        {!screen.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-1 py-0 rounded uppercase">Off</span>}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{screen.route}</div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2 border-r border-gray-100">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Visible</span>
                    <Switch
                        checked={screen.isActive}
                        onCheckedChange={() => onToggleStatus(screen.id)}
                        className="scale-75"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={onEdit} className="rounded-full w-8 h-8 p-0 hover:bg-primary/5 text-gray-500 hover:text-primary transition-colors">
                        <Edit2 size={16} />
                    </Button>
                    {!screen.systemDefault && !screen.isSystem && !CRITICAL_ROUTES.includes(screen.route) && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full w-8 h-8 p-0 transition-colors">
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* --- Main Component --- */

export default function MenuBuilderPage() {
    const { toast } = useToast();
    const { refreshMenu } = useAuth();

    // Data State
    const [menu, setMenu] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', moduleId: null, screenId: null });
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        route: '',
        icon: '',
        isActive: true
    });
    const [formErrors, setFormErrors] = useState({});

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch Data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [menuData, rolesData] = await Promise.all([
                getMenuCreator(),
                getRoles()
            ]);

            // Ensure IDs are strings are robust
            const processedMenu = (Array.isArray(menuData) ? menuData : []).map(m => ({
                ...m,
                id: m.id || `module-${Date.now()}-${Math.random()}`,
                screens: (m.screens || []).map(s => ({
                    ...s,
                    id: s.id || `screen-${Date.now()}-${Math.random()}`
                }))
            }));

            setMenu(processedMenu);
            setRoles(Array.isArray(rolesData) ? rolesData : []);
        } catch (error) {
            console.error("Failed to fetch menu data:", error);
            toast({ title: "Error", description: "Failed to load menu data", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const dispatchSave = async (data = menu) => {
        setSaving(true);
        try {
            // Helper to ensure route starts with /
            const sanitizeRoute = (route) => {
                if (!route) return null;
                const trimmed = route.trim();
                if (!trimmed) return null;
                return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
            };

            // Sanitize: Update orderIndex based on current array position
            const payload = data.map((m, mIdx) => {
                return {
                    moduleId: (m.id && m.id.toString().startsWith('module-')) ? undefined : m.id,
                    moduleName: m.name,
                    type: 'module',
                    moduleRoute: sanitizeRoute(m.route) || null,
                    orderIndex: mIdx,
                    isActive: m.isActive !== false,
                    icon: m.icon || 'Folder',

                    screens: (m.screens || []).map((s, sIdx) => ({
                        screenId: (s.id && s.id.toString().startsWith('screen-')) ? undefined : s.id,
                        screenName: s.name,
                        screenRoute: sanitizeRoute(s.route),
                        icon: s.icon || 'FileText',
                        orderIndex: sIdx,
                        isActive: s.isActive !== false,
                        actions: s.actions || [1, 2, 3]
                    }))
                };
            });

            await updateMenuCreator(payload);
            toast({ title: "Success", description: "Menu configuration saved", variant: "success" });
            if (refreshMenu) refreshMenu();
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save menu structure.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    }

    const handleToggleModuleStatus = (moduleId) => {
        const newMenu = menu.map(m => {
            if (m.id === moduleId) {
                return { ...m, isActive: !m.isActive };
            }
            return m;
        });
        setMenu(newMenu);
        // We don't auto-save on toggle to prevent too many API calls, or we can. 
        // Let's at least update local state so 'Save Order' works.
    };

    const handleToggleScreenStatus = (moduleId, screenId) => {
        const newMenu = menu.map(m => {
            if (m.id === moduleId) {
                return {
                    ...m,
                    screens: m.screens.map(s => {
                        if (s.id === screenId) return { ...s, isActive: !s.isActive };
                        return s;
                    })
                };
            }
            return m;
        });
        setMenu(newMenu);
    };

    const handleDeleteModule = (moduleId) => {
        const module = menu.find(m => m.id === moduleId);
        if (module?.systemDefault || module?.isSystem || FORBIDDEN_NAMES.includes(module?.name?.toLowerCase())) {
            toast({ title: "Forbidden", description: "This is a critical system module and cannot be deleted.", variant: "destructive" });
            return;
        }
        setDeleteModal({ isOpen: true, type: 'module', moduleId, screenId: null });
    };

    const handleDeleteScreen = (moduleId, screenId) => {
        const module = menu.find(m => m.id === moduleId);
        const screen = module?.screens?.find(s => s.id === screenId);
        if (screen?.systemDefault || screen?.isSystem || CRITICAL_ROUTES.includes(screen?.route)) {
            toast({ title: "Forbidden", description: "This is a critical system screen and cannot be deleted.", variant: "destructive" });
            return;
        }
        setDeleteModal({ isOpen: true, type: 'screen', moduleId, screenId });
    };

    const confirmDelete = async () => {
        let newMenu = [...menu];
        if (deleteModal.type === 'module') {
            newMenu = menu.filter(m => m.id !== deleteModal.moduleId);
        } else {
            newMenu = menu.map(m => {
                if (m.id === deleteModal.moduleId) {
                    return { ...m, screens: m.screens.filter(s => s.id !== deleteModal.screenId) };
                }
                return m;
            });
        }
        setMenu(newMenu);
        setDeleteModal({ isOpen: false, type: '', moduleId: null, screenId: null });
        await dispatchSave(newMenu);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // 1. Reordering Modules
        if (active.data.current?.type === 'module' && over.data.current?.type === 'module') {
            if (active.id !== over.id) {
                setMenu((items) => {
                    const oldIndex = items.findIndex((i) => i.id === active.id);
                    const newIndex = items.findIndex((i) => i.id === over.id);
                    const newOrder = arrayMove(items, oldIndex, newIndex);
                    // dispatchSave(newOrder); // Optional: auto-save
                    return newOrder;
                });
            }
            return;
        }

        // 2. Reordering Screens (Simplification: Only within same module for now, or detect parent)
        if (active.data.current?.type === 'screen') {
            const activeScreenId = active.id;
            const overScreenId = over.id;

            // Find which module contains these screens
            // Note: If dragging screen over a module, we could move it to that module (advanced)

            const sourceModuleIndex = menu.findIndex(m => m.screens.some(s => s.id === activeScreenId));
            const targetModuleIndex = menu.findIndex(m => m.screens.some(s => s.id === overScreenId));

            if (sourceModuleIndex !== -1 && targetModuleIndex !== -1 && sourceModuleIndex === targetModuleIndex) {
                // Same Module Reordering
                const moduleIndex = sourceModuleIndex;
                const screens = menu[moduleIndex].screens;
                const oldIndex = screens.findIndex(s => s.id === activeScreenId);
                const newIndex = screens.findIndex(s => s.id === overScreenId);

                if (oldIndex !== newIndex) {
                    const newMenu = [...menu];
                    newMenu[moduleIndex] = {
                        ...newMenu[moduleIndex],
                        screens: arrayMove(screens, oldIndex, newIndex)
                    };
                    setMenu(newMenu);
                }
            } else if (sourceModuleIndex !== -1 && targetModuleIndex !== -1 && sourceModuleIndex !== targetModuleIndex) {
                // Moving Screen between modules
                const sourceModule = menu[sourceModuleIndex];
                const targetModule = menu[targetModuleIndex];
                const sourceScreenIndex = sourceModule.screens.findIndex(s => s.id === activeScreenId);
                const targetScreenIndex = targetModule.screens.findIndex(s => s.id === overScreenId);

                const newMenu = [...menu];
                const [movedScreen] = newMenu[sourceModuleIndex].screens.splice(sourceScreenIndex, 1);
                newMenu[targetModuleIndex].screens.splice(targetScreenIndex, 0, movedScreen);
                setMenu(newMenu);
            }
        }
    };

    /* ... Editor Handlers ... */
    const handleCreateMenu = () => {
        setEditingItem({ type: 'module', pIndex: menu.length, data: {} });
        setFormData({ name: '', key: '', route: '', icon: '', isActive: true });
        setModalOpen(true);
    };

    const handleSaveItem = async () => {
        const errors = {};
        if (!formData.name) errors.name = 'Name is required';

        // Route validation: must start with / and be unique (if screen)
        if (editingItem.type === 'screen') {
            if (!formData.route) {
                errors.route = 'Route is required';
            } else if (!formData.route.startsWith('/')) {
                errors.route = 'Route must start with "/"';
            }
        }

        // Duplication Checks
        const isEdit = !!editingItem.data.id;

        // Check duplicate name
        const nameExists = menu.some((m, idx) => {
            if (editingItem.type === 'module' && isEdit && idx === editingItem.pIndex) return false;
            if (m.name.toLowerCase() === formData.name.toLowerCase()) return true;
            return (m.screens || []).some((s, sIdx) => {
                if (editingItem.type === 'screen' && isEdit && idx === editingItem.pIndex && sIdx === editingItem.cIndex) return false;
                return s.name.toLowerCase() === formData.name.toLowerCase();
            });
        });

        if (nameExists) errors.name = 'This name is already in use';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        // System Integrity Check
        if (FORBIDDEN_NAMES.includes(formData.name.toLowerCase())) {
            toast({ title: "Invalid Name", description: `"${formData.name}" is a protected system name.`, variant: "destructive" });
            return;
        }

        let newMenu = [...menu];
        const itemData = {
            name: formData.name,
            id: editingItem.data.id || (editingItem.type === 'module' ? `module-${Date.now()}` : `screen-${Date.now()}`),
            route: formData.route,
            icon: formData.icon || (editingItem.type === 'module' ? 'Folder' : 'FileText'),
            isActive: formData.isActive,
        };

        if (editingItem.type === 'module') {
            if (editingItem.pIndex < newMenu.length) {
                newMenu[editingItem.pIndex] = { ...newMenu[editingItem.pIndex], ...itemData };
            } else {
                newMenu.push({ ...itemData, screens: [] });
            }
        } else {
            const module = { ...newMenu[editingItem.pIndex] };
            if (module) {
                const screens = [...(module.screens || [])];
                if (editingItem.cIndex < screens.length) {
                    screens[editingItem.cIndex] = { ...screens[editingItem.cIndex], ...itemData };
                } else {
                    screens.push(itemData);
                }
                newMenu[editingItem.pIndex] = { ...module, screens };
            }
        }

        setMenu(newMenu);
        setModalOpen(false);
        setFormErrors({});
        dispatchSave(newMenu);
    };

    // Filter Logic
    const filteredMenu = menu.filter(m => {
        if (!searchTerm) return true;
        const matchesModule = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesScreens = (m.screens || []).some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesModule || matchesScreens;
    });

    // Stats
    const totalMenus = menu.reduce((acc, m) => acc + 1 + (m.screens?.length || 0), 0);

    // Permission Verification
    const { permissions } = useAuth();
    // State is { "route": { "read": true, "update": true } }
    const hasUpdatePermission = permissions?.['/menu-builder']?.edit ||
        permissions?.['menu-builder']?.edit ||
        false;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure application menus and navigation structure</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative hidden md:block w-64 lg:w-80">
                        <Input
                            placeholder="Search menus or screens..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                        />
                        <LucideIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                    {hasUpdatePermission && (
                        <>
                            <Button onClick={() => dispatchSave(menu)} variant="outline" className="gap-2 border-gray-200 hover:bg-white hover:border-primary hover:text-primary transition-all rounded-xl shadow-sm" disabled={saving}>
                                <Save size={18} /> {saving ? 'Saving...' : 'Save Structure'}
                            </Button>
                            <Button onClick={handleCreateMenu} className="bg-primary hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary/20 rounded-xl">
                                <Plus size={18} /> Create Menu
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                {searchTerm && filteredMenu.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <Folder size={48} className="mb-4 opacity-20" />
                        <p className="text-lg">No menus found matching "{searchTerm}"</p>
                        <Button variant="ghost" onClick={() => setSearchTerm('')} className="mt-2 text-primary">Clear Search</Button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-8 min-h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Navigation Structure</h2>
                                <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 italic">Drag to reorder modules and screens</div>
                            </div>
                            <div className="space-y-4 w-full">
                                <SortableContext items={filteredMenu.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                    {filteredMenu.map((module, pIndex) => (
                                        <SortableModule
                                            key={module.id}
                                            module={module}
                                            onToggleStatus={() => handleToggleModuleStatus(module.id)}
                                            onEdit={() => {
                                                setEditingItem({ type: 'module', pIndex: menu.findIndex(m => m.id === module.id), data: module });
                                                setFormData({ ...module });
                                                setFormErrors({});
                                                setModalOpen(true);
                                            }}
                                            onAddScreen={() => {
                                                setEditingItem({ type: 'screen', pIndex: menu.findIndex(m => m.id === module.id), cIndex: module.screens?.length || 0, data: {} });
                                                setFormData({ name: '', key: '', route: '', icon: 'FileText', isActive: true });
                                                setFormErrors({});
                                                setModalOpen(true);
                                            }}
                                            onDelete={() => handleDeleteModule(module.id)}
                                        >
                                            <SortableContext items={(module.screens || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                {(module.screens || []).map((screen, cIndex) => (
                                                    <SortableScreen
                                                        key={screen.id}
                                                        screen={screen}
                                                        onDelete={() => handleDeleteScreen(module.id, screen.id)}
                                                        onToggleStatus={() => handleToggleScreenStatus(module.id, screen.id)}
                                                        onEdit={() => {
                                                            setEditingItem({ type: 'screen', pIndex: menu.findIndex(m => m.id === module.id), cIndex, data: screen });
                                                            setFormData({ ...screen });
                                                            setFormErrors({});
                                                            setModalOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </SortableModule>
                                    ))}
                                </SortableContext>
                            </div>
                        </div>
                    </DndContext>
                )}
            </div>

            {/* Deletion Confirmation */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={confirmDelete}
                title={`Delete ${deleteModal.type === 'module' ? 'Module' : 'Screen'}`}
                message={`Are you sure you want to delete this ${deleteModal.type}? ${deleteModal.type === 'module' ? 'All nested screens will be removed.' : ''} This action will sync with the database immediately.`}
                confirmText="Yes, Delete"
                type="danger"
            />

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingItem.data.id ? 'Edit Item' : 'Create New Menu'}</h2>
                            <button onClick={() => setModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={editingItem.type === 'module' ? "e.g. Sales & Marketing" : "e.g. Overview"}
                                    className={formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 transition-all rounded-xl h-11'}
                                />
                                {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Route Path</label>
                                <div className="relative">
                                    <Input
                                        value={formData.route}
                                        onChange={e => setFormData({ ...formData, route: e.target.value })}
                                        placeholder={editingItem.type === 'module' ? "(Optional for parents)" : "/dashboard/overview"}
                                        className={formErrors.route ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 transition-all rounded-xl h-11'}
                                    />
                                    {editingItem.type === 'screen' && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono uppercase">Required</div>}
                                </div>
                                {formErrors.route && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.route}</p>}
                                <p className="text-[10px] text-gray-400 mt-1 pl-1 italic">Internal navigation route using React Router</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Icon</label>
                                <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-3 border border-gray-100 rounded-2xl bg-gray-50/50 scrollbar-thin">
                                    {ICON_OPTIONS.map(iconName => {
                                        const IconComp = LucideIcons[iconName] || LucideIcons.HelpCircle;
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, icon: iconName })}
                                                className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 ${formData.icon === iconName ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 z-10' : 'bg-white text-gray-400 border border-gray-100 hover:text-primary hover:border-primary/30 hover:shadow-sm'}`}
                                                title={iconName}
                                            >
                                                <IconComp size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-between mt-2 px-1">
                                    <span className="text-[10px] font-medium text-gray-500 uppercase">Selected: {formData.icon || 'Default'}</span>
                                    {formData.icon && (
                                        <button onClick={() => setFormData({ ...formData, icon: '' })} className="text-[10px] text-primary hover:underline">Reset</button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white">
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">Active Status</span>
                                    <span className="text-xs text-gray-500">Enable this menu to appear in navigation</span>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={val => setFormData({ ...formData, isActive: val })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/30 rounded-b-2xl">
                            <Button variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl px-6 h-11 text-gray-500 hover:text-gray-700">Cancel</Button>
                            <Button onClick={handleSaveItem} className="bg-primary hover:bg-primary-600 text-white rounded-xl px-8 h-11 shadow-lg shadow-primary/20">
                                {editingItem.data.id ? 'Update Menu' : 'Add to Navigation'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
