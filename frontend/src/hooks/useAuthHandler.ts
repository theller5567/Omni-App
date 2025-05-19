import { useNavigate } from 'react-router-dom';
import { useLogin, useRegister, UserLoginCredentials, UserRegistrationData } from './query-hooks';
import { toast } from 'react-toastify';

export const useAuthHandler = (formData: any, isSignUp: boolean) => {
  const navigate = useNavigate();
  const { mutate: loginUser, isPending: isLoggingIn, error: loginError } = useLogin();
  const { mutate: registerUser, isPending: isRegistering, error: registerError } = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      const registrationData: UserRegistrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username || formData.email,
        password: formData.password,
      };
      registerUser(registrationData, {
        onSuccess: (data) => {
          navigate('/login');
        },
        onError: (error: any) => {
          console.error('Registration failed from useAuthHandler:', error);
        }
      });
    } else {
      const loginCredentials: UserLoginCredentials = {
        email: formData.email,
        password: formData.password,
      };
      loginUser(loginCredentials, {
        onSuccess: (data) => {
          if (data.user?.role === 'admin' || data.user?.role === 'superAdmin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/home');
          }
        },
        onError: (error: any) => {
          console.error('Login failed from useAuthHandler:', error);
        }
      });
    }
  };

  return { 
    handleSubmit, 
    isLoading: isLoggingIn || isRegistering, 
    error: loginError || registerError 
  };
}; 