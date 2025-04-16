'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

export default function Skeleton({ darkMode }: { darkMode: boolean }) {
  return (
    <motion.div
      className={clsx(
        'min-h-screen flex items-center justify-center bg-gradient-to-br',
        darkMode ? 'from-gray-900 to-gray-800' : 'from-green-50 to-white'
      )}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="space-y-4 w-full max-w-3xl p-6">
        <div className="h-10 bg-green-100 dark:bg-gray-700 rounded shimmer" />
        <div className="h-6 bg-green-100 dark:bg-gray-700 rounded shimmer" />
        <div className="h-6 bg-green-100 dark:bg-gray-700 rounded shimmer w-1/2" />
        <div className="h-[400px] bg-green-100 dark:bg-gray-700 rounded-lg shimmer mt-8" />
      </div>
    </motion.div>
  )
}
