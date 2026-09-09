import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../lib/axios';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  Alert,
  toast
} from '../design-system';
import { Mail, Lock, UtensilsCrossed, ArrowRight, KeyRound, RefreshCw } from 'lucide-react';

interface RequestCodeValues {
  email: string;
}

interface ResetPasswordValues {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Form hooks
  const { 
    register: registerRequest, 
    handleSubmit: handleSubmitRequest, 
    formState: { errors: requestErrors } 
  } = useForm<RequestCodeValues>();

  const { 
    register: registerReset, 
    handleSubmit: handleSubmitReset, 
    watch: watchReset,
    formState: { errors: resetErrors } 
  } = useForm<ResetPasswordValues>();

  // Watch fields to validate confirmation password
  const newPasswordVal = watchReset('newPassword');

  // Timer countdown for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onRequestCode = async (data: RequestCodeValues) => {
    setIsLoading(true);
    setSubmissionError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data?.success) {
        setEmail(data.email);
        toast.success('A password reset code has been sent to your email.');
        setStep(2);
        setCountdown(60);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to request reset code. User not found or connection error.';
      setSubmissionError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordValues) => {
    if (data.newPassword !== data.confirmPassword) {
      setSubmissionError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setSubmissionError(null);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp: data.otp,
        newPassword: data.newPassword
      });
      if (response.data?.success) {
        toast.success('Password reset successful! You can now sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Password reset failed. Invalid or expired code.';
      setSubmissionError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setSubmissionError(null);
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose: 'PASSWORD_RESET' });
      if (response.data?.success) {
        toast.success('Reset code resent successfully.');
        setCountdown(60);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend code.';
      setSubmissionError(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-primary-hover/10 via-background to-background px-4 relative overflow-hidden select-none">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ring/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Brand Logo and Title */}
        <Link to="/" className="flex flex-col items-center mb-8 group cursor-pointer">
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

        {/* Forgot Password Card */}
        <Card hoverable className="backdrop-blur-md bg-card/80 border-border shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              {step === 1 ? 'Forgot Password?' : 'Reset Password'}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Enter your email and we will send you a 6-digit code to reset your password.'
                : `Enter the code sent to ${email} along with your new password.`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-0 px-8 pb-8">
            {submissionError && (
              <Alert 
                severity="error" 
                title="Error"
                className="rounded-xl"
              >
                {submissionError}
              </Alert>
            )}

            {step === 1 ? (
              <form onSubmit={handleSubmitRequest(onRequestCode)} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={requestErrors.email?.message}
                  {...registerRequest('email', {
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

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="shadow-md shadow-primary/10 mt-2"
                >
                  Send Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmitReset(onResetPassword)} className="space-y-4">
                {/* Hidden input to capture browser credentials autofill */}
                <input
                  type="text"
                  name="email"
                  value={email}
                  autoComplete="username"
                  style={{ display: 'none' }}
                  readOnly
                />

                <Input
                  label="Reset Code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  error={resetErrors.otp?.message}
                  {...registerReset('otp', {
                    required: 'Verification code is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Code must be exactly 6 digits'
                    }
                  })}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  className="w-full"
                  inputClassName="text-center tracking-[1em] text-lg font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground/60"
                />

                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={resetErrors.newPassword?.message}
                  {...registerReset('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    }
                  })}
                  disabled={isLoading}
                  passwordToggle
                  className="w-full"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={resetErrors.confirmPassword?.message}
                  {...registerReset('confirmPassword', {
                    required: 'Confirm password is required',
                    validate: (value) => value === newPasswordVal || 'Passwords do not match',
                  })}
                  disabled={isLoading}
                  passwordToggle
                  className="w-full"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                  className="shadow-md shadow-primary/10"
                >
                  Reset Password
                </Button>
              </form>
            )}

            {step === 2 && (
              <div className="flex flex-col items-center justify-center space-y-2 pt-2 text-xs">
                <p className="text-muted-foreground text-center">
                  Didn't receive code?{' '}
                  {countdown > 0 ? (
                    <span className="font-semibold text-primary">Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={isResending}
                      className="text-primary font-semibold hover:underline inline-flex items-center gap-1 focus:outline-none disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                      Resend Code
                    </button>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground hover:underline"
                >
                  Use a different email address
                </button>
              </div>
            )}

            <div className="text-center mt-4">
              <Link to="/login" className="text-xs text-primary font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
