import React, { useState } from 'react';
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
import { Mail, Lock, UtensilsCrossed, ArrowRight, User, Phone } from 'lucide-react';

interface SignupFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<SignupFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    }
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setSubmissionError(null);
    try {
      // Ensure phone contains prefix +88 if not already present
      const formattedPhone = data.phone.startsWith('+88') ? data.phone : `+88${data.phone}`;
      
      const payload = {
        ...data,
        phone: formattedPhone
      };

      const response = await api.post('/v1/auth/register', payload);
      if (response.data?.success) {
        toast.success('Registration successful! Please sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please check your inputs.';
      setSubmissionError(message);
    } finally {
      setIsLoading(false);
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

        {/* Signup Card */}
        <Card hoverable className="backdrop-blur-md bg-card/80 border-border shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pt-8 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight">Create Account</CardTitle>
            <CardDescription>Sign up as a customer to start ordering food</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-0 px-8 pb-8">
            {/* Show API or submission errors */}
            {submissionError && (
              <Alert 
                severity="error" 
                title="Registration Error"
                className="rounded-xl"
              >
                {submissionError}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register('name', {
                  required: 'Full name is required',
                })}
                disabled={isLoading}
                clearable
                className="w-full"
              />

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
                label="Phone Number"
                prefix="+88"
                type="text"
                placeholder="017XXXXXXXX"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: {
                    value: /^01[3-9]\d{8}$/,
                    message: 'Phone number must be an 11-digit mobile number starting with 01'
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

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="shadow-md shadow-primary/10 mt-2"
              >
                Sign Up
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-2 text-xs text-muted-foreground">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
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
