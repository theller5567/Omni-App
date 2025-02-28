export default interface User {
    id: string;
    name: string;
    email: string;
    username: string;
    isVerified: boolean;
    verificationToken: string;
    createdAt: string;
}

export interface UserResponse {
    user: User;
    token: string;
}