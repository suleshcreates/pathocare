import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FlaskConical, Calendar, Shield, ChevronRight,
    Star, CheckCircle2, ArrowRight, Menu, X, Building2,
    Beaker, Microscope, Stethoscope, Package, Quote, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Local testimonials data
const testimonials = [
    {
        id: '1',
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        rating: 5,
        text: "The home collection service was incredibly convenient. The technician was professional and arrived right on time.",
        date: "2024-02-15"
    },
    {
        id: '2',
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop",
        rating: 5,
        text: "Getting my reports online was so easy. The dashboard is user-friendly and helps me track my health metrics over time.",
        date: "2024-02-10"
    },
    {
        id: '3',
        name: "Emily Davis",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        rating: 4,
        text: "Great selection of accredited labs. I could compare prices and choose the best option for my full body checkup.",
        date: "2024-02-05"
    }
];


export function LandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const features = [
        { icon: Calendar, title: 'Easy Booking', desc: 'Book tests in minutes with our streamlined process' },
        { icon: Beaker, title: 'Fast Results', desc: 'Get your reports within 24-48 hours' },
        { icon: Shield, title: 'Verified Labs', desc: 'All labs are accredited and quality certified' },
    ];

    const categories = [
        { icon: Beaker, title: 'Blood Tests', desc: 'Comprehensive blood work', image: '/category-blood.jpg' },
        { icon: Microscope, title: 'Urine Tests', desc: 'Complete urine analysis', image: '/category-urine.jpg' },
        { icon: Stethoscope, title: 'Imaging', desc: 'X-rays, ultrasounds & more', image: '/category-imaging.jpg' },
        { icon: Package, title: 'Health Packages', desc: 'Complete health checkups', image: '/category-health.jpg' },
    ];

    const steps = [
        { number: '01', title: 'Choose a Test', desc: 'Browse our comprehensive test catalog' },
        { number: '02', title: 'Select Lab', desc: 'Pick from verified partner laboratories' },
        { number: '03', title: 'Book Appointment', desc: 'Schedule at your convenience' },
        { number: '04', title: 'Get Results', desc: 'Receive reports digitally within hours' },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-xl flex items-center justify-center">
                                <FlaskConical className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold gradient-text">PathoCare</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-600 hover:text-teal-600 transition-colors">Features</a>
                            <a href="#tests" className="text-slate-600 hover:text-teal-600 transition-colors">Tests</a>
                            <a href="#how-it-works" className="text-slate-600 hover:text-teal-600 transition-colors">How It Works</a>
                            <a href="#testimonials" className="text-slate-600 hover:text-teal-600 transition-colors">Reviews</a>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="ghost" className="hidden sm:flex" onClick={() => navigate('/login/patient')}>
                                Sign In
                            </Button>
                            <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => navigate('/login/patient')}>
                                Get Started
                            </Button>
                            <button
                                className="md:hidden p-2"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t border-slate-100 p-4">
                        <div className="flex flex-col gap-4">
                            <a href="#features" className="text-slate-600">Features</a>
                            <a href="#tests" className="text-slate-600">Tests</a>
                            <a href="#how-it-works" className="text-slate-600">How It Works</a>
                            <a href="#testimonials" className="text-slate-600">Reviews</a>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="hero-content"
                        >
                            <Badge className="bg-teal-100 text-teal-700 mb-4">
                                <Star className="w-3 h-3 mr-1 fill-teal-700" />
                                Trusted by 10,000+ patients
                            </Badge>
                            <h1 className="text-4xl lg:text-6xl font-bold text-slate-800 leading-tight">
                                Your Health,{' '}
                                <span className="gradient-text">Our Priority</span>
                            </h1>
                            <p className="text-lg text-slate-500 mt-6 max-w-lg">
                                Book pathology tests effortlessly. Track your health journey with a modern dashboard designed for you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                <Button size="lg" className="bg-teal-500 hover:bg-teal-600" onClick={() => navigate('/login/patient')}>
                                    Book a Test
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button size="lg" variant="outline" onClick={() => navigate('/login/patient')}>
                                    <FlaskConical className="w-4 h-4 mr-2" />
                                    Browse Tests
                                </Button>
                            </div>
                            <div className="flex items-center gap-6 mt-10">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
                                            <img src={`/avatar-${i}.jpg`} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-500">4.9/5 from 2,400+ reviews</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50, rotateY: 15 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                            className="hero-image relative"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="/hero-dashboard.jpg"
                                    alt="Dashboard Preview"
                                    className="w-full"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">15,000+</p>
                                        <p className="text-sm text-slate-500">Tests Completed</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-800">Why Choose Us?</h2>
                        <p className="text-slate-500 mt-3">Experience healthcare reimagined</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-white rounded-2xl p-8 hover:shadow-xl transition-shadow border border-slate-100"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-7 h-7 text-teal-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                                <p className="text-slate-500 mt-3">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Get Started - Role Selection */}
            <section id="get-started" className="py-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-800">Get Started Today</h2>
                        <p className="text-slate-500 mt-3">Choose how you want to join PathoCare</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Patient Card */}
                        <div
                            onClick={() => navigate('/login/patient')}
                            className="group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-500 transition-colors">
                                <User className="w-7 h-7 text-teal-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">I'm a Patient</h3>
                            <p className="text-slate-500 mt-3 text-sm">Book lab tests, track reports, and manage your health journey.</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                    Instant account access
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                    Book tests online
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                                    Digital reports
                                </li>
                            </ul>
                            <div className="mt-8 flex items-center text-teal-600 font-medium text-sm group-hover:gap-2 transition-all">
                                Sign Up as Patient
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>

                        {/* Lab Card */}
                        <div
                            onClick={() => navigate('/login/lab')}
                            className="group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-500 transition-colors">
                                <Building2 className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">I'm a Laboratory</h3>
                            <p className="text-slate-500 mt-3 text-sm">Partner with us to reach more patients and manage bookings.</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                    Verification required
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                    Manage appointments
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                    Upload reports
                                </li>
                            </ul>
                            <div className="mt-8 flex items-center text-indigo-600 font-medium text-sm group-hover:gap-2 transition-all">
                                Register Your Lab
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>

                        {/* Doctor Card */}
                        <div
                            onClick={() => navigate('/login/doctor')}
                            className="group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-purple-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
                                <Stethoscope className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">I'm a Doctor</h3>
                            <p className="text-slate-500 mt-3 text-sm">Access your patients' reports and recommend tests.</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                    Verification required
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                    View patient reports
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                                    Recommend tests
                                </li>
                            </ul>
                            <div className="mt-8 flex items-center text-purple-600 font-medium text-sm group-hover:gap-2 transition-all">
                                Register as Doctor
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>

                        {/* Technician Card */}
                        <div
                            onClick={() => navigate('/login/technician')}
                            className="group bg-white rounded-2xl p-6 border-2 border-slate-100 hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
                                <Microscope className="w-7 h-7 text-amber-600 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">I'm a Technician</h3>
                            <p className="text-slate-500 mt-3 text-sm">Join our network of skilled phlebotomists and grow your career.</p>
                            <ul className="mt-6 space-y-2">
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Flexible schedule
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Earn per collection
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-600">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                    Verified opportunities
                                </li>
                            </ul>
                            <div className="mt-8 flex items-center text-amber-600 font-medium text-sm group-hover:gap-2 transition-all">
                                Register as Technician
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>

                    {/* Already have account link */}
                    <div className="text-center mt-12">
                        <p className="text-slate-500">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login/patient')}
                                className="text-teal-600 font-medium hover:underline"
                            >
                                Sign in here
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            {/* Test Categories */}
            <section id="tests" className="py-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-800">Browse Tests</h2>
                        <p className="text-slate-500 mt-3">Comprehensive diagnostic services</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {categories.map((cat) => (
                            <div
                                key={cat.title}
                                className="group relative rounded-2xl overflow-hidden cursor-pointer"
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.title}
                                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <cat.icon className="w-8 h-8 text-teal-400 mb-3" />
                                    <h3 className="text-xl font-semibold text-white">{cat.title}</h3>
                                    <p className="text-white/70 text-sm mt-1">{cat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
                        <p className="text-slate-500 mt-3">Simple steps to better health</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <div key={step.number} className="relative">
                                <div className="text-6xl font-bold text-slate-100">{step.number}</div>
                                <h3 className="text-xl font-semibold text-slate-800 mt-4">{step.title}</h3>
                                <p className="text-slate-500 mt-2">{step.desc}</p>
                                {idx < steps.length - 1 && (
                                    <ChevronRight className="hidden md:block absolute top-12 right-0 w-6 h-6 text-slate-300" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-800">What Patients Say</h2>
                        <p className="text-slate-500 mt-3">Real experiences from our community</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow"
                            >
                                <Quote className="w-8 h-8 text-teal-200 mb-4" />
                                <p className="text-slate-600">{testimonial.text}</p>
                                <div className="flex items-center gap-4 mt-6">
                                    <img
                                        src={testimonial.avatar}
                                        alt={testimonial.name}
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="font-semibold text-slate-800">{testimonial.name}</p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(testimonial.rating)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-teal-500 to-indigo-600">
                <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white">
                        Ready to Take Control of Your Health?
                    </h2>
                    <p className="text-teal-100 mt-4 text-lg">
                        Join thousands of patients who trust PathoCare for their diagnostic needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <Button size="lg" className="bg-white text-teal-600 hover:bg-teal-50" onClick={() => navigate('/login')}>
                            Get Started Now
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/login')}>
                            <Building2 className="w-4 h-4 mr-2" />
                            For Labs
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                    <FlaskConical className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg font-bold">PathoCare</span>
                            </div>
                            <p className="text-slate-400 text-sm">
                                Modern pathology care platform connecting patients with verified diagnostic labs.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">Book a Test</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Browse Tests</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">View Reports</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">For Labs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li>support@pathocare.com</li>
                                <li>+1 (555) 123-4567</li>
                                <li>123 Health Street, Medical City</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
                        © 2024 PathoCare. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
