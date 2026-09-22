import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    api.warmup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!teamName.trim()) {
        setError('Please enter your team or organization name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setError(null);
    setLoading(true);
    setStatusMessage(isRegister ? 'Creating account...' : 'Signing in...');

    const handleStatusUpdate = (msg: string) => {
      setStatusMessage(msg);
    };

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (isRegister) {
        await register(
          {
            name: name.trim(),
            email: cleanEmail,
            password: password.trim(),
            teamName: teamName.trim(),
            role: 'LEAD',
          },
          handleStatusUpdate
        );
      } else {
        await login(cleanEmail, password.trim(), handleStatusUpdate);
      }
      window.dispatchEvent(new CustomEvent('jvm_fresh_login'));
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Centered Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-700 text-white font-bold text-lg shadow-sm mb-4">
          ES
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          {isRegister ? 'Create your account' : 'Sign in to your account'}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {isRegister
            ? 'Get started with your engineering workspace'
            : 'Welcome back! Please enter your credentials'}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team or Company Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Engineering Team"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-gray-50"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onMouseEnter={api.warmup}
                onFocus={api.warmup}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus={!isRegister}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onMouseEnter={api.warmup}
                  onFocus={api.warmup}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Minimum 6 characters' : 'Enter your password'}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={api.warmup}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" />
                    <span>{statusMessage || (isRegister ? 'Creating account...' : 'Signing in...')}</span>
                  </>
                ) : (
                  <span>{isRegister ? 'Create account' : 'Sign in'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Toggle between Sign in & Sign up */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-600">
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Simple Minimal Footer */}
        <p className="mt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} EngineerSpace. All rights reserved.
        </p>
      </div>
    </div>
  );
};
