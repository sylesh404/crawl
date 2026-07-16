import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Newspaper, UserCheck, AlertCircle, Phone } from 'lucide-react';
import api from '../api/axios.js';
import BrandPanel from '../components/BrandPanel.jsx';
import '../styles/login.css';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="currentColor" style={{ width: '20px', height: '20px' }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [ripples, setRipples] = useState([]);
  const navigate = useNavigate();

  // Phone OTP States
  const [loginMode, setLoginMode] = useState('email'); // 'email' | 'phone'
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef([]);

  // Countdown timer hook
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Button Ripple Effect
  const handleButtonClick = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now() + Math.random(),
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  const cleanRipple = (id) => {
    setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
  };

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('crawlnews_user_token', data.token);
      localStorage.setItem('crawlnews_user', JSON.stringify(data.user));
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin() {
    setError('');
    setGuestLoading(true);
    try {
      // Simulate guest login without backend call
      localStorage.removeItem('crawlnews_user_token');
      localStorage.setItem('crawlnews_user', JSON.stringify({ id: 'guest', email: 'guest@example.com', isGuest: true }));
      // Artificial delay for premium UX feel
      await new Promise((resolve) => setTimeout(resolve, 800));
      navigate('/home');
    } catch (err) {
      setError('Could not start guest session. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  }

  // OTP Interaction Handlers
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const cleaned = value.replace(/\D/g, '');
    setPhoneNumber(cleaned);
  };

  const handleOtpChange = (value, index) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned === '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned[cleaned.length - 1];
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          otpRefs.current[index - 1]?.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (pastedData[i]) {
          newOtp[i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length - 1, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handlePhoneModeToggle = () => {
    setLoginMode('phone');
    setError('');
  };

  const handleBackToEmail = () => {
    setLoginMode('email');
    setOtpSent(false);
    setPhoneNumber('');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Phone number is required.');
      return;
    }
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      setError('Please enter a valid phone number (7 to 15 digits).');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await api.post('/auth/send-otp', {
        countryCode,
        phoneNumber: cleanPhone
      });

      setOtpSent(true);
      setCountdown(60);

      // Auto focus first OTP input box on next tick
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);

      if (response.data?.devOtp) {
        console.log(`[OTP Test Mode] Code is: ${response.data.devOtp}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        countryCode,
        phoneNumber,
        otp: otpCode
      });

      localStorage.setItem('crawlnews_user_token', data.token);
      localStorage.setItem('crawlnews_user', JSON.stringify(data.user));
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginMode === 'email') {
      handleLogin(e);
    } else {
      if (!otpSent) {
        handleSendOTP(e);
      } else {
        handleVerifyOTP(e);
      }
    }
  };

  return (
    <div className="premium-login-container">
      {/* LEFT SIDE: Authentic minimalist forms */}
      <div className="left-auth-panel">
        {/* Branding header */}
        <div className="brand-header">
          <div className="brand-logo-container">
            <div className="brand-logo-badge">
              <Newspaper className="w-5.5 h-5.5" />
            </div>
            <span className="brand-title">
              Crawl<span>News</span>
            </span>
          </div>
          <span className="brand-motto">
            Discover News. Faster. Smarter.
          </span>
        </div>

        {/* Form area */}
        <div className="login-form-wrapper">
          <h1 className="login-heading">Welcome Back!</h1>
          <p className="login-subheading">
            Sign in to continue reading personalized news powered by AI.
          </p>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="premium-alert-banner error"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="form-inputs-group">
            <AnimatePresence mode="wait">
              {loginMode === 'email' ? (
                <motion.div
                  key="email-mode-fields"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="form-mode-container"
                >
                  {/* Email Input */}
                  <div className="pill-input-container">
                    <input
                      type="email"
                      id="email-input"
                      className="pill-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      required
                    />
                    <Mail className="input-icon-left w-5 h-5" />
                    <label htmlFor="email-input" className="pill-label">
                      Email Address
                    </label>
                  </div>

                  {/* Password Input */}
                  <div className="pill-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password-input"
                      className="pill-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder=" "
                      required
                    />
                    <Lock className="input-icon-left w-5 h-5" />
                    <label htmlFor="password-input" className="pill-label">
                      Password
                    </label>
                    <button
                      type="button"
                      className="input-toggle-right"
                      onClick={() => setShowPassword((s) => !s)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <a href="#forgot" className="forgot-password-link">
                    Forgot Password?
                  </a>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn-submit-pill"
                    disabled={loading}
                    onMouseDown={handleButtonClick}
                  >
                    {/* Ripple elements */}
                    {ripples.map((ripple) => (
                      <span
                        key={ripple.id}
                        className="ripple-effect"
                        style={{
                          left: ripple.x,
                          top: ripple.y,
                          width: ripple.size,
                          height: ripple.size,
                        }}
                        onAnimationEnd={() => cleanRipple(ripple.id)}
                      />
                    ))}

                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="arrow-icon w-4.5 h-4.5" />
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="phone-mode-fields"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="form-mode-container"
                >
                  {/* Phone Input Row */}
                  <div className="phone-input-row">
                    <div className="country-select-container">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="pill-select"
                        disabled={otpSent}
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (UAE)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+65">+65 (SG)</option>
                      </select>
                    </div>
                    <div className="pill-input-container phone-number-container">
                      <input
                        type="tel"
                        id="phone-input"
                        className="pill-input"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder=" "
                        required
                        disabled={otpSent}
                      />
                      <Phone className="input-icon-left w-5 h-5" />
                      <label htmlFor="phone-input" className="pill-label">
                        Phone Number
                      </label>
                    </div>
                  </div>

                  {/* OTP Section (Revealed when OTP is sent) */}
                  {otpSent && (
                    <div className="otp-container">
                      <label className="otp-label">Enter Verification Code</label>
                      <div className="otp-input-group">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, index)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            onPaste={handleOtpPaste}
                            className="otp-box"
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                      
                      {/* OTP Resend/Countdown */}
                      <div className="otp-countdown-container">
                        {countdown > 0 ? (
                          <span className="otp-countdown-text">Resend OTP in {countdown}s</span>
                        ) : (
                          <button type="button" className="otp-resend-btn" onClick={handleSendOTP}>
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Phone Submit Button */}
                  <button
                    type="submit"
                    className="btn-submit-pill"
                    disabled={otpLoading}
                    onMouseDown={handleButtonClick}
                  >
                    {/* Ripple elements */}
                    {ripples.map((ripple) => (
                      <span
                        key={ripple.id}
                        className="ripple-effect"
                        style={{
                          left: ripple.x,
                          top: ripple.y,
                          width: ripple.size,
                          height: ripple.size,
                        }}
                        onAnimationEnd={() => cleanRipple(ripple.id)}
                      />
                    ))}

                    {otpLoading ? (
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <>
                        <span>{!otpSent ? 'Send OTP' : 'Verify & Login'}</span>
                        <ArrowRight className="arrow-icon w-4.5 h-4.5" />
                      </>
                    )}
                  </button>

                  {/* Back to Email Login Link */}
                  <div className="back-to-email-container">
                    <button type="button" className="back-to-email-btn" onClick={handleBackToEmail}>
                      ← Back to Email Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Third-party auth options (Only visible in Email mode) */}
            {loginMode === 'email' && (
              <>
                {/* Third-party Google SSO Option */}
                <button type="button" className="btn-google-pill">
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                {/* Continue with Phone Number Option */}
                <button
                  type="button"
                  className="btn-google-pill btn-phone-pill"
                  onClick={handlePhoneModeToggle}
                >
                  <Phone className="w-5 h-5 text-slate-700" />
                  <span>Continue with Phone Number</span>
                  <span className="badge-new">NEW</span>
                </button>

                {/* Guest Login Option */}
                <button
                  type="button"
                  className="btn-google-pill"
                  onClick={handleGuestLogin}
                  disabled={guestLoading}
                >
                  {guestLoading ? (
                    <svg className="animate-spin h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5 text-slate-700" />
                      <span>Continue as Guest</span>
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Registration link */}
          <div className="auth-bottom-nav">
            Don't have an account? <Link to="/signup">Register Now</Link>
          </div>
          <div className="auth-bottom-nav" style={{ marginTop: '10px' }}>
            <Link to="/admin">Administrator Login</Link>
          </div>
        </div>

        {/* Copyright notice */}
        <div className="copyright-text">
          © {new Date().getFullYear()} CrawlNews Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Mascot illustration and floating cards */}
      <div className="right-visual-panel">
        <BrandPanel />
      </div>
    </div>
  );
}
