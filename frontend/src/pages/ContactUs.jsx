import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
export function ContactUs() {
return (
<motion.div
className="max-w-3xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-lg border border-sky-100"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
>
<h1 className="text-4xl font-extrabold text-sky-700 mb-4">Contact Us</h1>
<p className="text-gray-600 text-lg mb-6">
Have questions or feedback? We'd love to hear from you. Reach out to our team anytime.
</p>
<form className="flex flex-col gap-4">
<input className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400" type="text" placeholder="Your Name" />
<input className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400" type="email" placeholder="Your Email" />
<textarea className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400" rows={5} placeholder="Your Message" />
<Button size="lg" className="bg-sky-600 hover:bg-sky-700 text-white">Send Message</Button>
</form>
</motion.div>
);
}