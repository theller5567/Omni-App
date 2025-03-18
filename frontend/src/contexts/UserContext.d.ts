import React, { ReactNode } from 'react';
interface User {
    id: string;
    name: string;
    email: string;
}
interface UserContextType {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;
}
export declare const UserProvider: React.FC<{
    children: ReactNode;
}>;
export declare const useUser: () => UserContextType;
export {};
