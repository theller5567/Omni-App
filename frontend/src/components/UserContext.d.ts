import React from 'react';
interface User {
    id: string;
    name: string;
    email: string;
}
interface UserContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
export declare const UserProvider: React.FC<React.PropsWithChildren<{}>>;
export declare const useUser: () => UserContextType;
export {};
