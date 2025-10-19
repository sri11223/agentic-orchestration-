import { motion, easeOut } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Rocket, 
  ArrowRight, 
  Play,
  CheckCircle,
  Users,
  Globe,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [statsRef, statsInView] = useInView({ threshold: 0.2, triggerOnce: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: easeOut
      }
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Automation",
      description: "Leverage advanced AI models to create intelligent workflows that adapt and learn.",
      gradient: "from-purple-400 to-pink-400"
    },
    {
      icon: Zap,
      title: "Lightning Fast Execution",
      description: "Execute complex workflows in milliseconds with our optimized engine.",
      gradient: "from-yellow-400 to-orange-400"
    },
    {
      icon: Globe,
      title: "Global Integrations",
      description: "Connect with 500+ services and APIs seamlessly with pre-built connectors.",
      gradient: "from-blue-400 to-cyan-400"
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Monitor performance and optimize workflows with detailed insights.",
      gradient: "from-green-400 to-emerald-400"
    }
  ];

  const stats = [
    { number: "10M+", label: "Workflows Executed", icon: Rocket },
    { number: "50K+", label: "Active Users", icon: Users },
    { number: "99.9%", label: "Uptime", icon: CheckCircle },
    { number: "500+", label: "Integrations", icon: Globe }
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background overflow-hidden pt-20">
        {/* Advanced Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30" />
          
          {/* Flowing particles */}
          <div className="absolute inset-0">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, 15, -15, 0],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse animation-delay-4000" />

          {/* Floating elements */}
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-cyan-400 rounded-full animate-bounce" />
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />

          {/* Neural network lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1920 1080">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 100 200 Q 300 100 500 200 T 900 200"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0], 
                opacity: [0, 0.6, 0] 
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.path
              d="M 200 400 Q 600 300 1000 400 T 1400 400"
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0], 
                opacity: [0, 0.4, 0] 
              }}
              transition={{ 
                duration: 8, 
                delay: 1, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
          </svg>
        </div>



      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative z-10 px-6 py-20 text-center"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants}>
            <Badge className="mb-8 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 text-blue-300 border border-blue-500/30 backdrop-blur-lg">
              <Zap className="w-4 h-4 mr-2" />
              Now with AI-Powered Workflows
            </Badge>
          </motion.div>
          
          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Build Intelligent
            </span>
            <br />
            <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Workflows
              <motion.div
                className="absolute -bottom-4 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 rounded-full"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.8 }}
                transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
              />
              {/* Sparkle effects */}
              <motion.div
                className="absolute top-0 right-0 w-4 h-4"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <motion.div
                className="absolute top-1/2 -right-8 w-3 h-3"
                animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
              </motion.div>
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Create, automate, and scale your business processes with 
            <span className="text-blue-400 font-semibold"> AI-powered workflows</span>.
            <br />
            <span className="text-purple-400">No coding required</span> • 
            <span className="text-cyan-400"> Enterprise-grade security</span> • 
            <span className="text-pink-400"> Unlimited possibilities</span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white text-lg px-10 py-4 rounded-2xl shadow-2xl shadow-blue-500/25 border border-blue-400/20 backdrop-blur-lg"
                onClick={() => navigate('/register')}
              >
                <Rocket className="mr-3 w-5 h-5" />
                Start Building Free
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="text-gray-300 border-gray-600 hover:border-blue-400 hover:text-blue-300 text-lg px-10 py-4 rounded-2xl bg-gray-900/30 backdrop-blur-lg"
              >
                <Play className="mr-3 w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating action preview */}
          <motion.div
            variants={itemVariants}
            className="relative mx-auto max-w-4xl"
          >
            <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
              <div className="grid grid-cols-3 gap-6">
                <motion.div
                  className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-400/20"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Brain className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">AI Process</h3>
                  <p className="text-gray-400 text-sm">Intelligent automation</p>
                </motion.div>
                
                <motion.div
                  className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-400/20"
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Zap className="w-8 h-8 text-purple-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
                  <p className="text-gray-400 text-sm">Instant deployment</p>
                </motion.div>
                
                <motion.div
                  className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-400/20"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Rocket className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="text-white font-semibold mb-2">Scale Globally</h3>
                  <p className="text-gray-400 text-sm">Enterprise ready</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Animated Workflow Preview */}
          <motion.div
            variants={itemVariants}
            className="relative max-w-4xl mx-auto"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Play, label: "Trigger", color: "blue" },
                  { icon: Brain, label: "AI Process", color: "purple" },
                  { icon: Zap, label: "Action", color: "green" }
                ].map((step, index) => (
                  <motion.div
                    key={step.label}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 2 + index * 0.3, duration: 0.6 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-${step.color}-400 to-${step.color}-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{step.label}</h3>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        ref={statsRef}
        initial="hidden"
        animate={statsInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative z-10 px-6 py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <div className="flex items-center justify-center mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"}
        variants={containerVariants}
        className="relative z-10 px-6 py-20"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to build, deploy, and scale intelligent automation workflows
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 mb-6 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 px-6 py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Workflows?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses automating their processes with AI
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
            onClick={() => navigate('/register')}
          >
            Get Started for Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </motion.section>
    </div>
    <Footer />
    </>
  );
};

export default LandingPage;