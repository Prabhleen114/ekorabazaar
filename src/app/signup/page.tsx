'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, type Variants } from 'motion/react'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

function SignupForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          password,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create your account.')
      }

      if (data.success) {
        // Sync guest cart if any
        try {
          const { getGuestCart, clearGuestCart } = await import('@/lib/guest-cart')
          const guestItems = getGuestCart()
          
          if (guestItems && guestItems.length > 0) {
            await fetch('/api/cart/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: guestItems })
            })
            clearGuestCart()
          }
        } catch (syncErr) {
          console.error('Guest cart sync error:', syncErr)
        }

        const destination = redirectTo || data.redirectUrl || '/'
        window.location.href = destination
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Connection timed out. Please check your network and try again.')
      } else {
        setError(err.message || 'Unable to complete registration. Please try again.')
      }
      setLoading(false)
    }
  }

  const googleAuthUrl = `/api/auth/google${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  }

  return (
    <div className="flex min-h-screen lg:h-screen lg:max-h-screen w-full bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white relative overflow-y-auto lg:overflow-hidden">
      {/* Left Form Section */}
      <div className="flex w-full flex-col justify-between lg:w-1/2 h-full p-6 sm:p-8 lg:p-10 relative overflow-y-auto">
        {/* Header Branding */}
        <div className="w-full flex items-center justify-start shrink-0">
          <Link href="/" className="inline-block group">
            <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-neutral-900 hover:text-neutral-600 transition-colors">
              EKORA BAZAAR
            </span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex flex-1 items-center justify-center w-full my-auto py-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[380px] sm:max-w-[400px]"
          >
            {/* Titles */}
            <motion.div variants={itemVariants} className="mb-4 text-center">
              <h1 className="mb-1 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
                Create Account
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500">
                Join the artisan &amp; studio creator network
              </p>
            </motion.div>

            {/* Error Notification */}
            {error && (
              <motion.div
                variants={itemVariants}
                className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {/* Google Sign-up Button */}
            <motion.div variants={itemVariants} className="mb-3">
              <a
                href={googleAuthUrl}
                className="flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 shadow-2xs"
              >
                <GoogleIcon className="text-base sm:text-lg" />
                Sign Up with Google
              </a>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={itemVariants}
              className="relative my-3 flex items-center"
            >
              <div className="grow border-t border-neutral-200"></div>
              <span className="px-3 text-xs text-neutral-400">or</span>
              <div className="grow border-t border-neutral-200"></div>
            </motion.div>

            {/* Form */}
            <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-neutral-800">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              {/* Mobile Phone */}
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-neutral-800">
                  Phone Number
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-4 rounded-l-full border border-r-0 border-neutral-200 bg-neutral-50 text-neutral-600 text-xs font-mono">
                    +91
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full rounded-r-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                  />
                </div>
              </motion.div>

              {/* Studio / Brand Name */}
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="businessName" className="text-sm font-medium text-neutral-800">
                    Studio / Brand Name
                  </label>
                  <span className="text-[11px] text-neutral-400">optional</span>
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Aura Studio"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-neutral-800">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-neutral-800">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 transition-all"
                />
              </motion.div>

              {/* Sign Up Button */}
              <motion.div variants={itemVariants} className="mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-b from-[#3a3a3a] to-[#121212] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </motion.div>
            </form>

            {/* Footer Links */}
            <motion.div
              variants={itemVariants}
              className="mt-6 text-sm text-neutral-500 text-center flex flex-col gap-2"
            >
              <div>
                Already have an account?{' '}
                <Link
                  href={`/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Log in
                </Link>
              </div>
              <div>
                <Link
                  href="/sell/start-selling"
                  className="text-xs text-neutral-400 hover:text-neutral-700 underline transition-colors"
                >
                  Raw Material Manufacturer? Apply as Seller
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Image Section */}
      <div className="hidden lg:block lg:w-1/2 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
          <img
            src="https://assets.watermelon.sh/auth-7.avif"
            alt="Ekora Studio background"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-sm font-medium text-neutral-400">
          Loading...
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
