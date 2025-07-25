"use client";

import { motion } from "framer-motion";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    const checkAuth = async () => {
      setIsRedirecting(true);
      // Add a small delay to show the loading state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    };
    checkAuth();
  }, [router]);

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold text-slate-900 mb-4"
            >
              Life OS
            </motion.h1>
            <motion.p
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-600 mb-8"
            >
              Your personal productivity dashboard
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-500 flex items-center justify-center space-x-2"
            >
              {isRedirecting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Redirecting to dashboard...</span>
            </motion.div>
          </motion.div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto px-6"
          >
            <motion.h1
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-bold text-slate-900 mb-4"
            >
              Life OS
            </motion.h1>
            <motion.p
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-600 mb-8"
            >
              Your personal productivity dashboard
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <p className="text-lg text-slate-700 mb-8">
                Track your goals, build habits, and organize your life with our beautiful dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </SignedOut>
    </>
  );
}
