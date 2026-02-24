import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import formBuilderReducer from './slices/formBuilderSlice';
import formReducer from './slices/formSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        formBuilder: formBuilderReducer,
        form: formReducer,
    },
});
