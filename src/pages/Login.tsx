import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Store, User as UserIcon, ShieldCheck, Key, Eye, EyeOff } from 'lucide-react';
import { User, UserRole } from '../types';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, loginWithGoogle, resetPassword, currentUser } = useAppContext();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  const isSignup = searchParams.get('mode') === 'signup';
  const defaultRole = (searchParams.get('role') as UserRole) || 'customer';

  const [isLoginMode, setIsLoginMode] = useState(!isSignup);
  const [role, setRole] = useState<UserRole>(defaultRole);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    adminSecret: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  useEffect(() => {
    if (isAuthenticating && currentUser) {
      setIsAuthenticating(false);
      const redirect = searchParams.get('redirect');
      const from = (location.state as any)?.from;
      
      if (redirect) {
        navigate(redirect);
      } else if (from) {
        navigate(from.pathname, { state: from.state });
      } else {
        // Redirect based on role
        if (currentUser.role === 'admin' || currentUser.email === 'bushraanwar854@gmail.com') navigate('/admin');
        else if (currentUser.role === 'vendor') navigate('/vendor');
        else if (currentUser.role === 'investor') navigate('/investor');
        else navigate('/customer');
      }
    }
  }, [currentUser, isAuthenticating, navigate, searchParams, location]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      if (isForgotPasswordMode) {
        await resetPassword(formData.email);
        setResetSent(true);
        return;
      }

      if (isLoginMode) {
        await login(formData.email, formData.password);
      } else {
        // Signup mode
        if (role === 'admin' && formData.adminSecret !== 'HALAL_ADMIN_2026') {
          throw new Error("Invalid admin secret key.");
        }

        await signup(formData.email, formData.password, {
          name: formData.name,
          role: role,
          storeName: role === 'vendor' ? (formData.storeName || `${formData.name}'s Store`) : undefined,
        });
      }

      setIsAuthenticating(true);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError(err.message || "An error occurred during authentication.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setIsAuthenticating(true);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("The sign-in popup was closed before completion. Please try again.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Only one sign-in popup can be open at a time.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid credentials. Please try again.");
      } else {
        setError(err.message || "An error occurred during Google authentication.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <Store className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {isForgotPasswordMode ? 'Reset Password' : 'Welcome to Halal Market'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isForgotPasswordMode 
              ? 'Enter your email to receive a reset link' 
              : 'Sign in or create an account to continue'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {resetSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <span className="font-bold">{formData.email}</span>.
            </p>
            <button
              onClick={() => {
                setResetSent(false);
                setIsForgotPasswordMode(false);
                setIsLoginMode(true);
              }}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Role Selection (Only for Signup) */}
            {!isLoginMode && !isForgotPasswordMode && (
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    role === 'customer' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-gray-100 hover:border-emerald-200 text-gray-500'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('vendor')}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    role === 'vendor' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-gray-100 hover:border-emerald-200 text-gray-500'
                  }`}
                >
                  <Store className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Vendor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    role === 'admin' 
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm' 
                      : 'border-gray-100 hover:border-emerald-200 text-gray-500'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Admin</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    required 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                    placeholder="John Doe"
                  />
                </div>
              )}

              {!isLoginMode && role === 'vendor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input 
                    required 
                    type="text" 
                    name="storeName" 
                    value={formData.storeName} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    placeholder="Halal Fresh Meats"
                  />
                </div>
              )}

              {!isLoginMode && role === 'admin' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                    <Key className="w-4 h-4" />
                    <span className="text-sm">Admin Verification</span>
                  </div>
                  <p className="text-xs text-emerald-600 mb-3">
                    To register as an administrator, please enter the platform's secret admin key.
                  </p>
                  <div className="relative">
                    <input 
                      required 
                      type={showAdminSecret ? "text" : "password"} 
                      name="adminSecret" 
                      value={formData.adminSecret} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-2 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white pr-10" 
                      placeholder="Enter Admin Secret Key"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminSecret(!showAdminSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  required 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                  placeholder="you@example.com"
                />
              </div>

              {!isForgotPasswordMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-10" 
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {isLoginMode && !isForgotPasswordMode && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordMode(true)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md mt-6 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isForgotPasswordMode ? 'Send Reset Link' : (isLoginMode ? 'Sign In' : 'Create Account'))}
              </button>

              {!isForgotPasswordMode && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
                    <span>Google</span>
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => {
                  if (isForgotPasswordMode) {
                    setIsForgotPasswordMode(false);
                    setIsLoginMode(true);
                  } else {
                    setIsLoginMode(!isLoginMode);
                  }
                }}
                className="text-green-600 hover:underline text-sm font-medium"
              >
                {isForgotPasswordMode 
                  ? "Back to Sign In"
                  : (isLoginMode 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
