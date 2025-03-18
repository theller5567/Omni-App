declare class UserService {
    private user;
    setUser(user: {
        id: string;
        name: string;
        email: string;
    }): void;
    getUser(): {
        id: string;
        name: string;
        email: string;
    } | null;
    clearUser(): void;
}
declare const _default: UserService;
export default _default;
