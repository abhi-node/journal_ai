import { createSlice } from '@reduxjs/toolkit';

interface UserState {
  profile: any | null;
  goals: any | null;
  stats: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  goals: null,
  stats: null,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // TODO: Add user actions
  },
});

export default userSlice.reducer;