export type UserState = {
    _id: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    isLoading: boolean;
};
export declare const useAuth: () => {
    user: UserState;
    isAuthenticated: boolean;
};
export declare const setUser: import("@reduxjs/toolkit").ActionCreatorWithPayload<UserState, "user/setUser">, clearUser: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"user/clearUser">;
declare const _default: import("redux").Reducer<UserState>;
export default _default;
