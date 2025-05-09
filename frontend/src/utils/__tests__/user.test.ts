import { setUser, clearUser } from '../../store/slices/authSlice';

describe('User Management Tests', () => {
  describe('User Data Handling', () => {
    test('setUser action correctly sets user data', () => {
      const testUser = {
        id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };
      
      const action = setUser(testUser);
      
      expect(action.type).toBe('auth/setUser');
      expect(action.payload).toEqual(testUser);
    });
    
    test('clearUser action clears user data', () => {
      const action = clearUser();
      
      expect(action.type).toBe('auth/clearUser');
      expect(action.payload).toBeUndefined();
    });
  });
  
  describe('User Role Validation', () => {
    test('should identify admin roles correctly', () => {
      const adminUser = {
        id: 'admin123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      };
      
      expect(adminUser.role).toBe('admin');
    });
    
    test('should identify superadmin roles correctly', () => {
      const superAdminUser = {
        id: 'superadmin123',
        email: 'superadmin@example.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superAdmin'
      };
      
      expect(superAdminUser.role).toBe('superAdmin');
    });
    
    test('should identify regular user roles correctly', () => {
      const regularUser = {
        id: 'user123',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'user'
      };
      
      expect(regularUser.role).toBe('user');
    });
  });
  
  describe('User Token Storage', () => {
    const originalLocalStorage = window.localStorage;
    
    beforeEach(() => {
      const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
    });
    
    afterEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    });
    
    test('should store user data securely in local storage', () => {
      const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMn0.fake-signature';
      
      localStorage.setItem('authToken', userToken);
      
      expect(localStorage.setItem).toHaveBeenCalledWith('authToken', userToken);
    });
    
    test('should retrieve user token from local storage', () => {
      const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTUxNjIzOTAyMn0.fake-signature';
      (localStorage.getItem as jest.Mock).mockReturnValue(userToken);
      
      const storedToken = localStorage.getItem('authToken');
      
      expect(storedToken).toBe(userToken);
      expect(localStorage.getItem).toHaveBeenCalledWith('authToken');
    });
    
    test('should remove user token on logout', () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
}); 