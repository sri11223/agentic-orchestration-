import { motion, easeInOut } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Zap, 
  Shield, 
  Smartphone, 
  Cloud, 
  BarChart3,
  Workflow,
  Users,
  Globe,
  Layers,
  Code,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Network,
  Cpu,
  Orbit,
  Rocket,
  Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const FeaturesPage = () => {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.2, triggerOnce: true });

  const mainFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Integrate GPT-4, Claude, and other AI models directly into your workflows",
      features: ["Natural language processing", "Smart decision making", "Adaptive learning", "Content generation"],
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Workflow,
      title: "Visual Workflow Builder",
      description: "Drag and drop interface for creating complex automation workflows",
      features: ["No-code interface", "Real-time preview", "Template library", "Version control"],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "Lightning Performance",
      description: "Execute workflows in milliseconds with our optimized engine",
      features: ["Sub-second execution", "Auto-scaling", "Load balancing", "99.9% uptime"],
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Globe,
      title: "Global Integrations",
      description: "Connect with 500+ popular services and APIs seamlessly",
      features: ["Pre-built connectors", "Custom API support", "Webhook triggers", "Real-time sync"],
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with encryption and compliance",
      features: ["End-to-end encryption", "SOC 2 compliant", "GDPR ready", "Role-based access"],
      gradient: "from-red-500 to-rose-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into workflow performance and optimization",
      features: ["Real-time monitoring", "Custom dashboards", "Performance metrics", "Error tracking"],
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const additionalFeatures = [
    { icon: Smartphone, title: "Mobile Ready", description: "Access and manage workflows from any device" },
    { icon: Cloud, title: "Cloud Native", description: "Built for scale with cloud-first architecture" },
    { icon: Users, title: "Team Collaboration", description: "Share and collaborate on workflows with your team" },
    { icon: Layers, title: "Multi-Environment", description: "Deploy across dev, staging, and production" },
    { icon: Code, title: "Developer Friendly", description: "APIs, webhooks, and custom code support" },
    { icon: Workflow, title: "Template Library", description: "Start with proven workflow templates" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
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
        ease: easeInOut // use the imported easing function
      }
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20">
        {/* Dynamic Neural Network Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30" />
          
          {/* Animated Neural Network Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            
            {/* Flowing connection lines */}
            <motion.path
              d="M0,100 Q400,300 800,200 T1600,150"
              stroke="url(#line-gradient)"
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
              d="M0,300 Q600,100 1200,400 T2400,200"
              stroke="url(#line-gradient)"
              strokeWidth="1.5"
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

          {/* Floating AI Nodes */}
          <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-cyan-400 rounded-full animate-bounce" />
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          
          {/* Flowing particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, -10, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>

      {/* Hero Section with AI Flow Design */}
      <motion.section
        ref={heroRef}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
        className="relative z-10 px-6 py-20 text-center overflow-hidden"
      >
        {/* Floating AI Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          >
            <div className="w-full h-full rounded-full border-2 border-blue-400/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
          </motion.div>
          
          <motion.div
            className="absolute top-32 right-16 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full"
            animate={{
              y: [0, 15, 0],
              x: [0, 10, 0],
              rotate: [0, -180, -360],
            }}
            transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          >
            <div className="w-full h-full rounded-full border-2 border-purple-400/30 flex items-center justify-center">
              <Network className="w-5 h-5 text-purple-500" />
            </div>
          </motion.div>

          <motion.div
            className="absolute bottom-32 left-1/4 w-14 h-14 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full"
            animate={{
              y: [0, -25, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 7, repeat: Infinity, delay: 2 }}
          >
            <div className="w-full h-full rounded-full border-2 border-cyan-400/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyan-500" />
            </div>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white border-0 px-6 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Comprehensive AI Features
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              In One AI Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Discover the powerful AI-driven features that make Workflow Builder the ultimate 
            <span className="text-blue-300 font-semibold"> intelligent automation platform</span>
          </motion.p>

          {/* Flowing CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => navigate('/register')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Zap className="w-5 h-5 mr-2" />
              Experience AI Features
            </Button>
            <Button
              onClick={() => navigate('/demo')}
              variant="outline"
              size="lg"
              className="border-blue-400 text-blue-300 hover:bg-blue-400/10 px-8 py-3 text-lg"
            >
              <Orbit className="w-5 h-5 mr-2" />
              Interactive Demo
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Interactive Workflow Canvas */}
      <motion.section
        ref={featuresRef}
        initial="hidden"
        animate={featuresInView ? "visible" : "hidden"} 
        className="relative z-10 px-6 py-16"
      >
        <div className="max-w-7xl mx-auto">
          {/* Simple Clean Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need to build intelligent automation workflows
            </p>
          </motion.div>

          {/* Clean Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Premium Glass Morphism Background */}
            <div className="absolute inset-0">
              {/* Sophisticated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
              <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/3 via-transparent to-indigo-500/3" />
              
              {/* Professional grid pattern */}
              <svg width="100%" height="100%" className="absolute inset-0 opacity-[0.03]">
                <defs>
                  <pattern id="premiumGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="url(#gridStroke)" strokeWidth="1"/>
                    <circle cx="0" cy="0" r="1" fill="url(#gridStroke)"/>
                  </pattern>
                  <linearGradient id="gridStroke">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#premiumGrid)" />
              </svg>
              
              {/* Ambient lighting effects */}
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-radial from-blue-400/10 to-transparent blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-radial from-purple-400/8 to-transparent blur-3xl" />
            </div>
            
            {/* Premium header bar */}
            <div className="relative z-20 flex items-center justify-between p-6 border-b border-slate-700/30 bg-gradient-to-r from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="text-slate-300 font-medium">Live Workflow Builder</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span>Connected</span>
                </div>
                <div className="px-3 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300 border border-slate-600/30">
                  Real-time
                </div>
              </div>
            </div>

            {/* Premium Workflow Nodes */}
            <div className="relative z-15 px-8 py-12 min-h-[720px]">
              
              {/* Enterprise-Grade Node: Data Source */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute top-16 left-12"
                whileHover={{ 
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative">
                  {/* Premium node container */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-36 h-20 rounded-2xl border border-slate-600/40 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
                    {/* Animated border gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-500/30 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Node content */}
                    <div className="relative z-10 flex items-center justify-between p-4 h-full">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
                          <Database className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-300 font-medium">Data Source</div>
                          <div className="text-xs text-slate-500">MySQL DB</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                    
                    {/* Connector point */}
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-emerald-400 rounded-full"></div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* AI Processing Center */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute top-8 left-1/2 transform -translate-x-1/2"
                whileHover={{ 
                  scale: 1.03,
                  y: -6,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative">
                  {/* Premium AI node */}
                  <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 w-48 h-32 rounded-3xl border border-slate-600/40 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl overflow-hidden">
                    {/* Neural network animation */}
                    <div className="absolute inset-2 opacity-20">
                      <svg width="100%" height="100%">
                        <motion.path
                          d="M20,40 Q80,20 160,40 Q120,80 60,60 Q40,20 20,40"
                          stroke="url(#aiGradient)"
                          strokeWidth="1"
                          fill="none"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        />
                        <defs>
                          <linearGradient id="aiGradient">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    
                    {/* AI node content */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-slate-200 font-semibold mb-1">AI Processing</div>
                      <div className="text-xs text-slate-400">GPT-4 Turbo</div>
                      <div className="flex items-center mt-2 space-x-1">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                      </div>
                    </div>
                    
                    {/* Multiple connector points */}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-purple-400 rounded-full"></div>
                    <div className="absolute right-0 top-1/3 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-blue-400 rounded-full"></div>
                    <div className="absolute right-0 bottom-1/3 transform translate-x-1/2 translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-cyan-400 rounded-full"></div>
                  </div>
                  
                  {/* Processing indicator */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full backdrop-blur-lg">
                      <span className="text-xs text-purple-300 font-medium">Processing...</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Decision Logic Node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute top-48 left-1/4 transform -translate-x-1/2"
                whileHover={{ 
                  scale: 1.05,
                  y: -6,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative">
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-32 h-24 rounded-xl border border-slate-600/40 shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden transform rotate-45">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10"></div>
                    
                    {/* Decision content */}
                    <div className="relative z-10 flex items-center justify-center h-full transform -rotate-45">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-1">
                          <span className="text-white text-xs font-bold">?</span>
                        </div>
                        <div className="text-xs text-slate-300 font-medium">Decision</div>
                      </div>
                    </div>
                    
                    {/* Decision paths */}
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                </div>
              </motion.div>

              {/* Integration Services */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute top-48 right-1/4 transform translate-x-1/2"
                whileHover={{ 
                  scale: 1.05,
                  y: -6,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative">
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-40 h-28 rounded-2xl border border-slate-600/40 shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"></div>
                    
                    <div className="relative z-10 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Network className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-xs text-slate-400">APIs</div>
                      </div>
                      <div className="text-sm text-slate-200 font-medium mb-1">Integration Hub</div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="w-3 h-3 bg-blue-400/50 rounded"></div>
                        <div className="w-3 h-3 bg-green-400/50 rounded"></div>
                        <div className="w-3 h-3 bg-purple-400/50 rounded"></div>
                      </div>
                    </div>
                    
                    {/* Connection points */}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-blue-400 rounded-full"></div>
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-cyan-400 rounded-full"></div>
                  </div>
                </div>
              </motion.div>

              {/* Output Success Node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="absolute bottom-16 right-16"
                whileHover={{ 
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="group relative">
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 w-44 h-24 rounded-2xl border border-slate-600/40 shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                    
                    <div className="relative z-10 flex items-center p-4 h-full">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-slate-200 font-semibold">Output Generated</div>
                        <div className="text-xs text-slate-400">Success • 2.3s</div>
                        <div className="flex items-center mt-1">
                          <div className="w-12 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Final connector */}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-700 border-2 border-indigo-400 rounded-full"></div>
                  </div>
                  
                  {/* Success particles */}
                  <div className="absolute -top-1 -right-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-indigo-400 rounded-full"
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.4
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* AI Processing Node - Top Center */}
              <motion.div
                initial={{ scale: 0, opacity: 0, y: -50 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150, damping: 8 }}
                viewport={{ once: true }}
                className="absolute top-12 left-1/2 transform -translate-x-1/2"
                whileHover={{ 
                  scale: 1.2, 
                  rotate: -8,
                  boxShadow: "0 25px 50px rgba(168, 85, 247, 0.5)"
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Main AI Node */}
                  <div className="bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-600 w-36 h-36 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 border-3 border-purple-400/40">
                    <Brain className="w-18 h-18 text-white drop-shadow-xl" />
                  </div>
                  
                  {/* Complex Rotating Glow */}
                  <motion.div
                    className="absolute -inset-6 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30 rounded-full blur-2xl"
                    animate={{ 
                      scale: [1, 1.4, 1], 
                      opacity: [0.3, 0.7, 0.3],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                  />
                  
                  {/* Neural Network Pattern */}
                  <motion.div
                    className="absolute inset-2 border-2 border-purple-300/40 rounded-full"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <div className="absolute top-0 left-1/2 w-1 h-1 bg-purple-300 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-pink-300 rounded-full transform -translate-x-1/2 translate-y-1/2" />
                  </motion.div>
                  
                  {/* Enhanced Label */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 to-slate-900/95 backdrop-blur-lg px-5 py-3 rounded-xl border border-purple-400/30">
                    <span className="text-sm text-purple-300 font-bold tracking-wide">AI PROCESSING</span>
                    <div className="flex justify-center mt-1 space-x-1">
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse animation-delay-300" />
                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse animation-delay-600" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Decision Diamond - Middle Left */}
              <motion.div
                initial={{ scale: 0, opacity: 0, x: -30 }}
                whileInView={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 150, damping: 8 }}
                viewport={{ once: true }}
                className="absolute top-1/2 left-1/4 transform -translate-y-1/2"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 45,
                  boxShadow: "0 20px 40px rgba(251, 191, 36, 0.4)"
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Diamond Shape */}
                  <div className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 w-28 h-28 rotate-45 flex items-center justify-center shadow-2xl shadow-yellow-500/40 border-2 border-yellow-400/40">
                    <Cpu className="w-10 h-10 text-white -rotate-45 drop-shadow-lg" />
                  </div>
                  
                  {/* Decision Paths Indicator */}
                  <div className="absolute -top-6 -left-6 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <div className="absolute -top-6 -right-6 w-3 h-3 bg-red-400 rounded-full animate-pulse animation-delay-500" />
                  
                  {/* Enhanced Label */}
                  <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 to-slate-900/95 backdrop-blur-lg px-4 py-2 rounded-xl border border-yellow-400/30">
                    <span className="text-sm text-yellow-300 font-bold tracking-wide">DECISION</span>
                    <div className="text-xs text-yellow-400/80 mt-0.5">Yes / No</div>
                  </div>
                </div>
              </motion.div>

              {/* Integration Hub - Middle Right */}
              <motion.div
                initial={{ scale: 0, opacity: 0, x: 30 }}
                whileInView={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 8 }}
                viewport={{ once: true }}
                className="absolute top-1/2 right-1/4 transform -translate-y-1/2"
                whileHover={{ 
                  scale: 1.15, 
                  rotateY: 20,
                  boxShadow: "0 25px 50px rgba(59, 130, 246, 0.4)"
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Integration Hub */}
                  <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 w-32 h-32 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 border-2 border-cyan-400/40">
                    <Network className="w-14 h-14 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Rotating Connection Ring */}
                  <motion.div
                    className="absolute -inset-3 border-2 border-cyan-400/50 rounded-2xl"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  
                  {/* Integration Points */}
                  <div className="absolute -top-4 left-1/2 w-2 h-2 bg-cyan-300 rounded-full transform -translate-x-1/2 animate-bounce" />
                  <div className="absolute top-1/2 -right-4 w-2 h-2 bg-blue-300 rounded-full transform -translate-y-1/2 animate-bounce animation-delay-300" />
                  <div className="absolute -bottom-4 left-1/2 w-2 h-2 bg-cyan-300 rounded-full transform -translate-x-1/2 animate-bounce animation-delay-600" />
                  <div className="absolute top-1/2 -left-4 w-2 h-2 bg-blue-300 rounded-full transform -translate-y-1/2 animate-bounce animation-delay-900" />
                  
                  {/* Enhanced Label */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 to-slate-900/95 backdrop-blur-lg px-4 py-2 rounded-xl border border-cyan-400/30">
                    <span className="text-sm text-cyan-300 font-bold tracking-wide">INTEGRATION</span>
                    <div className="text-xs text-cyan-400/80 mt-0.5">500+ APIs</div>
                  </div>
                </div>
              </motion.div>

              {/* Output Success Node - Bottom Right */}
              <motion.div
                initial={{ scale: 0, opacity: 0, x: 50 }}
                whileInView={{ scale: 1, opacity: 1, x: 0 }}
                transition={{ delay: 1.0, type: "spring", stiffness: 150, damping: 8 }}
                viewport={{ once: true }}
                className="absolute bottom-16 right-16"
                whileHover={{ 
                  scale: 1.1, 
                  y: -10,
                  boxShadow: "0 25px 50px rgba(99, 102, 241, 0.4)"
                }}
              >
                <div className="relative group cursor-pointer">
                  {/* Success Node */}
                  <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/40">
                    <CheckCircle className="w-16 h-16 text-white drop-shadow-lg" />
                  </div>
                  
                  {/* Success Ripple Effect */}
                  <motion.div
                    className="absolute -inset-4 border-2 border-indigo-400/50 rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1], 
                      opacity: [0.6, 0, 0.6] 
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  />
                  
                  {/* Success Particles */}
                  <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-indigo-300 rounded-full"
                        style={{
                          left: "50%",
                          top: "50%",
                          transform: `rotate(${i * 60}deg) translateY(-40px)`
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: i * 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Enhanced Label */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-900/95 to-slate-900/95 backdrop-blur-lg px-4 py-2 rounded-xl border border-indigo-400/30">
                    <span className="text-sm text-indigo-300 font-bold tracking-wide">COMPLETE</span>
                    <div className="text-xs text-indigo-400/80 mt-0.5">Success!</div>
                  </div>
                </div>
              </motion.div>

              {/* Professional Connection System */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 12 }}>
                <defs>
                  <linearGradient id="premiumFlow1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                  </linearGradient>
                  
                  <linearGradient id="premiumFlow2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                  </linearGradient>
                  
                  <filter id="premiumGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feOffset in="coloredBlur" dx="0" dy="0" result="offsetBlur"/>
                    <feMerge> 
                      <feMergeNode in="offsetBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                </defs>
                
                {/* SIMPLE CORRECT CONNECTIONS */}
                
                {/* Data Source → AI Processing */}
                <motion.line
                  x1="184" y1="104"
                  x2="360" y2="104"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                />
                
                {/* AI Processing → Decision */}
                <motion.path
                  d="M 420 150 Q 320 200 240 280"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1.5 }}
                />
                
                {/* AI Processing → Integration */}
                <motion.path
                  d="M 500 150 Q 580 200 640 280"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1.7 }}
                />
                
                {/* Decision → Output */}
                <motion.path
                  d="M 280 320 Q 500 400 760 520"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 2 }}
                />
                
                {/* Integration → Output */}
                <motion.path
                  d="M 680 320 Q 720 400 760 520"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 2.2 }}
                />

                {/* Simple Data Flow Particles */}
                {[...Array(4)].map((_, i) => (
                  <motion.circle
                    key={i}
                    r="4"
                    fill="#3b82f6"
                    opacity="0.8"
                  >
                    <animateMotion 
                      dur="3s" 
                      repeatCount="indefinite" 
                      begin={`${i * 0.8 + 2}s`}
                      path="M 184 104 L 360 104 M 420 150 Q 320 200 240 280 Q 500 400 760 520"
                    />
                  </motion.circle>
                ))}
              </svg>

              {/* Premium Status Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 2.5, duration: 0.6 }}
                viewport={{ once: true }}
                className="absolute bottom-6 left-6 bg-gradient-to-br from-slate-900/90 to-slate-800/80 backdrop-blur-2xl rounded-2xl border border-slate-700/50 shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="p-5 max-w-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">Execution Status</div>
                        <div className="text-xs text-slate-400">Real-time monitoring</div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Throughput</span>
                      <span className="text-emerald-400 font-medium">1,247/min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Success Rate</span>
                      <span className="text-emerald-400 font-medium">99.8%</span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2">
                      <motion.div 
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 2, delay: 3 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 2.7, duration: 0.6 }}
                viewport={{ once: true }}
                className="absolute top-20 right-6 bg-gradient-to-br from-slate-900/90 to-slate-800/80 backdrop-blur-2xl rounded-2xl border border-slate-700/50 shadow-[0_20px_40px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                <div className="p-5 max-w-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">AI Analytics</div>
                        <div className="text-xs text-slate-400">Model performance</div>
                      </div>
                    </div>
                    <div className="px-2 py-1 bg-purple-500/20 border border-purple-400/30 rounded text-xs text-purple-300">
                      Live
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Accuracy</span>
                      <span className="text-purple-400 font-medium">96.4%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Response Time</span>
                      <span className="text-purple-400 font-medium">1.2s</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      <span>Model:</span>
                      <span className="bg-slate-700/50 px-2 py-1 rounded text-slate-300">GPT-4 Turbo</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Feature Highlights Below */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {mainFeatures.slice(0, 3).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="group cursor-pointer"
              >
                <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 h-full">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-r ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  <div className="space-y-3">
                    {feature.features.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center text-gray-400 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-700/30">
                    <div className="flex items-center text-blue-400 text-sm font-medium group-hover:text-blue-300 cursor-pointer">
                      <span>Explore feature</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced AI Capabilities */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Enhanced AI Capabilities
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Advanced AI features that make your automation workflows truly intelligent
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group relative"
              >
                {/* Hexagonal background shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-cyan-600/10 transform rotate-6 rounded-2xl group-hover:rotate-12 transition-transform duration-500" />
                
                <Card className="relative h-full border border-gray-700/50 bg-gray-900/80 backdrop-blur-lg rounded-2xl overflow-hidden group-hover:border-blue-500/50 transition-all duration-300">
                  <CardContent className="p-6 text-center relative">
                    {/* Floating icon with orbit effect */}
                    <div className="relative w-16 h-16 mx-auto mb-6">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center"
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.8 }}
                      >
                        <feature.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      
                      {/* Orbiting particles */}
                      <motion.div
                        className="absolute -inset-2 border border-blue-400/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="absolute top-0 left-1/2 w-1 h-1 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                      </motion.div>
                      
                      <motion.div
                        className="absolute -inset-4 border border-purple-400/20 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      >
                        <div className="absolute top-1/2 right-0 w-1 h-1 bg-purple-400 rounded-full transform translate-x-1/2 -translate-y-1/2" />
                      </motion.div>
                    </div>
                    
                    <h3 className="text-lg font-bold mb-3 text-white group-hover:text-blue-300 transition-colors duration-200">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-200">
                      {feature.description}
                    </p>
                    
                    {/* Subtle glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* AI-Powered Demo Experience */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="relative z-10 px-6 py-20 overflow-hidden"
      >
        {/* Dynamic background with neural network */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30" />
        
        {/* Animated neural connections */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
            {/* Dynamic neural pathways */}
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={i}
                r="2"
                fill="url(#neural-gradient)"
                initial={{ 
                  cx: `${20 + i * 20}%`, 
                  cy: `${30 + i * 10}%` 
                }}
                animate={{ 
                  cx: [`${20 + i * 20}%`, `${30 + i * 15}%`, `${20 + i * 20}%`], 
                  cy: [`${30 + i * 10}%`, `${40 + i * 5}%`, `${30 + i * 10}%`] 
                }}
                transition={{ 
                  duration: 4 + i, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            ))}
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white border-0 px-6 py-2">
              <Network className="w-4 h-4 mr-2" />
              AI in Action
            </Badge>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Experience AI-Powered Automation
            </h2>
            
            <p className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Watch our intelligent workflows adapt, learn, and optimize in real-time. 
              <span className="text-blue-300 font-semibold"> No coding required</span>.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white text-lg px-10 py-4 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group"
              onClick={() => navigate('/demo')}
            >
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="mr-3"
              >
                <Brain className="w-6 h-6" />
              </motion.div>
              Launch AI Demo
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-blue-400 text-blue-300 hover:bg-blue-400/10 hover:text-white text-lg px-10 py-4 group"
              onClick={() => navigate('/register')}
            >
              <Rocket className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Start Building Free
              <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          {/* Floating AI indicators */}
          <div className="mt-16 flex justify-center items-center space-x-8">
            {[
              { icon: Zap, label: "Real-time Processing" },
              { icon: Brain, label: "AI Learning" },
              { icon: Network, label: "Auto Optimization" }
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center space-y-2"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
                >
                  <item.icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-xs text-gray-400">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      </div>
      <Footer />
    </>
  );
};

export default FeaturesPage;