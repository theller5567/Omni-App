import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../store/slices/authSlice';
import { setUser } from '../store/slices/userSlice';
import { AppDispatch } from '../store/store';

export const useAuthHandler = (formData: any, isSignUp: boolean) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form Data:', formData);
    try {
      if (isSignUp) {
        const response = await dispatch(registerUser({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email }));
        console.log('Registration response:', response);
      } else {
        const response = await dispatch(loginUser({ email: formData.email, password: formData.password }));
        if (response.payload && typeof response.payload === 'object' && 'token' in response.payload && 'user' in response.payload) {
          const { token, user } = response.payload as { token: string, user: any };
          localStorage.setItem('authToken', token);
          dispatch(setUser(user));
          console.log('User logged in successfully:', user);
          navigate('/media-library');
        } else {
          console.error('Invalid login response:', response.payload);
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
    }
  };

  return handleSubmit;
}; 