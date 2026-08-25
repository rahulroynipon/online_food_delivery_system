import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
  Alert 
} from '../design-system';
import { Mail, Lock, UtensilsCrossed, ArrowRight, Shield } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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

  // If already authenticated, redirect to home/dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    setSubmissionError(null);
    const success = await login(data.email, data.password, data.rememberMe);
    if (success) {
      if (data.rememberMe) {
        localStorage.setItem('remembered_email', data.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      navigate('/');
    }
  };

  const handleQuickFill = () => {
    setValue('email', 'admin@fooddelivery.com');
    setValue('password', 'admin123');
    setSubmissionError(null);
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
                <a href="#forgot" className="text-primary hover:underline font-medium">
                  Forgot Password?
                </a>
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

            {/* Quick Demo Credentials Info Banner */}
            <div 
              onClick={handleQuickFill}
              className="group/demo p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover/demo:scale-105 transition-transform duration-200 shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-foreground">
                    System Administrator Login
                  </p>
                  <span className="text-[10px] text-primary font-semibold group-hover/demo:underline">
                    Autofill
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                  Email: <span className="font-mono text-foreground select-all">admin@fooddelivery.com</span>
                  <br />
                  Password: <span className="font-mono text-foreground select-all">admin123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Don't have an account?{' '}
          <a href="#signup" className="text-primary font-semibold hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
