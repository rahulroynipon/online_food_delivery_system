import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Button, 
  Input, 
  Checkbox,
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Alert,
  toast
} from '../design-system';
import { Mail, Lock, UtensilsCrossed, ArrowRight } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated, isLoading, error, user } = useAuthStore();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleGoogleLoginSuccess = async (credential: string) => {
    setSubmissionError(null);
    const success = await loginWithGoogle(credential);
    if (success) {
      const currentUser = useAuthStore.getState().user;
      redirectBasedOnRole(currentUser);
    }
  };

  // Load remembered email on startup
  const rememberedEmail = localStorage.getItem('remembered_email') || '';

  const { 
    register, 
    handleSubmit, 
    setValue, 
    formState: { errors } 
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: rememberedEmail,
      password: '',
      rememberMe: !!rememberedEmail,
    }
  });

  const redirectBasedOnRole = (usr: any) => {
    if (!usr) return;
    if (usr.role === 'ADMIN') {
      navigate('/admin');
    } else if (usr.role === 'RESTAURANT') {
      navigate('/restaurant');
    } else {
      navigate('/');
    }
  };

  // If already authenticated, redirect to role-specific dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectBasedOnRole(user);
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setSubmissionError(null);
    const result = await login(data.email, data.password, data.rememberMe);
    if (result.success) {
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      const currentUser = useAuthStore.getState().user;
      redirectBasedOnRole(currentUser);
    } else if (result.isUnverified) {
      toast.warning('Please verify your email address first.');
      navigate(`/otp-verify?email=${encodeURIComponent(result.email || data.email)}`);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-primary-hover/10 via-background to-background px-4 relative overflow-hidden select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ring/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-3 hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            BiteSpeed
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Online Food Delivery System
          </p>
        </div>

        {/* Login Card */}
        <Card hoverable className="backdrop-blur-md bg-card/80 border-border shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-0 px-8 pb-8">
            {/* Show API or submission errors */}
            {(error || submissionError) && (
              <Alert 
                severity="error" 
                title="Authentication Error"
                className="rounded-xl"
              >
                {submissionError || error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  }
                })}
                disabled={isLoading}
                clearable
                className="w-full"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  }
                })}
                disabled={isLoading}
                passwordToggle
                className="w-full"
              />

              <div className="flex justify-between items-center text-xs pt-1">
                <Checkbox 
                  label="Remember me" 
                  className="w-auto"
                  size='sm'
                  disabled={isLoading}
                  {...register('rememberMe')}
                />
                <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="shadow-md shadow-primary/10"
              >
                Sign In
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    handleGoogleLoginSuccess(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  toast.error('Google Sign In failed.');
                }}
                theme="outline"
                shape="rectangular"
                width="380"
              />
            </div>

          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-2 text-xs text-muted-foreground">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
          <p>
            Want to partner with us?{' '}
            <Link to="/partner" className="text-primary font-semibold hover:underline">
              Become a Partner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
