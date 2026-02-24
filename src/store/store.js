import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import formReducer from './slices/formSlice';
import formBuilderReducer, { loadSavedState } from './slices/formBuilderSlice';

// Load state from localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('formBuilderState');
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch (err) {
        return undefined;
    }
};

// Save state to localStorage
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('formBuilderState', serializedState);
    } catch {
        // Validation errors etc.
    }
};

const preloadedFormBuilder = loadState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
        form: formReducer,
        formBuilder: formBuilderReducer,
    },
});

// If we have saved state, dispatch action to load it
// We do this instead of passing preloadedState to configureStore to avoid
// overwriting the initial state structure if the saved state is partial/outdated
if (preloadedFormBuilder) {
    store.dispatch(loadSavedState(preloadedFormBuilder));
}

// Subscribe to store changes
store.subscribe(() => {
    const state = store.getState();
    if (state.formBuilder) {
        saveState(state.formBuilder);
    }
});
