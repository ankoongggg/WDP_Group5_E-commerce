import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi, setTokens } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser, user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      processedRef.current = true;
      setStatus('error');
      toast.error(error === 'no_email' ? 'Google account has no email' : 'Google sign in failed');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!token) {
      processedRef.current = true;
      setStatus('error');
      toast.error('Invalid callback');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    processedRef.current = true;
    const finish = async () => {
      try {
        setTokens(token, '');
        await refreshUser();
        setStatus('success');
        toast.success('Signed in with Google!');
        navigate(user?.role?.includes('admin') ? '/admin' : '/', { replace: true });
      } catch (err) {
        setStatus('error');
        toast.error('Failed to complete sign in');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    finish();
  }, [searchParams, navigate, toast, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-background-dark dark:text-white">Completing sign in...</p>
          </>
        )}
        {status === 'success' && (
          <p className="text-background-dark dark:text-white">Redirecting...</p>
        )}
        {status === 'error' && (
          <p className="text-red-500">Something went wrong. Redirecting to login...</p>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
