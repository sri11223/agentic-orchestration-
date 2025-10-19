import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users,
  Target,
  Lightbulb,
  Award,
  Globe,
  TrendingUp,
  Zap,
  Shield,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
  Workflow,
  Building,
  Code,
  Rocket
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const AboutPage = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Active Users', value: '50,000+', icon: Users },
    { label: 'Workflows Created', value: '500K+', icon: Workflow },
    { label: 'AI Integrations', value: '25+', icon: Code },
    { label: 'Countries', value: '120+', icon: Globe }
  ];

  const values = [
    {
      icon: Lightbulb,
      title: 'Innovation First',
      description: 'We push the boundaries of what\'s possible with AI automation, constantly evolving to meet tomorrow\'s challenges.'
    },
    {
      icon: Shield,
      title: 'Security & Privacy',
      description: 'Your data is protected with enterprise-grade security. We believe privacy is a fundamental right.'
    },
    {
      icon: Users,
      title: 'User-Centric Design',
      description: 'Every feature is designed with our users in mind, making complex automation accessible to everyone.'
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'We build together with our community, listening to feedback and evolving based on real needs.'
    }
  ];

  const team = [
    {
      name: 'Sarah Chen',
      role: 'CEO & Co-Founder',
      image: '/api/placeholder/300/300',
      bio: 'Former Google AI researcher with 10+ years in automation systems.'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'CTO & Co-Founder',
      image: '/api/placeholder/300/300',
      bio: 'Ex-Microsoft architect specializing in distributed systems and AI.'
    },
    {
      name: 'Dr. Emily Watson',
      role: 'Head of AI Research',
      image: '/api/placeholder/300/300',
      bio: 'PhD in Machine Learning from MIT, published researcher in workflow automation.'
    },
    {
      name: 'Alex Thompson',
      role: 'Head of Product',
      image: '/api/placeholder/300/300',
      bio: 'Product leader from Slack, passionate about making complex tools simple.'
    }
  ];

  const milestones = [
    {
      year: '2022',
      title: 'Company Founded',
      description: 'Started with a vision to democratize AI automation'
    },
    {
      year: 'Q2 2023',
      title: 'First 1,000 Users',
      description: 'Reached our first milestone with beta users'
    },
    {
      year: 'Q4 2023',
      title: '$5M Series A',
      description: 'Raised funding to accelerate development'
    },
    {
      year: 'Q2 2024',
      title: '50,000+ Users',
      description: 'Scaled to serve enterprises worldwide'
    },
    {
      year: 'Q4 2024',
      title: 'Enterprise Launch',
      description: 'Launched enterprise features and support'
    }
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
            {[...Array(30)].map((_, i) => (
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
                  opacity: [0.2, 0.6, 0.2],
                }}
                transition={{
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
        </div>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-600" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-yellow-600" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-pink-600" />
      </div>

        {/* Hero Section */}
        <section className="relative py-20 px-6 overflow-hidden">
          <div className="relative max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-8 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 text-blue-300 border border-blue-500/30 backdrop-blur-lg">
                <Star className="w-4 h-4 mr-2" />
                Trusted by 50,000+ innovators
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="text-gray-100">We're Building the</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Future of Work
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Our mission is to empower every individual and organization to harness the full potential 
                of <span className="text-blue-400 font-semibold">AI automation</span>, making complex workflows accessible to everyone.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => navigate('/register')}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white text-lg px-10 py-4 rounded-2xl shadow-2xl shadow-blue-500/25"
                  >
                    Join Our Mission
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => navigate('/contact')}
                    variant="outline"
                    size="lg"
                    className="text-gray-300 border-gray-600 hover:border-blue-400 hover:text-blue-300 text-lg px-10 py-4 rounded-2xl bg-gray-900/30 backdrop-blur-lg"
                  >
                    Contact Us
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                    <stat.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-3">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-lg">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      {/* Story Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Target className="w-4 h-4 mr-2" />
                Our Story
              </Badge>

              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                From Frustration to Innovation
              </h2>

              <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <p>
                  It started with a simple frustration. As engineers and product leaders at major tech companies, 
                  we spent countless hours building and maintaining custom automation systems that should have been simple.
                </p>
                <p>
                  Every team was rebuilding the same wheels, integrating the same APIs, and solving the same problems. 
                  We realized there had to be a better way – a universal platform that could democratize AI automation.
                </p>
                <p>
                  Today, Workflow Builder powers automation for individuals, startups, and Fortune 500 companies, 
                  saving millions of hours and enabling teams to focus on what truly matters: innovation.
                </p>
              </div>

              <div className="mt-8 flex items-center space-x-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white" />
                  ))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Trusted by teams at Google, Microsoft, Slack, and more
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <Rocket className="w-8 h-8 text-blue-600 mb-2" />
                    <div className="text-sm font-medium">Innovation</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                    <div className="text-sm font-medium">Growth</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <Zap className="w-8 h-8 text-yellow-600 mb-2" />
                    <div className="text-sm font-medium">Speed</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                    <Award className="w-8 h-8 text-purple-600 mb-2" />
                    <div className="text-sm font-medium">Excellence</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              <Heart className="w-4 h-4 mr-2" />
              Our Values
            </Badge>

            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Drives Us Forward
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              These core values guide every decision we make and every feature we build.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                      <value.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Users className="w-4 h-4 mr-2" />
              Our Team
            </Badge>

            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet the Builders
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We're a diverse team of engineers, designers, and researchers passionate about automation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <TrendingUp className="w-4 h-4 mr-2" />
              Our Journey
            </Badge>

            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Key Milestones
            </h2>
          </motion.div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center space-x-6"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{milestone.year}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {milestone.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Be part of the automation revolution. Start building the future with us today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/register')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Get Started Free
                <Rocket className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/features')}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Explore Features
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
    <Footer />
    </>
  );
};

export default AboutPage;