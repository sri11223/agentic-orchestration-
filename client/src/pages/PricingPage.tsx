import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Check,
  Zap,
  Star,
  Crown,
  Building,
  ArrowRight,
  Users,
  Workflow,
  Shield,
  Headphones,
  Infinity,
  Code,
  Database,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PricingPage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      icon: Zap,
      price: { monthly: 0, annual: 0 },
      badge: 'Free Forever',
      badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      features: [
        '50 workflow executions/month',
        '5 AI model integrations',
        'Basic workflow templates',
        'Community support',
        'Email notifications',
        'Basic analytics',
        'Public workflow sharing'
      ],
      limitations: [
        'Limited to 3 active workflows',
        'Basic node types only',
        'Community support only'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      description: 'For growing teams and businesses',
      icon: Star,
      price: { monthly: 29, annual: 24 },
      badge: 'Most Popular',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      features: [
        '10,000 workflow executions/month',
        'All AI model integrations',
        'Advanced workflow templates',
        'Priority email support',
        'Advanced analytics & reporting',
        'Team collaboration',
        'Private workflows',
        'Custom integrations',
        'Webhook triggers',
        'Scheduled workflows',
        'Error handling & retries'
      ],
      limitations: [],
      cta: 'Start 14-day Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced needs',
      icon: Crown,
      price: { monthly: 99, annual: 79 },
      badge: 'Advanced',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      features: [
        'Unlimited workflow executions',
        'All AI model integrations',
        'Premium workflow templates',
        '24/7 dedicated support',
        'Advanced security & compliance',
        'SSO & SAML integration',
        'Custom AI model training',
        'On-premise deployment',
        'Advanced monitoring',
        'Custom SLAs',
        'Dedicated success manager',
        'API access & SDKs',
        'Custom integrations'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const addOns = [
    {
      name: 'Additional Executions',
      description: '10,000 extra executions per month',
      price: 10,
      icon: Workflow
    },
    {
      name: 'Premium Support',
      description: '24/7 phone and chat support',
      price: 49,
      icon: Headphones
    },
    {
      name: 'Advanced Analytics',
      description: 'Detailed insights and reporting',
      price: 19,
      icon: Database
    },
    {
      name: 'Custom Integration',
      description: 'Dedicated integration development',
      price: 199,
      icon: Code
    }
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and you\'ll be prorated accordingly.'
    },
    {
      question: 'What happens if I exceed my execution limit?',
      answer: 'If you exceed your monthly execution limit, your workflows will be temporarily paused. You can purchase additional executions or upgrade your plan.'
    },
    {
      question: 'Is there a free trial for paid plans?',
      answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, we\'ll provide a full refund.'
    },
    {
      question: 'Can I use my own AI models?',
      answer: 'Yes, Enterprise customers can integrate their own AI models and fine-tuned versions. Contact our sales team for details.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade security with SOC 2 compliance, end-to-end encryption, and regular security audits.'
    }
  ];

  const formatPrice = (price: number) => {
    return isAnnual ? price : price;
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background overflow-hidden pt-20">
        {/* Advanced Animated Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30" />
          
          {/* Flowing particles */}
          <div className="absolute inset-0">
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -25, 0],
                  x: [0, 10, -10, 0],
                  opacity: [0.2, 0.7, 0.2],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Animated gradient orbs */}
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-600/15 to-purple-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-600/15 to-pink-600/15 rounded-full blur-3xl animate-pulse animation-delay-2000" />
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
                Simple, Transparent Pricing
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="text-gray-100">Choose Your</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Automation Plan
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Start free and scale as you grow. All plans include our core automation features 
                with <span className="text-purple-400 font-semibold">no hidden fees</span> or usage surprises.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-6 mb-12">
                <span className={`text-lg ${!isAnnual ? 'text-white font-semibold' : 'text-gray-400'}`}>
                  Monthly
                </span>
                <Switch
                  checked={isAnnual}
                  onCheckedChange={setIsAnnual}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
                />
                <span className={`text-lg ${isAnnual ? 'text-white font-semibold' : 'text-gray-400'}`}>
                  Annual
                </span>
                {isAnnual && (
                  <Badge className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-300 border border-green-500/30 backdrop-blur-lg">
                    Save 20%
                  </Badge>
                )}
              </div>
            </motion.div>
          </div>
        </section>

      {/* Pricing Plans */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative ${plan.popular ? 'lg:-mt-8' : ''}`}
              >
                <Card className={`h-full ${plan.popular ? 'border-blue-500 shadow-xl' : 'border-gray-200 dark:border-gray-700'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className={plan.badgeColor}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className={`w-16 h-16 ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-100 dark:bg-gray-800'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <plan.icon className={`w-8 h-8 ${plan.popular ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      {plan.price.monthly === 0 ? (
                        <div className="text-5xl font-bold text-gray-900 dark:text-white">
                          Free
                        </div>
                      ) : (
                        <div>
                          <div className="text-5xl font-bold text-gray-900 dark:text-white">
                            ${formatPrice(isAnnual ? plan.price.annual : plan.price.monthly)}
                          </div>
                          <div className="text-gray-500 mt-1">
                            per user/{isAnnual ? 'year' : 'month'}
                          </div>
                          {isAnnual && plan.price.monthly > 0 && (
                            <div className="text-sm text-green-600 mt-1">
                              Save ${(plan.price.monthly - plan.price.annual) * 12}/year
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => navigate('/register')}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                      }`}
                    >
                      {plan.cta}
                      {plan.name !== 'Enterprise' && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          What's included:
                        </h4>
                        <ul className="space-y-3">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start space-x-3">
                              <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.limitations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Limitations:
                          </h4>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation) => (
                              <li key={limitation} className="text-sm text-gray-500">
                                • {limitation}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
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
              <Zap className="w-4 h-4 mr-2" />
              Power-ups
            </Badge>

            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Enhance Your Plan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Add extra capabilities to any plan with our flexible add-ons.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <addon.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                      {addon.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      {addon.description}
                    </p>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      ${addon.price}/month
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Add to Plan
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <Users className="w-4 h-4 mr-2" />
              FAQ
            </Badge>

            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="border-b border-gray-200 dark:border-gray-700 pb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-white">
            <Building className="w-16 h-16 mx-auto mb-6 opacity-80" />
            
            <h2 className="text-4xl font-bold mb-6">
              Need a Custom Solution?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Large organization? Special requirements? Let's discuss a custom plan 
              that fits your exact needs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/contact')}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => navigate('/demo')}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Schedule Demo
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

export default PricingPage;