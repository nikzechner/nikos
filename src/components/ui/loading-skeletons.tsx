import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

// Base skeleton animation
const SkeletonPulse = ({ className }: { className?: string }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 1.5, repeat: Infinity }}
    className={`bg-slate-200 rounded ${className}`}
  />
);

// Task List Skeleton
export const TaskListSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex space-x-1">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2 p-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="flex-1 h-4" />
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-4" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Goals Section Skeleton
export const GoalsSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-1" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Habits Section Skeleton
export const HabitsSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-1" />
            <div className="flex items-center space-x-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Quick Notes Skeleton
export const QuickNotesSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent className="space-y-2">
      <Skeleton className="min-h-[80px] w-full" />
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="relative flex-shrink-0">
          <Skeleton className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Journal Skeleton
export const JournalSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm min-w-[340px]">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-40" />
    </CardHeader>
    <CardContent className="space-y-2">
      <div>
        <Skeleton className="h-4 w-48 mb-1" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="min-h-[100px] w-full" />
      </div>
    </CardContent>
  </Card>
);

// Calendar Skeleton
export const CalendarSkeleton = () => (
  <Card className="bg-white/80 backdrop-blur-sm min-w-[340px] flex-1 flex flex-col">
    <CardHeader className="pb-2 flex-shrink-0">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex-1 p-4">
      <div className="grid grid-cols-7 gap-2 mb-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Error State Component
export const ErrorState = ({ 
  message, 
  onRetry, 
  className = "" 
}: { 
  message: string; 
  onRetry?: () => void; 
  className?: string;
}) => (
  <div className={`text-center py-8 ${className}`}>
    <div className="mb-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-red-600 text-xl">⚠️</span>
      </div>
      <div className="text-sm text-red-600 mb-2">Something went wrong</div>
      <div className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Loading Spinner Component
export const LoadingSpinner = ({ size = "md", text = "Loading..." }: { size?: "sm" | "md" | "lg"; text?: string }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`border-2 border-blue-600 border-t-transparent rounded-full ${sizeClasses[size]}`}
      />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  );
};

// Full Dashboard Skeleton - matches the 3-column layout
export const DashboardSkeleton = () => (
  <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-[20px] pt-4 pb-6 flex flex-col">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1.5fr_1.25fr] gap-3 flex-1 h-full"
    >
      {/* Left Sidebar */}
      <div className="space-y-3 min-w-[340px]">
        <QuickNotesSkeleton />
        <GoalsSkeleton />
        <HabitsSkeleton />
      </div>

      {/* Center - Calendar */}
      <div className="space-y-3">
        {/* Header skeleton */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <CalendarSkeleton />
      </div>

      {/* Right Sidebar */}
      <div className="space-y-3 min-w-[340px]">
        <TaskListSkeleton />
        <JournalSkeleton />
      </div>
    </motion.div>
  </div>
);

// Simple Dashboard Loading Skeleton (for data-only loading)
export const DashboardLoadingSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.25fr_1.5fr_1.25fr] gap-3 flex-1 h-full"
  >
    {/* Left Sidebar */}
    <div className="space-y-3 min-w-[340px]">
      <QuickNotesSkeleton />
      <GoalsSkeleton />
      <HabitsSkeleton />
    </div>

    {/* Center - Calendar */}
    <div className="space-y-3">
      {/* Header skeleton */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <CalendarSkeleton />
    </div>

    {/* Right Sidebar */}
    <div className="space-y-3 min-w-[340px]">
      <TaskListSkeleton />
      <JournalSkeleton />
    </div>
  </motion.div>
); 