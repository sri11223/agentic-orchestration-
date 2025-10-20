import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Rocket, 
  ArrowRight, 
  Network,
  Workflow,
  Database,
  GitBranch,
  Target,
  Cpu,
  Boxes,
  CircuitBoard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [workflowRef, workflowInView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background overflow-hidden pt-20">
        {/* Animated Circuit Board Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-purple-950/20" />
          
          {/* Animated Circuit Pathways */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Horizontal circuit lines */}
            {[...Array(8)].map((_, i) => (
              <motion.line
                key={`h-${i}`}
                x1="0"
                y1={100 + i * 100}
                x2="100%"
                y2={100 + i * 100}
                stroke="url(#circuit-gradient)"
                strokeWidth="1"
                opacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatDelay: 3 }}
              />
            ))}
            
            {/* Vertical circuit lines */}
            {[...Array(10)].map((_, i) => (
              <motion.line
                key={`v-${i}`}
                x1={100 + i * 150}
                y1="0"
                x2={100 + i * 150}
                y2="100%"
                stroke="url(#circuit-gradient)"
                strokeWidth="1"
                opacity="0.2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, delay: i * 0.15, repeat: Infinity, repeatDelay: 4 }}
              />
            ))}
            
            {/* Circuit nodes */}
            {[...Array(20)].map((_, i) => (
              <motion.circle
                key={`node-${i}`}
                cx={100 + (i % 5) * 300}
                cy={100 + Math.floor(i / 5) * 200}
                r="3"
                fill="#3B82F6"
                filter="url(#glow)"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </svg>
          
          {/* Floating Data Particles */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute w-1 h-1 bg-blue-400/40 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.random() * 50 - 25, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>
        </div>

        {/* Hero Section - Agentic Workflow Visualization */}
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-6 pt-20 pb-32"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Hero Content */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="inline-flex items-center px-4 py-2 mb-6 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-lg">
                    <CircuitBoard className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Next-Gen AI Orchestration</span>
                  </div>
                  
                  <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
                    <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                      Build Intelligent
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Agent Workflows
                    </span>
                  </h1>
                  
                  <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
                    Orchestrate AI agents that think, collaborate, and execute complex tasks autonomously. 
                    Transform your business with intelligent automation that learns and adapts.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white text-lg px-8 py-6 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group"
                    onClick={() => navigate('/register')}
                  >
                    <Rocket className="w-5 h-5 mr-2 group-hover:translate-y-[-2px] transition-transform" />
                    Start Building Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-400/30 text-blue-300 hover:bg-blue-400/10 hover:border-blue-400/50 text-lg px-8 py-6 backdrop-blur-lg group"
                    onClick={() => navigate('/demo')}
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    View Live Demo
                  </Button>
                </motion.div>

                {/* Trust Indicators */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex items-center gap-8 pt-8 border-t border-gray-800"
                >
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">10M+</div>
                    <div className="text-sm text-gray-400">Workflows Run</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">50K+</div>
                    <div className="text-sm text-gray-400">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                    <div className="text-sm text-gray-400">Uptime SLA</div>
                  </div>
                </motion.div>
              </div>

              {/* Right: Live Agentic Workflow Visualization */}
              <div className="relative flex items-center justify-center min-h-[600px]">
                {/* Workflow Container with fixed dimensions */}
                <div className="relative w-[600px] h-[600px] flex items-center justify-center">
                  
                  {/* Agent Nodes in Circular Formation - RENDER FIRST */}
                  {[
                    { icon: Database, label: "Data", angle: 0, color: "from-emerald-500 to-green-600", borderColor: "border-emerald-400/50" },
                    { icon: Network, label: "API", angle: 60, color: "from-blue-500 to-cyan-600", borderColor: "border-blue-400/50" },
                    { icon: Cpu, label: "Process", angle: 120, color: "from-yellow-500 to-orange-600", borderColor: "border-yellow-400/50" },
                    { icon: Target, label: "Decision", angle: 180, color: "from-red-500 to-pink-600", borderColor: "border-red-400/50" },
                    { icon: Workflow, label: "Flow", angle: 240, color: "from-purple-500 to-indigo-600", borderColor: "border-purple-400/50" },
                    { icon: GitBranch, label: "Logic", angle: 300, color: "from-teal-500 to-cyan-600", borderColor: "border-teal-400/50" },
                  ].map((agent, index) => {
                    // Calculate position on circle
                    const radius = 240; // Increased radius
                    const angleRad = (agent.angle * Math.PI) / 180;
                    const x = Math.cos(angleRad) * radius;
                    const y = Math.sin(angleRad) * radius;
                    
                    return (
                      <motion.div
                        key={agent.label}
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          marginLeft: `${x}px`,
                          marginTop: `${y}px`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{
                          duration: 0.5,
                          delay: 0.5 + index * 0.1,
                        }}
                      >
                        <motion.div
                          animate={{
                            y: [0, -8, 0],
                          }}
                          transition={{
                            duration: 2 + index * 0.2,
                            repeat: Infinity,
                            delay: index * 0.2,
                          }}
                          className="group cursor-pointer"
                        >
                          {/* Agent Card */}
                          <div className={`w-24 h-24 bg-gradient-to-br ${agent.color} rounded-2xl flex flex-col items-center justify-center shadow-2xl border-2 ${agent.borderColor} hover:scale-110 transition-all duration-300 backdrop-blur-sm`}>
                            <agent.icon className="w-10 h-10 text-white drop-shadow-lg mb-1" />
                            <span className="text-xs font-bold text-white/90">{agent.label}</span>
                          </div>
                          
                          {/* Status Indicator */}
                          <motion.div
                            className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-slate-900 shadow-lg"
                            animate={{
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 2,
                              delay: index * 0.3,
                              repeat: Infinity,
                            }}
                          />
                          
                          {/* Connection pulse */}
                          <motion.div
                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full pointer-events-none"
                            animate={{
                              scale: [0, 6, 0],
                              opacity: [0.8, 0, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              delay: index * 0.3,
                              repeat: Infinity,
                            }}
                          />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                  
                  {/* Central AI Brain - RENDER ON TOP */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                    >
                      <div className="relative">
                        {/* Main Brain Circle */}
                        <div className="w-36 h-36 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 border-4 border-purple-400/40">
                          <Brain className="w-16 h-16 text-white drop-shadow-2xl" />
                        </div>
                        
                        {/* Pulsing rings */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-purple-400/50"
                          animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.7, 0, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                          animate={{
                            scale: [1, 2.2, 1],
                            opacity: [0.7, 0, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            delay: 0.5,
                            repeat: Infinity,
                          }}
                        />
                        
                        {/* Center label */}
                        <motion.div
                          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
                          initial={{ opacity: 0, y: -10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1 }}
                        >
                          <div className="px-5 py-2 bg-purple-500/30 border border-purple-400/40 rounded-full backdrop-blur-lg shadow-lg">
                            <span className="text-sm font-bold text-purple-200">AI Orchestrator</span>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Connecting Lines SVG */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 600 600">
                    <defs>
                      <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    {[0, 60, 120, 180, 240, 300].map((angle, index) => {
                      const radius = 240;
                      const angleRad = (angle * Math.PI) / 180;
                      const x = 300 + Math.cos(angleRad) * radius;
                      const y = 300 + Math.sin(angleRad) * radius;
                      
                      return (
                        <motion.line
                          key={`line-${index}`}
                          x1="300"
                          y1="300"
                          x2={x}
                          y2={y}
                          stroke="url(#line-grad)"
                          strokeWidth="2"
                          initial={{ pathLength: 0 }}
                          whileInView={{ pathLength: 1 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 1,
                            delay: 0.7 + index * 0.1,
                          }}
                        />
                      );
                    })}
                  </svg>

                  {/* Data Flow Particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute w-2 h-2 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50 z-20"
                      style={{
                        top: '50%',
                        left: '50%',
                      }}
                      initial={{ opacity: 0 }}
                      whileInView={{
                        x: [0, Math.cos((i * 60 * Math.PI) / 180) * 240],
                        y: [0, Math.sin((i * 60 * Math.PI) / 180) * 240],
                        opacity: [0, 1, 0],
                        scale: [0, 1.2, 0],
                      }}
                      viewport={{ once: false }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Live Performance Dashboard Section - NEW! */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="relative z-10 px-6 py-20"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Real-Time Performance Metrics
              </h2>
              <p className="text-xl text-gray-400">
                Watch your AI agents work in real-time with live analytics
              </p>
            </motion.div>

            {/* Performance Cards Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Throughput Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-xs text-blue-400 font-medium">+12.5%</div>
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold text-white mb-1">
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      2,847
                    </motion.span>
                  </div>
                  <div className="text-sm text-gray-400">Tasks/min</div>
                </div>
                <div className="w-full h-2 bg-blue-900/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "78%" }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>

              {/* Success Rate Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-xs text-green-400 font-medium">+2.1%</div>
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold text-white mb-1">
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      99.8%
                    </motion.span>
                  </div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
                <div className="w-full h-2 bg-green-900/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: "99.8%" }}
                    transition={{ duration: 1.5, delay: 0.3 }}
                    viewport={{ once: true }}
                  />
                </div>
              </motion.div>

              {/* Active Agents Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Boxes className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-xs text-purple-400 font-medium">Live</div>
                </div>
                <div className="mb-2">
                  <div className="text-4xl font-bold text-white mb-1">
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                    >
                      247
                    </motion.span>
                  </div>
                  <div className="text-sm text-gray-400">Active Agents</div>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 h-12 bg-purple-500/20 rounded"
                      initial={{ height: 0 }}
                      whileInView={{ height: `${Math.random() * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      viewport={{ once: true }}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Interactive Workflow Process Section */}
        <motion.section
          ref={workflowRef}
          initial={{ opacity: 0 }}
          animate={workflowInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 px-6 py-32"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={workflowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                How Agentic Workflows Work
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Watch AI agents collaborate in real-time to solve complex problems autonomously
              </p>
            </motion.div>

            {/* Workflow Process Visualization */}
            <div className="relative">
              {/* Horizontal workflow path */}
              <div className="relative flex items-center justify-between mb-32">
                {[
                  { icon: Target, title: "Define Goal", desc: "Set your objective", color: "from-blue-500 to-cyan-500", delay: 0 },
                  { icon: Brain, title: "AI Planning", desc: "Agents strategize", color: "from-purple-500 to-pink-500", delay: 0.2 },
                  { icon: Boxes, title: "Parallel Execution", desc: "Multi-agent tasks", color: "from-yellow-500 to-orange-500", delay: 0.4 },
                  { icon: Network, title: "Collaborate", desc: "Share insights", color: "from-green-500 to-emerald-500", delay: 0.6 },
                  { icon: Zap, title: "Deliver Results", desc: "Lightning fast", color: "from-indigo-500 to-purple-500", delay: 0.8 },
                ].map((step, index) => (
                  <div key={step.title} className="relative z-10">
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={workflowInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                      transition={{ duration: 0.5, delay: step.delay }}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        className={`w-24 h-24 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-2xl mb-4`}
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 2 + index * 0.2,
                          repeat: Infinity,
                          delay: index * 0.3,
                        }}
                      >
                        <step.icon className="w-12 h-12 text-white" />
                      </motion.div>
                      
                      <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-400">{step.desc}</p>
                      </div>

                      {/* Connection line */}
                      {index < 4 && (
                        <motion.div
                          className="absolute top-12 left-[calc(50%+3rem)] w-[calc(100%+12rem)] h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50"
                          initial={{ scaleX: 0 }}
                          animate={workflowInView ? { scaleX: 1 } : { scaleX: 0 }}
                          transition={{ duration: 0.8, delay: step.delay + 0.3 }}
                          style={{ transformOrigin: 'left' }}
                        />
                      )}
                      
                      {/* Animated dot traveling along line */}
                      {index < 4 && workflowInView && (
                        <motion.div
                          className="absolute top-12 w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"
                          initial={{ left: 'calc(50% + 3rem)' }}
                          animate={{
                            left: ['calc(50% + 3rem)', 'calc(50% + 100% + 9rem)'],
                          }}
                          transition={{
                            duration: 2,
                            delay: step.delay + 0.5,
                            repeat: Infinity,
                            repeatDelay: 3,
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Feature Highlights - Unique Hexagonal Grid */}
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Brain,
                    title: "Autonomous Decision Making",
                    desc: "Agents analyze context and make intelligent decisions without human intervention",
                    features: ["Natural language understanding", "Context-aware reasoning", "Adaptive learning"],
                  },
                  {
                    icon: Network,
                    title: "Multi-Agent Collaboration",
                    desc: "Multiple AI agents work together, sharing knowledge and coordinating tasks seamlessly",
                    features: ["Real-time communication", "Task distribution", "Collective intelligence"],
                  },
                  {
                    icon: Workflow,
                    title: "Dynamic Orchestration",
                    desc: "Workflows adapt in real-time based on changing conditions and requirements",
                    features: ["Auto-scaling", "Error recovery", "Performance optimization"],
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    animate={workflowInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
                    className="group relative"
                  >
                    {/* Hexagonal background effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-cyan-600/5 transform rotate-3 rounded-3xl group-hover:rotate-6 transition-transform duration-500" />
                    
                    <div className="relative bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-500 h-full">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                        <feature.icon className="w-8 h-8 text-white" />
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">
                        {feature.title}
                      </h3>

                      <p className="text-gray-300 mb-6 leading-relaxed">
                        {feature.desc}
                      </p>

                      <ul className="space-y-3">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start text-gray-400 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-cyan-500/5 rounded-3xl transition-all duration-500" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section - Unique Design */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative z-10 px-6 py-32 overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-indigo-950" />
          
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
          
          {/* Animated particles */}
          <div className="absolute inset-0">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={`cta-particle-${i}`}
                className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 5 + Math.random() * 5,
                  repeat: Infinity,
                  delay: Math.random() * 5,
                }}
              />
            ))}
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                Ready to Build the Future?
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of innovators using AI agents to transform their workflows.
                <span className="block mt-2 text-blue-400 font-semibold">Start building for free today.</span>
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
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 text-white text-xl px-12 py-7 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group"
                onClick={() => navigate('/register')}
              >
                <Rocket className="w-6 h-6 mr-3 group-hover:translate-y-[-2px] transition-transform" />
                Start Building Free
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 text-xl px-12 py-7 backdrop-blur-lg group"
                onClick={() => navigate('/demo')}
              >
                <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                View Live Demo
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="mt-16 flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
      <Footer />
    </>
  );
};

export default LandingPage;
                