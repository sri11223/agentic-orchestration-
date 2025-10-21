import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Workflow, 
  Github, 
  Chrome,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Building,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, type RegisterRequest, type ApiError } from '@/services/auth.service';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string>('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const registerData: RegisterRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      
      await authService.register(registerData);
      
      // Navigate to dashboard on successful registration
      navigate('/dashboard');
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || apiError.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const features = [
    "Free forever for personal use",
    "50 workflow executions/month", 
    "5 AI model integrations",
    "Community support",
    "Workflow templates library"
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Benefits */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 items-center justify-center relative overflow-hidden"
      >
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-xl animate-pulse animation-delay-2000" />
        </div>

        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8">
            <Badge className="mb-6 bg-white/20 text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Join 50,000+ innovators
            </Badge>
            
            <h2 className="text-4xl font-bold mb-6">
              Start Building
              <br />
              <span className="text-cyan-300">The Future</span>
            </h2>
            
            <p className="text-xl opacity-90 mb-8">
              Create your free account and experience the power of AI-driven workflow automation.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="text-lg">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 }}
            className="mt-12 p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20"
          >
            <p className="text-sm opacity-75 mb-3">Ready in 2 minutes</p>
            <p className="text-2xl font-bold">Setup is super simple</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl flex items-center justify-center">
                <Workflow className="w-7 h-7 text-white" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              Create Account
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Start your automation journey today
            </motion.p>
          </div>

          {/* Social Registration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button 
              variant="outline" 
              className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Chrome className="w-5 h-5 mr-3" />
              Sign up with Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Github className="w-5 h-5 mr-3" />
              Sign up with GitHub
            </Button>
          </motion.div>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-gray-900 px-4 text-sm text-gray-500">
                Or create with email
              </span>
            </div>
          </div>

          {/* Registration Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="pl-10 h-12 border-gray-300 focus:border-emerald-500"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="pl-10 h-12 border-gray-300 focus:border-emerald-500"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  className="pl-10 h-12 border-gray-300 focus:border-emerald-500"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 dark:text-gray-300">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  className="pl-10 h-12 border-gray-300 focus:border-emerald-500"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-emerald-500"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Password must contain:</p>
              <ul className="ml-4 space-y-1">
                <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : ''}>
                  • One number
                </li>
              </ul>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-gray-300"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
                I agree to the{' '}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-medium"
              disabled={isLoading || !agreed}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center space-y-4"
          >
            <p className="text-gray-600 dark:text-gray-300">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in here
              </button>
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center space-x-2 text-gray-500 hover:text-gray-700 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to homepage</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;