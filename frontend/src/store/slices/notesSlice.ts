import { createSlice } from '@reduxjs/toolkit';

interface NotesState {
  dailyNotes: any[];
  loading: boolean;
  error: string | null;
}

const initialState: NotesState = {
  dailyNotes: [],
  loading: false,
  error: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // TODO: Add notes actions
  },
});

export default notesSlice.reducer;