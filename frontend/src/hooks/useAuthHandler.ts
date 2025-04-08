import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register, login } from '../store/slices/authSlice';
import { setUser } from '../store/slices/userSlice';
import { AppDispatch } from '../store/store';

export const useAuthHandler = (formData: any, isSignUp: boolean) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);

    try {
      if (isSignUp) {
        const response = await dispatch(register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.email, // Using email as username
          password: formData.password || '123456' // Default password
        }));
        console.log('Registration response:', response);
      } else {
        const response = await dispatch(login({
          email: formData.email,
          password: formData.password
        }));
        if (response.payload && typeof response.payload === 'object' && 'token' in response.payload && 'user' in response.payload) {
          const { token, user } = response.payload as { token: string, user: any };
          console.log('Login successful, token:', token);
          console.log('User data:', user);
          
          // Store tokens and redirect
          localStorage.setItem('authToken', token);
          dispatch(setUser(user));
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return { handleSubmit };
}; 