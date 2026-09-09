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
import { Mail, Lock, UtensilsCrossed, ArrowRight, ShieldCheck, Store, Bike, User, Sparkles } from 'lucide-react';

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'bitespeed@demo.com',
    password: '123456',
    icon: ShieldCheck,
    colorClass: 'text-purple-600 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100/70 dark:hover:bg-purple-900/40',
    activeClass: 'ring-2 ring-purple-500 border-transparent bg-purple-100 dark:bg-purple-900/50',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
  },
  {
    role: 'Restaurant',
    email: 'merchant@demo.com',
    password: '123456',
    icon: Store,
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/70 dark:hover:bg-amber-900/40',
    activeClass: 'ring-2 ring-amber-500 border-transparent bg-amber-100 dark:bg-amber-900/50',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  },
  {
    role: 'Rider',
    email: 'rider@demo.com',
    password: '123456',
    icon: Bike,
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40',
    activeClass: 'ring-2 ring-emerald-500 border-transparent bg-emerald-100 dark:bg-emerald-900/50',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  {
    role: 'Customer',
    email: 'customer@demo.com',
    password: '123456',
    icon: User,
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100/70 dark:hover:bg-blue-900/40',
    activeClass: 'ring-2 ring-blue-500 border-transparent bg-blue-100 dark:bg-blue-900/50',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  }
];

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
    watch,
    formState: { errors } 
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: rememberedEmail,
      password: '',
      rememberMe: !!rememberedEmail,
    }
  });

  const currentEmail = watch('email');

  const handleDemoSelect = (email: string, password: string, roleName: string) => {
    setValue('email', email, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setValue('password', password, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    setSubmissionError(null);
    toast.info(`Filled ${roleName} credentials (${email})`);
  };

  const redirectBasedOnRole = (usr: any) => {
    if (!usr) return;
    if (usr.role === 'ADMIN') {
      navigate('/admin');
    } else if (usr.role === 'RESTAURANT') {
      navigate('/restaurant');
    } else if (usr.role === 'RIDER') {
      navigate('/rider');
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
    <div className="min-h-screen flex items-center justify-center bg-radial from-primary-hover/10 via-background to-background px-4 py-8 relative overflow-hidden select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ring/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Logo and Title */}
        <Link to="/" className="flex flex-col items-center mb-6 group cursor-pointer">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-3 group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent group-hover:text-primary transition-colors">
            BiteSpeed
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Online Food Delivery System
          </p>
        </Link>

        {/* Login Card */}
        <Card hoverable className="backdrop-blur-md bg-card/80 border-border shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-6 pb-3">
            <CardTitle className="text-xl font-semibold tracking-tight">Welcome Back</CardTitle>
            <CardDescription>Enter your credentials or select a demo user below</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 pt-0 px-6 sm:px-8 pb-6">
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

            {/* Quick Demo Showcase Accounts */}
            <div className="rounded-xl p-3 bg-muted/40 border border-border/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                  Demo Showcase Accounts
                </span>
                <span className="text-[10px] text-muted-foreground/80 font-medium">Click to auto-fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  const isActive = currentEmail === account.email;
                  return (
                    <button
                      key={account.role}
                      type="button"
                      onClick={() => handleDemoSelect(account.email, account.password, account.role)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all duration-200 cursor-pointer group hover:scale-[1.02] active:scale-[0.98] ${
                        isActive ? account.activeClass : account.bgClass
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${account.iconBg} shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {account.role}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate font-mono">
                          {account.email}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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

        <div className="text-center mt-6 space-y-2 text-xs text-muted-foreground">
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
