import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialScreenId = `screen_${Date.now().toString(36)}`;

const initialState = {
    formId: null, // Track the saved form ID
    title: 'Untitled Form',
    description: '',
    screens: [
        {
            id: initialScreenId,
            title: 'Screen 1',
            fields: []
        }
    ],
    selectedScreenId: initialScreenId,
    selectedFieldId: null,

    // Saving State
    saving: false,
    error: null,

    // Publishing State
    publishing: false,
    published: false,
    publishError: null
};

// Helper to generate unique IDs
const generateId = (type) => {
    return `${type}_${Date.now().toString(36)}`;
};

export const saveForm = createAsyncThunk(
    'formBuilder/saveForm',
    async (formData, { getState, rejectWithValue }) => {
        try {
            const { formId, screens, title, description } = getState().formBuilder;

            const payload = {
                name: title,
                description,
                schema: { // Backend FormCreate expects 'schema' (alias for schema_body)
                    screens: screens.map(s => ({
                        id: s.id,
                        title: s.title,
                        fields: s.fields.map(f => ({
                            id: f.id,
                            type: f.type,
                            label: f.label,
                            placeholder: f.placeholder,
                            options: f.options,
                            validation_rules: f.validation_rules,
                            conditional_logic: f.conditional_logic
                        }))
                    }))
                }
            };

            let response;
            if (formId) {
                console.log(`[FormBuilder] Updating existing form ${formId}...`);
                response = await api.updateForm(formId, payload);
            } else {
                console.log('[FormBuilder] Creating new form...');
                response = await api.createForm(payload);
            }

            return response;

        } catch (err) {
            console.error('Save Form Error:', err);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const publishForm = createAsyncThunk(
    'formBuilder/publishForm',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { formId } = getState().formBuilder;
            if (!formId) {
                throw new Error("Form must be saved before publishing.");
            }

            console.log(`[FormBuilder] Publishing form ${formId}...`);
            const response = await api.publishForm(formId);
            return response;

        } catch (err) {
            console.error('Publish Form Error:', err);
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const formBuilderSlice = createSlice({
    name: 'formBuilder',
    initialState,
    reducers: {
        setFormMetadata: (state, action) => {
            const { title, description } = action.payload;
            if (title !== undefined) state.title = title;
            if (description !== undefined) state.description = description;
        },
        // Screen Management
        addScreen: (state) => {
            const id = generateId('screen');
            state.screens.push({
                id,
                title: `Screen ${state.screens.length + 1}`,
                fields: []
            });
            state.selectedScreenId = id;
            state.selectedFieldId = null;
        },
        deleteScreen: (state, action) => {
            const id = action.payload;
            if (state.screens.length <= 1) return; // Prevent deleting last screen

            const index = state.screens.findIndex(s => s.id === id);
            if (index !== -1) {
                state.screens.splice(index, 1);
                // Select previous screen or first available
                state.selectedScreenId = state.screens[Math.max(0, index - 1)].id;
                state.selectedFieldId = null;
            }
        },
        selectScreen: (state, action) => {
            state.selectedScreenId = action.payload;
            state.selectedFieldId = null;
        },
        updateScreenTitle: (state, action) => {
            const { id, title } = action.payload;
            const screen = state.screens.find(s => s.id === id);
            if (screen) {
                screen.title = title;
            }
        },

        // Field Management (Scoped to Selected Screen)
        addField: (state, action) => {
            const type = action.payload;
            const screen = state.screens.find(s => s.id === state.selectedScreenId);
            if (!screen) return;

            // Handle Yes/No preset
            if (type === 'yes_no') {
                const id = generateId('radio');
                const newField = {
                    id,
                    type: 'radio',
                    label: 'Confirmation',
                    placeholder: '',
                    required: true,
                    validation_rules: {},
                    options: [
                        { label: 'Yes', value: 'yes' },
                        { label: 'No', value: 'no' }
                    ],
                    conditional_logic: null,
                };
                screen.fields.push(newField);
                state.selectedFieldId = id;
                return;
            }

            const id = generateId(type);
            const newField = {
                id,
                type,
                label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                placeholder: '',
                required: false,
                validation_rules: {},
                options: type === 'select' || type === 'radio' || type === 'checkbox'
                    ? [{ label: 'Option 1', value: 'option_1' }]
                    : undefined,
                conditional_logic: null,
            };
            screen.fields.push(newField);
            state.selectedFieldId = id;
        },
        removeField: (state, action) => {
            const id = action.payload;
            const screen = state.screens.find(s => s.id === state.selectedScreenId);
            if (!screen) return;

            screen.fields = screen.fields.filter(f => f.id !== id);
            if (state.selectedFieldId === id) {
                state.selectedFieldId = null;
            }
        },
        updateField: (state, action) => {
            const { id, updates } = action.payload;
            // Search across all screens since config panel might hold ref to a field in another screen

            for (const screen of state.screens) {
                const fieldIndex = screen.fields.findIndex(f => f.id === id);
                if (fieldIndex !== -1) {
                    screen.fields[fieldIndex] = { ...screen.fields[fieldIndex], ...updates };
                    return;
                }
            }
        },
        updateFieldId: (state, action) => {
            const { oldId, newId } = action.payload;
            if (oldId === newId) return;

            // Check collision across ALL screens
            const exists = state.screens.some(s => s.fields.some(f => f.id === newId));
            if (exists) return;

            for (const screen of state.screens) {
                const fieldIndex = screen.fields.findIndex(f => f.id === oldId);
                if (fieldIndex !== -1) {
                    screen.fields[fieldIndex].id = newId;
                    if (state.selectedFieldId === oldId) {
                        state.selectedFieldId = newId;
                    }
                    // Break after finding and updating the field definition
                    // But we MUST continue to update references in OTHER fields
                }
            }

            // CRITICAL: Update references in conditional_logic of ALL fields
            state.screens.forEach(screen => {
                screen.fields.forEach(field => {
                    const logic = field.conditional_logic;
                    if (logic && logic.conditions) {
                        // Check if any condition references the Old ID
                        let logicUpdated = false;
                        const newConditions = logic.conditions.map(condition => {
                            if (condition.field_id === oldId) {
                                logicUpdated = true;
                                return { ...condition, field_id: newId };
                            }
                            return condition;
                        });

                        if (logicUpdated) {
                            field.conditional_logic = {
                                ...logic,
                                conditions: newConditions
                            };
                        }
                    }
                });
            });
        },
        selectField: (state, action) => {
            state.selectedFieldId = action.payload;
            // Also ensure the screen containing this field is selected (helper for UX)
            for (const screen of state.screens) {
                if (screen.fields.some(f => f.id === action.payload)) {
                    state.selectedScreenId = screen.id;
                    break;
                }
            }
        },
        resetBuilder: () => {
            // Re-initialize with fresh ID
            const newId = `screen_${Date.now().toString(36)}`;
            return {
                ...initialState,
                screens: [{ id: newId, title: 'Screen 1', fields: [] }],
                selectedScreenId: newId
            };
        },
        moveField: (state, action) => {
            const { fromIndex, toIndex } = action.payload;
            const screen = state.screens.find(s => s.id === state.selectedScreenId);
            if (!screen) return;

            if (toIndex < 0 || toIndex >= screen.fields.length) return;

            const result = Array.from(screen.fields);
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            screen.fields = result;
        },
        moveFieldToScreen: (state, action) => {
            const { fieldId, targetScreenId } = action.payload;

            // 1. Find the field object first
            let fieldToMove = null;
            for (const screen of state.screens) {
                const found = screen.fields.find(f => f.id === fieldId);
                if (found) {
                    fieldToMove = found;
                    break;
                }
            }

            if (!fieldToMove) return;

            // 2. Remove the field from ALL screens (safety cleanup)
            state.screens.forEach(screen => {
                screen.fields = screen.fields.filter(f => f.id !== fieldId);
            });

            // 3. Add to target screen
            const targetScreen = state.screens.find(s => s.id === targetScreenId);
            if (targetScreen) {
                targetScreen.fields.push(fieldToMove);
                // Select the new screen so the user sees where it went
                state.selectedScreenId = targetScreenId;
            }
        },
        loadSavedState: (state, action) => {
            return { ...state, ...action.payload };
        }
    },
    extraReducers: (builder) => {
        builder
            // Save Form Handlers
            .addCase(saveForm.pending, (state) => {
                state.saving = true;
                state.error = null;
                // Reset publish state on save
                state.published = false;
                state.publishError = null;
            })
            .addCase(saveForm.fulfilled, (state, action) => {
                state.saving = false;
                if (action.payload && action.payload.id) {
                    state.formId = action.payload.id;
                }
            })
            .addCase(saveForm.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })

            // Publish Form Handlers
            .addCase(publishForm.pending, (state) => {
                state.publishing = true;
                state.publishError = null;
                state.published = false;
            })
            .addCase(publishForm.fulfilled, (state) => {
                state.publishing = false;
                state.published = true;
            })
            .addCase(publishForm.rejected, (state, action) => {
                state.publishing = false;
                state.publishError = action.payload;
            });
    }
});

export const {
    setFormMetadata,
    addScreen,
    deleteScreen,
    selectScreen,
    updateScreenTitle,
    addField,
    removeField,
    updateField,
    updateFieldId,
    selectField,
    resetBuilder,
    moveField,
    moveFieldToScreen,
    loadSavedState
} = formBuilderSlice.actions;

export default formBuilderSlice.reducer;
