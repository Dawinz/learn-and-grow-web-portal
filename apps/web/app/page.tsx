'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router])

  const earningMethods = [
    {
      title: 'Complete Lessons',
      description: 'Learn new skills and earn XP by completing educational lessons',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-blue-600 to-blue-700',
    },
    {
      title: 'Daily Challenges',
      description: 'Complete daily tasks and challenges to accumulate XP rewards',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-purple-600 to-purple-700',
    },
    {
      title: 'Watch Ads',
      description: 'Earn XP by watching short educational and promotional content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-green-600 to-green-700',
    },
    {
      title: 'Refer Friends',
      description: 'Invite friends and earn bonus XP when they reach milestones',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'from-orange-600 to-orange-700',
    },
    {
      title: 'Quizzes & Tests',
      description: 'Test your knowledge and earn XP for correct answers',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-pink-600 to-pink-700',
    },
    {
      title: 'Achievements',
      description: 'Unlock achievements and milestones for bonus XP rewards',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'from-indigo-600 to-indigo-700',
    },
  ]

  const learningPaths = [
    {
      title: 'Technology & Programming',
      description: 'Learn coding, web development, and software engineering',
      courses: '50+ Courses',
    },
    {
      title: 'Business & Finance',
      description: 'Master entrepreneurship, finance, and business management',
      courses: '30+ Courses',
    },
    {
      title: 'Design & Creativity',
      description: 'Explore graphic design, UI/UX, and creative skills',
      courses: '40+ Courses',
    },
    {
      title: 'Marketing & Growth',
      description: 'Learn digital marketing, SEO, and growth strategies',
      courses: '35+ Courses',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                EARNVERSE
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Learn Skills. Earn Rewards. Grow Your Future.
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Transform your learning journey into real earnings. Complete courses, complete challenges, and convert your XP into cash.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/start"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200"
              >
                Withdraw Earnings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Earning Methods Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Ways to Earn</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Multiple opportunities to earn XP and convert it into real cash
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earningMethods.map((method, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10 group"
            >
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{method.title}</h3>
              <p className="text-gray-400">{method.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Paths Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Learning Paths</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore diverse learning opportunities across multiple domains
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {learningPaths.map((path, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-white mb-3">{path.title}</h3>
              <p className="text-gray-400 mb-4">{path.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-medium">{path.courses}</span>
                <span className="text-gray-500 text-sm">Available Now</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-12 border border-gray-700/50 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Earning?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already earning while they learn. Start your journey today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/start"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Start Learning Now
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200"
              >
                Access Withdrawal Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                EARNVERSE
              </h3>
              <p className="text-gray-400 text-sm mt-1">Learn. Earn. Grow.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/start" className="text-gray-400 hover:text-white transition">
                Get Started
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition">
                Withdraw
              </Link>
              <Link href="/login" className="text-gray-400 hover:text-white transition">
                Login
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 EARNVERSE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
