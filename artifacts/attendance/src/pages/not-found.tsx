import React from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full w-full flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-12 rounded-3xl max-w-md w-full text-center"
      >
        <div className="h-20 w-20 mx-auto rounded-2xl bg-white/20 dark:bg-white/5 flex items-center justify-center mb-6 shadow-inner">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <button
          onClick={() => setLocation("/")}
          className="w-full py-3 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors"
        >
          Return to Dashboard
        </button>
      </motion.div>
    </div>
  );
}
