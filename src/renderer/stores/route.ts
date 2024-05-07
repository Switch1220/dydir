import { create } from "zustand";

export enum Route {
  // steps
  OPTIONS,
  SELECTING,
  RESULT,

  // setting
  SETTINGS,
}

interface RouteState {
  current: Route;

  next: () => void;
  back: () => void;

  push: (route: Route) => void;
}

export const useRouteStore = create<RouteState>()((set) => ({
  current: Route.SETTINGS,

  next: () =>
    set((state) => {
      if (state.current >= 0 && state.current < 3) {
        return {
          current: state.current + 1,
        };
      }

      return {};
    }),
  back: () => {
    set((state) => {
      if (state.current > 0 && state.current < 3) {
        return {
          current: state.current - 1,
        };
      }

      return {};
    });
  },

  push: (route) => set((state) => ({ current: route, prev: state.current })),
}));
