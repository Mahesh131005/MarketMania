import React from "react";
import { motion } from "framer-motion";
// shadcn/ui components (assumes your project uses shadcn/ui and Tailwind)
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Single-file homepage component for a multiplayer stock market game
// Tailwind + shadcn UI + framer-motion

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-white text-slate-900">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <Hero />

        <section className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Features />

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BentoCard title="Play & Learn" desc="Learn trading fundamentals through simulated events and guided lessons." icon={PlayIcon} />
              <BentoCard title="Compete with Friends" desc="Create private rooms, invite friends, and compete on leaderboards." icon={UsersIcon} />
              <BentoCard title="Realistic Market" desc="Simulated orders, volatility events and news-driven price moves." icon={MarketIcon} />
              <BentoCard title="Rewards & Badges" desc="Earn virtual currency, unlock badges and climb the seasonal leaderboard." icon={BadgeIcon} />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Active Games" value="2,412" />
              <StatCard label="Players" value="18,230" />
              <StatCard label="Avg Return" value="+12.4%" />
            </div>

            <Leaderboard />
          </div>
        </section>

        <Newsletter />
      </main>

      <footer className="border-t border-sky-100 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600">© {new Date().getFullYear()} MarketMania — Trade, learn, compete.</div>
          <div className="flex gap-3">
            <a className="text-sm hover:underline">Privacy</a>
            <a className="text-sm hover:underline">Terms</a>
            <a className="text-sm hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white/60 backdrop-blur sticky top-0 z-40 border-b border-sky-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-sky-500 to-sky-400 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3v18h18V3H3zm13 14h-2v-6h2v6zm4 0h-2V9h2v8zM9 17H7V7h2v10z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-900">MarketMania</div>
            <div className="text-xs text-slate-500 -mt-0.5">A virtual trading game</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a className="text-sm hover:text-slate-700">Home</a>
          <a className="text-sm hover:text-slate-700">About Us</a>
          <a className="text-sm hover:text-slate-700">How it works</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button className="hidden md:inline-flex" variant="ghost">  <a href="/login">Login</a></Button>
          <Button className="hidden md:inline-flex" variant="default"><a href="/register">Register</a></Button>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <motion.div whileTap={{ scale: 0.95 }} className="p-2 rounded-lg bg-white shadow-sm">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </motion.div>
  );
}

function Hero() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
          A financial trading game where you learn, trade, and compete with friends
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-xl">
          Learn real trading concepts through simulated markets — create rooms, compete on leaderboards, and master the market in a fun virtual environment.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg">Start Playing</Button>
          <Button variant="outline" size="lg">How it Works</Button>
        </div>

        <div className="mt-6 flex gap-4 items-center">
          <div className="text-sm text-slate-500">Trusted by</div>
          <div className="flex gap-3 items-center">
            <div className="text-xs px-2 py-1 rounded bg-sky-50">Finance Club</div>
            <div className="text-xs px-2 py-1 rounded bg-sky-50">College League</div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <div className="rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-white to-sky-50 p-6">
          <div className="grid grid-cols-2 gap-4">
            <MiniTicker symbol="TECH" price="+6.2%" />
            <MiniTicker symbol="FIN" price="-1.3%" />
            <MiniTicker symbol="BIO" price="+2.1%" />
            <MiniTicker symbol="ENERGY" price="+0.5%" />
          </div>

          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Join a Game</CardTitle>
                <CardDescription>Create or join private rooms with friends.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input placeholder="Room code or name" />
                  <Button>Join</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function MiniTicker({ symbol, price }) {
  const positive = price.startsWith("+");
  return (
    <div className="p-3 rounded-lg bg-white shadow-sm flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold">{symbol}</div>
        <div className="text-xs text-slate-500">Simulated</div>
      </div>
      <div className={`text-sm font-medium ${positive ? "text-emerald-600" : "text-rose-600"}`}>{price}</div>
    </div>
  );
}

function Features() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Why MarketMania?</h3>
      <p className="text-slate-600">Bento-style learning: small digestible games with focused learning goals.</p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Guided Lessons</CardTitle>
            <CardDescription>Interactive lessons embedded into the game.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="p-4">
          <CardHeader>
            <CardTitle>Simulated Market</CardTitle>
            <CardDescription>Realistic order book and events.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function BentoCard({ title, desc, icon: Icon }) {
  return (
    <motion.div whileHover={{ y: -6 }} className="rounded-xl bg-white p-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-sky-50">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-slate-600 mt-1">{desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-br from-white to-sky-50 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Leaderboard() {
  const rows = [
    { name: "Aisha", score: "+24.5%" },
    { name: "Ravi", score: "+18.2%" },
    { name: "Meena", score: "+15.9%" },
  ];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">Leaderboard</h4>
        <a className="text-sm text-sky-600 hover:underline">View full</a>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {rows.map((r, i) => (
          <div key={i} className="p-3 rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-xs text-slate-400">Player</div>
              </div>
              <div className="text-sm font-semibold">{r.score}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Newsletter() {
  return (
    <div className="mt-12 bg-gradient-to-br from-sky-100/60 to-white rounded-2xl p-6 shadow-lg">
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <div className="text-lg font-semibold">Get play tips & market updates</div>
          <div className="text-sm text-slate-600">Weekly tips to help you climb the leaderboard and hone trading skills.</div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input placeholder="Your email" />
          <Button>Subscribe</Button>
        </div>
      </div>
    </div>
  );
}

// Simple icons used inside the cards
function PlayIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 2v20l18-10L4 2z" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5C22 14.17 17.33 13 16 13z" />
    </svg>
  );
}
function MarketIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 13h4v7H3v-7zm7-9h4v16h-4V4zm7 5h4v11h-4V9z" />
    </svg>
  );
}
function BadgeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l3 6 6 .5-4.5 3.9L18 20l-6-3.2L6 20l1.5-7.6L3 8.5 9 8 12 2z" />
    </svg>
  );
}

