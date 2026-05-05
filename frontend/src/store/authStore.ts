import { create } from "zustand";

type AuthState = {
  token: string | null;
  setToken: (token: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()((set) => {
  const token = localStorage.getItem("pb_token");
  return {
    token,
    setToken: (next) => {
      localStorage.setItem("pb_token", next);
      set({ token: next });
    },
    clear: () => {
      localStorage.removeItem("pb_token");
      set({ token: null });
    }
  };
});

