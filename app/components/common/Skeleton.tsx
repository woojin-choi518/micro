'use client';

interface SkeletonProps {
  darkMode: boolean;
}

export default function Skeleton({ darkMode }: SkeletonProps) {
  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-pulse space-y-4 w-3/4 max-w-lg">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
