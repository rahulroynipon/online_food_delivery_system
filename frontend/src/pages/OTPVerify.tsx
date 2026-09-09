import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { UtensilsCrossed, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function OTPVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Timer countdown for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Missing email address. Please register again.');
      return;
    }
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      if (response.data?.success) {
        toast.success('Email verified successfully! You can now sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Missing email address. Please register again.');
      return;
    }

    setIsResending(true);
    setError(null);

    try {
      const response = await api.post('/auth/resend-otp', { email, purpose: 'REGISTRATION' });
      if (response.data?.success) {
        toast.success('Verification code resent successfully.');
        setCountdown(60); // 60s cooldown
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to resend code.';
      setError(message);
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

        {/* OTP Card */}
        <Card hoverable className="backdrop-blur-md bg-card/80 border-border shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to <span className="font-medium text-foreground block mt-1 break-all">{email}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-0 px-8 pb-8">
            {error && (
              <Alert 
                severity="error" 
                title="Verification Error"
                className="rounded-xl"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex flex-col items-center justify-center">
                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  className="w-full"
                  inputClassName="text-center tracking-[1em] text-lg font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-muted-foreground/60"
                  clearable
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="shadow-md shadow-primary/10"
              >
                Verify Code
              </Button>
            </form>

            <div className="flex flex-col items-center justify-center space-y-3 pt-2 text-xs">
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
              
              <Link to="/signup" className="text-muted-foreground hover:underline">
                Back to Sign Up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
