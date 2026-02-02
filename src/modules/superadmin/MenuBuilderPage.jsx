import { useState, useEffect } from 'react';
import {
    Layout, Plus, Save, Trash2, ChevronUp, ChevronDown, Edit2, GripVertical,
    Folder, FileText, Loader2, Check, X, Shield, AlertTriangle
} from 'lucide-react';
import { getMenuCreator, updateMenuCreator, getRoles } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

/* --- DND Components --- */

function SortableModule({ module, children, onEdit, onAddScreen }) {
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
        <div ref={setNodeRef} style={style} className={`bg-white border text-card-foreground shadow-sm rounded-xl mb-4 overflow-hidden ${isDragging ? 'z-50 ring-2 ring-primary shadow-lg' : 'border-gray-200'}`}>
            <div className="bg-gray-50 p-4 flex items-center justify-between group rounded-t-xl transition-colors hover:bg-gray-50/80">
                <div className="flex items-center gap-3">
                    <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical size={20} />
                    </button>
                    <Folder className="text-primary" size={20} />
                    <div>
                        <div className="font-semibold text-gray-900">{module.name}</div>
                        <div className="text-xs text-gray-500 font-mono hidden md:block">{module.id}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onEdit} className="text-gray-500 hover:text-blue-600"><Edit2 size={16} /></Button>
                </div>
            </div>
            <div className="p-2 pl-4 md:pl-8 space-y-2 bg-white">
                {children}
                <div className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-blue-600 gap-2 pl-2 hover:bg-blue-50" onClick={onAddScreen}>
                        <Plus size={16} /> Add Screen
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SortableScreen({ screen, onEdit }) {
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

    return (
        <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-3 rounded-lg border ${isDragging ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm'} transition-all group`}>
            <div className="flex items-center gap-3">
                <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                    <GripVertical size={18} />
                </button>
                <div className="p-2 bg-gray-50 rounded-md">
                    <FileText className="text-gray-400" size={18} />
                </div>
                <div>
                    <div className="font-medium text-gray-800">{screen.name}</div>
                    <div className="text-xs text-gray-400 flex gap-2">
                        <span>{screen.route}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={onEdit}><Edit2 size={16} /></Button>
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
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        route: '',
        icon: '',
        isActive: true
    });

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
            // Sanitize: Update orderIndex based on current array position
            const payload = data.map((m, mIdx) => ({
                moduleId: m.id && m.id.toString().startsWith('module-') ? undefined : m.id,
                moduleName: m.name,
                type: 'module',
                moduleRoute: m.route || null,
                orderIndex: mIdx,
                isActive: m.isActive,

                screens: (m.screens || []).map((s, sIdx) => ({
                    screenId: s.id && s.id.toString().startsWith('screen-') ? undefined : s.id,
                    screenName: s.name,
                    screenRoute: s.route,
                    orderIndex: sIdx,
                    isActive: s.isActive,
                    actions: s.actions || [1, 2, 3] // Default Actions
                }))
            }));

            await updateMenuCreator(payload);
            toast({ title: "Success", description: "Menu configuration saved", variant: "success" });
            refreshMenu();
            // Don't refetch immediately to prevent UI jump, just update local?
            // Or fetch to get real IDs back.
            fetchData();
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save menu", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    }

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
        if (!formData.name) return;
        let newMenu = [...menu];
        const itemData = {
            name: formData.name,
            id: editingItem.data.id || (editingItem.type === 'module' ? `module-${Date.now()}` : `screen-${Date.now()}`),
            route: formData.route,
            icon: formData.icon,
            isActive: formData.isActive,
        };

        if (editingItem.type === 'module') {
            if (editingItem.pIndex < newMenu.length) {
                newMenu[editingItem.pIndex] = { ...newMenu[editingItem.pIndex], ...itemData };
            } else {
                newMenu.push({ ...itemData, screens: [] });
            }
        } else {
            const module = newMenu[editingItem.pIndex];
            if (module) {
                if (editingItem.cIndex < (module.screens || []).length) {
                    module.screens[editingItem.cIndex] = { ...module.screens[editingItem.cIndex], ...itemData };
                } else {
                    if (!module.screens) module.screens = [];
                    module.screens.push(itemData);
                }
            }
        }

        setMenu(newMenu);
        setModalOpen(false);
        dispatchSave(newMenu);
    };

    // Stats
    const totalMenus = menu.reduce((acc, m) => acc + 1 + (m.screens?.length || 0), 0);

    // Permission Verification
    const { permissions } = useAuth();
    // State is { "route": { "read": true, "update": true } }
    const hasUpdatePermission = permissions?.['/menu-builder']?.update ||
        permissions?.['menu-builder']?.update ||
        false;

    return (
        <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh-64px)] overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between shadow-sm z-10">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
                    <p className="text-sm text-gray-500 mt-1">Configure application menus and navigation structure</p>
                </div>
                <div className="flex gap-2">
                    {hasUpdatePermission && (
                        <>
                            <Button onClick={() => dispatchSave(menu)} variant="outline" className="gap-2" disabled={saving}>
                                <Save size={18} /> {saving ? 'Saving...' : 'Save Order'}
                            </Button>
                            <Button onClick={handleCreateMenu} className="bg-primary hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary/20">
                                <Plus size={18} /> Create Menu
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-8 min-h-[500px]">
                        <h2 className="text-lg font-semibold mb-6">Menu Structure</h2>
                        <div className="space-y-4 w-full">
                            <SortableContext items={menu.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                {menu.map((module, pIndex) => (
                                    <SortableModule
                                        key={module.id}
                                        module={module}
                                        onEdit={() => {
                                            setEditingItem({ type: 'module', pIndex, data: module });
                                            setFormData({ ...module });
                                            setModalOpen(true);
                                        }}
                                        onAddScreen={() => {
                                            setEditingItem({ type: 'screen', pIndex, cIndex: module.screens?.length || 0, data: {} });
                                            setFormData({ name: '', key: '', route: '', icon: '', isActive: true });
                                            setModalOpen(true);
                                        }}
                                    >
                                        <SortableContext items={(module.screens || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                            {(module.screens || []).map((screen, cIndex) => (
                                                <SortableScreen
                                                    key={screen.id}
                                                    screen={screen}
                                                    onEdit={() => {
                                                        setEditingItem({ type: 'screen', pIndex, cIndex, data: screen });
                                                        setFormData({ ...screen });
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
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingItem.data.id ? 'Edit Item' : 'Create New Menu'}</h2>
                            <button onClick={() => setModalOpen(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. User Management" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Route / URL</label>
                                <Input value={formData.route} onChange={e => setFormData({ ...formData, route: e.target.value })} placeholder="e.g. users" />
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                                <label className="text-sm">Active</label>
                            </div>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveItem}>Save Menu</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
