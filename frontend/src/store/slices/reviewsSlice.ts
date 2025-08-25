import { createSlice } from '@reduxjs/toolkit';

interface ReviewsState {
  dailyReview: any | null;
  weeklyReview: any | null;
  reviewHistory: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ReviewsState = {
  dailyReview: null,
  weeklyReview: null,
  reviewHistory: [],
  loading: false,
  error: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    // TODO: Add reviews actions
  },
});

export default reviewsSlice.reducer;