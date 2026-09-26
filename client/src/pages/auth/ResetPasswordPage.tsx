import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Terminal,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

interface ResetPasswordPageProps {
  onBackToLogin?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin }) => {
  const [token, setToken] = useState<string>('');
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get('token');

    if (!rawToken || !rawToken.trim()) {
      setIsValidating(false);
      setTokenValid(false);
      setTokenError('No reset token provided. Please request a new password reset link.');
      return;
    }

    const cleanToken = rawToken.trim();
    setToken(cleanToken);

    // Validate the token against backend
    const validate = async () => {
      try {
        setIsValidating(true);
        const res = await api.validateResetToken(cleanToken);
        if (res.valid) {
          setTokenValid(true);
          setTokenError(null);
        } else {
          setTokenValid(false);
          setTokenError(res.message || 'This reset link has expired or has already been used.');
        }
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err.message || 'Invalid or expired password reset link.');
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, []);

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      window.history.replaceState({}, '', '/');
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!newPassword.trim()) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await api.resetPassword({
        token,
        newPassword: newPassword.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const isMinLength = newPassword.length >= 8;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent-subtle selection:text-accent relative overflow-hidden bg-grid-pattern">
      {/* Top Header */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-ink text-paper flex items-center justify-center rounded-sm">
            <Terminal className="w-4 h-4 text-paper" />
          </div>
          <span className="font-display font-bold text-sm tracking-tight text-ink">
            EngineerSpace
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">Engineering Team Platform</span>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] my-auto animate-fade-in">
        <div className="bg-paper border border-line p-5 sm:p-10 rounded-sm shadow-sm space-y-6">
          
          {/* 1. VALIDATING TOKEN STATE */}
          {isValidating && (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-surface-soft border border-line mx-auto flex items-center justify-center rounded-sm">
                <Loader2 className="w-6 h-6 text-accent animate-spin" />
              </div>
              <div className="space-y-1">
                <h2 className="font-display text-base font-bold text-ink tracking-tight">
                  Verifying Reset Link
                </h2>
                <p className="text-xs text-muted font-mono">
                  Checking authorization token validity...
                </p>
              </div>
            </div>
          )}

          {/* 2. INVALID / EXPIRED TOKEN STATE */}
          {!isValidating && !tokenValid && (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 bg-attention-subtle border border-attention/30 mx-auto flex items-center justify-center rounded-sm">
                <AlertTriangle className="w-6 h-6 text-attention" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-lg font-bold text-ink tracking-tight">
                  Invalid or Expired Link
                </h1>
                <p className="text-xs text-muted leading-relaxed">
                  {tokenError || 'This password reset link is invalid, expired, or has already been used.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 font-mono"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. SUCCESS STATE */}
          {!isValidating && tokenValid && isSuccess && (
            <div className="text-center space-y-5 animate-fade-in">
              <div className="w-12 h-12 bg-success-soft border border-success/30 mx-auto flex items-center justify-center rounded-sm">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-lg font-bold text-ink tracking-tight">
                  Password Reset Successful
                </h1>
                <p className="text-xs text-muted leading-relaxed">
                  Your password has been updated securely. You can now sign in to your EngineerSpace workspace with your new password.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 font-mono shadow-sm"
                >
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 4. RESET FORM STATE */}
          {!isValidating && tokenValid && !isSuccess && (
            <>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-ink text-paper mx-auto flex items-center justify-center rounded-sm shadow-sm">
                  <KeyRound className="w-6 h-6 text-paper" />
                </div>
                <h1 className="font-display text-xl font-bold text-ink tracking-tight">
                  Set New Password
                </h1>
                <p className="text-xs text-muted">
                  Create a new secure password for your workspace account.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-attention-subtle border border-attention/30 text-attention text-xs rounded-sm animate-fade-in flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold">!</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={submitting}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      autoFocus
                      className="w-full pl-9 pr-9 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted hover:text-ink p-0.5 disabled:opacity-50"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      disabled={submitting}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2.5 bg-paper border border-line focus:border-ink rounded-sm text-base sm:text-xs font-mono outline-none transition-colors text-ink disabled:opacity-60"
                    />
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted hover:text-ink p-0.5 disabled:opacity-50"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Helpers */}
                <div className="bg-surface-soft p-2.5 rounded-sm border border-line space-y-1.5 text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-3.5 h-3.5 ${isMinLength ? 'text-success' : 'text-muted'}`} />
                    <span className={isMinLength ? 'text-success font-medium' : 'text-muted'}>
                      At least 8 characters
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-success' : 'text-attention'}`} />
                      <span className={passwordsMatch ? 'text-success font-medium' : 'text-attention'}>
                        {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting || !isMinLength || !passwordsMatch}
                    className="w-full py-2.5 px-4 bg-ink hover:bg-ink-light text-paper text-xs font-semibold rounded-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 font-mono cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Back to sign in link */}
              <div className="pt-3 border-t border-line flex items-center justify-center text-xs">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-accent hover:underline font-medium flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl py-3 border-t border-line flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-muted gap-2 mt-auto">
        <span className="text-ink font-medium tracking-tight">EngineerSpace · Built by Mohammed Arshad</span>
        <span className="text-[10px] text-muted">Engineering Platform · Secure Authentication</span>
      </div>
    </div>
  );
};
