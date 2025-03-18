interface UserData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
}
export type AuthState = {
    user: UserData | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    message: string | null;
};
export declare const registerUser: import("@reduxjs/toolkit").AsyncThunk<unknown, UserData, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const loginUser: import("@reduxjs/toolkit").AsyncThunk<unknown, {
    email: string;
    password: string;
}, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/logout">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
