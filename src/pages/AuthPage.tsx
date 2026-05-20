import { useState } from 'react';
import { 
  Shield, Mail, Lock, EyeOff, LayoutGrid, Cloud, ShieldCheck, 
  User, Phone, ArrowRight, Eye, Smartphone, Building2
} from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'otp';

export function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [gstin, setGstin] = useState(''); // NEW: GSTIN State
  
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const clearForm = () => {
    setUsername(''); setPassword(''); setEmail(''); setContact(''); setGstin(''); setOtpInput(''); setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const response = await window.electronAPI.loginUser({ username, password });
      if (response.success) {
        sessionStorage.setItem('activeUser', JSON.stringify(response.user));
        onLoginSuccess();
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError("Database connection error.");
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    
    // Generate a secure 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    
    // Send it via WhatsApp
    try {
      const res = await window.electronAPI.sendWhatsappOtp({ contact, otp: newOtp });
      
      if (res.success) {
        setMode('otp'); // Only advance if WhatsApp successfully sent the message
      } else {
        setError("Failed to send WhatsApp message. Ensure the number is correct.");
      }
    } catch (err) {
      setError("Network error. Could not contact WhatsApp servers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (otpInput !== generatedOtp) return setError("Invalid OTP. Please try again.");
    
    try {
      // Include GSTIN in the final registration payload
      const response = await window.electronAPI.registerUser({ username, password, email, contact });
      if (response.success) {
        setSuccessMsg("Account created successfully! Please sign in.");
        setMode('login'); clearForm();
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (err) {
      setError("Failed to save user to database.");
    }
  };

  const inputClass = "w-full pl-10 pr-10 py-3 bg-[#f8fafc] border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400";
  const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#eff4ff] via-[#f8faff] to-white font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        
        {/* ================= LOGIN MODE (Remains Unchanged) ================= */}
        {mode === 'login' && (
           <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 animate-fade-in-up">
            {/* ... Your existing login code ... */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-sm text-slate-500 font-medium">Please enter your details to sign in.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-red-100">{error}</div>}
            {successMsg && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-emerald-100">{successMsg}</div>}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Username</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                    className={inputClass} placeholder="name" />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className={inputClass} placeholder="••••••••" />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-medium rounded-lg shadow-sm transition-all duration-200">
                Sign In
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 font-medium mt-6">
              Don't have an account? <button type="button" onClick={() => {setMode('register'); setError('');}} className="text-blue-600 hover:text-blue-700 font-medium">Create an account</button>
            </p>
          </div>
        )}

        {/* ================= REGISTER MODE (With GSTIN) ================= */}
        {mode === 'register' && (
          <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-6 items-stretch animate-fade-in-up">
            
            <div className="hidden md:flex flex-col w-5/12 bg-[#f0f4ff] rounded-2xl p-10 border border-blue-100 justify-center">
              <div className="w-20 h-20 bg-blue-100/50 rounded-2xl flex items-center justify-center mb-8 border border-white">
                <LayoutGrid className="w-10 h-10 text-blue-300" />
              </div>
              <h2 className="text-2xl font-medium text-blue-600 mb-4">Join BillingBuddy</h2>
              <p className="text-slate-600 font-medium text-sm leading-relaxed mb-10">
                Register your business to start issuing invoices and managing inventory efficiently.
              </p>
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">Create Account</h1>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-red-100">{error}</div>}

              <form onSubmit={handleRegisterInitiate} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>User Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className={inputClass} placeholder="John Doe" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" required value={contact} onChange={(e) => setContact(e.target.value)}
                        className={inputClass} placeholder="9876543210" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className={inputClass} placeholder="name@company.com" />
                    </div>
                  </div>
                  {/* <div>
                    <label className={labelClass}>GSTIN (Optional)</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)}
                        className={inputClass} placeholder="27AABCU9603R1ZM" />
                    </div>
                  </div> */}
                </div>

                <div>
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                      className={inputClass} placeholder="••••••••" />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-[#1e40af] hover:bg-[#1e3a8a] disabled:bg-slate-400 text-white font-medium rounded-lg shadow-sm transition-all duration-200">
                  {isLoading ? 'Sending OTP to WhatsApp...' : <>Send Verification OTP <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 font-medium mt-6">
                Already have an account? <button type="button" onClick={() => {setMode('login'); setError('');}} className="text-[#1e40af] hover:text-[#1e3a8a] font-bold transition-colors">Sign in instead</button>
              </p>
            </div>
          </div>
        )}

        {/* ================= OTP VERIFICATION ================= */}
        {mode === 'otp' && (
          <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 animate-scale-in">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">WhatsApp Verification</h1>
              <p className="text-sm text-slate-500 font-medium">We sent a 6-digit verification code to <span className="font-bold text-slate-700">{contact}</span> via WhatsApp.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center font-medium border border-red-100">{error}</div>}

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <input type="text" required maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)}
                  className="w-full px-4 py-4 text-center tracking-[0.75em] text-3xl font-bold bg-[#f8fafc] border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-slate-800"
                  placeholder="000000" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-medium rounded-lg shadow-sm transition-all duration-200">
                Verify & Create Account
              </button>
              <button type="button" onClick={() => {setMode('register'); setOtpInput(''); setError('');}} className="w-full py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium rounded-lg transition-colors">
                Change Number
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}