import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RelayUser } from "../../types/session";
import { setAccessToken } from "../../api/axiosInstance";

interface AuthState {
  user: RelayUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: RelayUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      setAccessToken(action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      setAccessToken("");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
