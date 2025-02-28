import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


interface SetupPasswordResponse {
  message: string;
}

const PasswordSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string().required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
        .required('Confirm Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const response = await axios.post<SetupPasswordResponse>('/api/auth/setup-password', { token, password: values.password });
        toast.success(response.data.message);
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after success
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    },
  });

  return (
    <div>
      <h2>Set Your Password</h2>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
          />
          {formik.touched.password && formik.errors.password ? (
            <div style={{ color: 'red' }}>{formik.errors.password}</div>
          ) : null}
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            required
          />
          {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
            <div style={{ color: 'red' }}>{formik.errors.confirmPassword}</div>
          ) : null}
        </div>
        <button type="submit">Set Password</button>
      </form>
    </div>
  );
};

export default PasswordSetup; 