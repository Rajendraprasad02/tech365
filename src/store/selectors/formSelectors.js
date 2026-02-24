/**
 * Memoized Redux Selectors for Form Builder
 * 
 * Using createSelector from Redux Toolkit to prevent unnecessary re-renders.
 * These selectors return stable references when the underlying data hasn't changed.
 */
import { createSelector } from '@reduxjs/toolkit';

// Base selectors - simple state accessors
export const selectFormBuilderState = (state) => state.formBuilder;
export const selectScreens = (state) => state.formBuilder.screens;
export const selectSelectedScreenId = (state) => state.formBuilder.selectedScreenId;
export const selectSelectedFieldId = (state) => state.formBuilder.selectedFieldId;
export const selectTitle = (state) => state.formBuilder.title;
export const selectDescription = (state) => state.formBuilder.description;

/**
 * Get all fields flattened from all screens
 * Returns stable reference when screens haven't changed
 */
export const selectAllFields = createSelector(
    [selectScreens],
    (screens) => screens.flatMap(screen => screen.fields)
);

/**
 * Get fields for a specific screen
 * Usage: useSelector(state => selectFieldsByScreenId(state, screenId))
 */
export const selectFieldsByScreenId = createSelector(
    [selectScreens, (_, screenId) => screenId],
    (screens, screenId) => {
        const screen = screens.find(s => s.id === screenId);
        return screen?.fields || [];
    }
);

/**
 * Get the currently selected screen
 */
export const selectCurrentScreen = createSelector(
    [selectScreens, selectSelectedScreenId],
    (screens, selectedScreenId) => screens.find(s => s.id === selectedScreenId)
);

/**
 * Get the currently selected field
 */
export const selectSelectedField = createSelector(
    [selectAllFields, selectSelectedFieldId],
    (allFields, selectedFieldId) => {
        if (!selectedFieldId) return null;
        return allFields.find(f => f.id === selectedFieldId) || null;
    }
);

/**
 * Get available fields for conditional logic (excluding a specific field to avoid cycles)
 * Usage: useSelector(state => selectAvailableFieldsForLogic(state, excludeFieldId))
 */
export const selectAvailableFieldsForLogic = createSelector(
    [selectAllFields, (_, excludeFieldId) => excludeFieldId],
    (allFields, excludeFieldId) => allFields.filter(f => f.id !== excludeFieldId)
);
