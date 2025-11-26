import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


export function AboutUs() {
return (
<motion.div
className="max-w-5xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-lg border border-sky-100"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
>
<h1 className="text-4xl font-extrabold text-sky-700 mb-4">About Market Mania</h1>
<p className="text-gray-600 text-lg mb-4">
Market Mania is a virtual multiplayer stock market game designed to help you learn, trade, and compete in a fun and engaging environment.
</p>
<p className="text-gray-600 text-lg">
Our mission is to gamify financial literacy, allowing users to understand trading, risk management, and strategy without any real-world losses.
</p>
</motion.div>
);
}