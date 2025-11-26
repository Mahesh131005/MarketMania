import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HowToPlay() {
const steps = [
{ title: "Create or Join a Room", desc: "Use the room code or create a new room to start trading with friends." },
{ title: "Learn the Basics", desc: "Follow our interactive lessons to understand trading concepts and market mechanics." },
{ title: "Trade Smart", desc: "Buy and sell virtual stocks based on simulated market conditions." },
{ title: "Compete & Win", desc: "Track leaderboards, earn badges, and compete to be the top trader." },
];


return (
<motion.div
className="max-w-5xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-lg border border-sky-100"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
>
<h1 className="text-4xl font-extrabold text-sky-700 mb-6">How to Play</h1>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{steps.map((step, index) => (
<div key={index} className="p-4 rounded-xl bg-sky-50 shadow-md border border-sky-100 hover:shadow-lg transition-shadow">
<h2 className="text-xl font-semibold text-sky-700 mb-2">{step.title}</h2>
<p className="text-gray-600">{step.desc}</p>
</div>
))}
</div>
</motion.div>
);
}