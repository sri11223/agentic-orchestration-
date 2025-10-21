import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Workflow, 
  Github, 
  Chrome,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginRequest, type ApiError } from '@/services/auth.service';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const loginData: LoginRequest = { email, password };
      await authService.login(loginData);
      
      // Navigate to dashboard on successful login
      navigate('/dashboard');
    } catch (err: any) {
      const apiError = err as ApiError;
      setError(apiError.message || apiError.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Access to 500+ integrations",
    "Unlimited workflow executions", 
    "AI-powered automation",
    "Real-time analytics"
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
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
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Workflow className="w-7 h-7 text-white" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              Welcome Back
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 dark:text-gray-300"
            >
              Sign in to your AgenticFlow account
            </motion.p>
          </div>

          {/* Social Login */}
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
              Continue with Google
            </Button>
            <Button 
              variant="outline" 
              className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Github className="w-5 h-5 mr-3" />
              Continue with GitHub
            </Button>
          </motion.div>

          <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white dark:bg-gray-900 px-4 text-sm text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
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
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up for free
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

      {/* Right Side - Benefits */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 items-center justify-center relative overflow-hidden"
      >
        {/* Background Animation */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-xl animate-pulse animation-delay-2000" />
        </div>

        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8">
            <Badge className="mb-6 bg-white/20 text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Trusted by 50,000+ teams
            </Badge>
            
            <h2 className="text-4xl font-bold mb-6">
              Automate Your 
              <br />
              <span className="text-yellow-300">Success Story</span>
            </h2>
            
            <p className="text-xl opacity-90 mb-8">
              Join thousands of businesses already transforming their workflows with AI-powered automation.
            </p>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" />
                <span className="text-lg">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12 p-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20"
          >
            <p className="text-sm opacity-75 mb-3">Start your free trial today</p>
            <p className="text-2xl font-bold">No credit card required</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;