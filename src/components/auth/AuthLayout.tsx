import { motion } from 'framer-motion';
import { FlaskConical, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    image: string;
    title: string;
    description: string;
    roleName: string;
    roleColor: string; // e.g. 'teal', 'indigo', 'purple'
}

export function AuthLayout({ children, image, title, description, roleName, roleColor }: AuthLayoutProps) {
    const navigate = useNavigate();

    // Color maps for Tailwind classes
    const colorMap: Record<string, any> = {
        teal: {
            bg: 'bg-teal-500',
            text: 'text-teal-600',
            button: 'bg-teal-600 hover:bg-teal-700',
            accent: 'from-teal-500 to-emerald-600'
        },
        indigo: {
            bg: 'bg-indigo-500',
            text: 'text-indigo-600',
            button: 'bg-indigo-600 hover:bg-indigo-700',
            accent: 'from-indigo-500 to-blue-600'
        },
        purple: {
            bg: 'bg-purple-500',
            text: 'text-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700',
            accent: 'from-purple-500 to-fuchsia-600'
        },
        amber: {
            bg: 'bg-amber-500',
            text: 'text-amber-600',
            button: 'bg-amber-600 hover:bg-amber-700',
            accent: 'from-amber-500 to-orange-600'
        }
    };

    const colors = colorMap[roleColor] || colorMap.teal;

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            {/* Left Side: Illustration / Image (Hidden on small screens) */}
            <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-slate-900">
                <img
                    src={image}
                    alt="Healthcare Illustration"
                    className="absolute inset-0 w-full h-full object-cover opacity-80 scale-105"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.accent} opacity-40`} />

                <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 text-white">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                                <FlaskConical className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">PathoCare</span>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl lg:text-5xl font-bold leading-tight uppercase tracking-wide opacity-90">
                                {roleName} <br />
                                <span className="text-white">Portal</span>
                            </h2>
                            <p className="text-lg lg:text-xl text-white/80 max-w-md font-light leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="mt-12 flex items-center gap-4 text-sm text-white/60">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800" />
                                ))}
                            </div>
                            <p>Trusted by healthcare professionals nationwide</p>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-slate-900 to-transparent opacity-50" />
            </div>

            {/* Right Side: Auth Form */}
            <div className="flex-1 flex flex-col relative bg-slate-50/50">
                {/* Back Button */}
                <div className="absolute top-8 left-8 z-20">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>
                </div>

                <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md"
                    >
                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 lg:p-10">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                                <p className="text-slate-500 mt-2">Enter your credentials to continue</p>
                            </div>

                            {children}
                        </div>

                        {/* Footer links for mobile */}
                        <div className="mt-8 text-center md:hidden">
                            <div className="flex items-center justify-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                    <FlaskConical className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold gradient-text">PathoCare</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    &copy; 2024 PathoCare Diagnostics. All rights reserved.
                </div>
            </div>
        </div>
    );
}
