export interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: 'user' | 'admin' | 'distributor' | 'superAdmin';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserState {
  currentUser: User | null;
  users: {
    allUsers: User[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
} 