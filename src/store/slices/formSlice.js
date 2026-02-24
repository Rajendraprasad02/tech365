import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchFormSchema = createAsyncThunk(
    'form/fetchSchema',
    async (formId, { rejectWithValue }) => {
        try {
            const response = await api.getFormSchema(formId);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const submitFormResponse = createAsyncThunk(
    'form/submitResponse',
    async ({ formId, data }, { rejectWithValue }) => {
        try {
            const response = await api.submitForm(formId, data);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const formSlice = createSlice({
    name: 'form',
    initialState: {
        schema: null,
        responses: {},
        errors: {},
        loading: false,
        submitting: false,
        submitSuccess: false,
        error: null,
    },
    reducers: {
        updateResponse: (state, action) => {
            const { fieldName, value } = action.payload;
            state.responses[fieldName] = value;
            if (state.errors[fieldName]) {
                delete state.errors[fieldName];
            }
        },
        setErrors: (state, action) => {
            state.errors = action.payload;
        },
        resetForm: (state) => {
            state.responses = {};
            state.errors = {};
            state.submitSuccess = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFormSchema.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFormSchema.fulfilled, (state, action) => {
                state.loading = false;
                state.schema = action.payload;
            })
            .addCase(fetchFormSchema.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(submitFormResponse.pending, (state) => {
                state.submitting = true;
                state.submitSuccess = false;
                state.error = null;
            })
            .addCase(submitFormResponse.fulfilled, (state) => {
                state.submitting = false;
                state.submitSuccess = true;
            })
            .addCase(submitFormResponse.rejected, (state, action) => {
                state.submitting = false;
                state.submitSuccess = false;
                state.error = action.payload;
            });
    },
});

export const { updateResponse, setErrors, resetForm } = formSlice.actions;
export default formSlice.reducer;
