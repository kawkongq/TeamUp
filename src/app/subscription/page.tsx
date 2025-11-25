"use client";

import Link from "next/link";

const features = [
  "Unlimited team creation and event participation",
  "Priority matching with top collaborators",
  "Advanced chat and file sharing for teams",
  "Personalized recommendations for projects and events",
  "Early access to upcoming features and beta tools",
];

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      <header className="pt-16 pb-10 text-center px-4">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/40 shadow-sm text-indigo-700 text-sm font-semibold">
          Premium Plan
        </div>
        <h1 className="mt-6 text-4xl sm:text-5xl font-bold text-gray-900">
          Upgrade to Premium for just 49 THB
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
          Unlock advanced collaboration tools, priority matching, and early access features to
          accelerate your projects.
        </p>
      </header>

      <main className="pb-20 px-4">
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 glass-card rounded-3xl p-8 shadow-xl border border-white/30 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What you get</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-2xl border border-white/30 bg-white/50 p-4 shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold">
                    ✓
                  </span>
                  <p className="text-gray-700 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 shadow-2xl border border-white/40 backdrop-blur">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">
                  Premium
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">49 THB</h3>
                <p className="text-sm text-gray-500">per month</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                Best Value
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Instant activation after payment
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Cancel anytime, no hidden fees
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Priority support for premium members
              </li>
            </ul>

            <button className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold shadow-lg hover:shadow-xl transform hover:translate-y-[-2px] transition-all duration-200">
              Start Premium for 49 THB
            </button>

            <p className="mt-4 text-xs text-gray-500 text-center">
              By continuing, you agree to the Terms of Service and Privacy Policy.
            </p>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
