import React from 'react';
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

const ContactUs = () => {
    return (
        <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 flex-col">
            <div className="w-full max-w-4xl text-left mb-6">
                <Link to="/user-home">
                    <Button variant="outline">← Back</Button>
                </Link>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
                <h2 className="text-3xl font-bold text-center text-sky-700 mb-6">Contact Us</h2>
                <p className="text-gray-600 text-lg mb-6 text-center">
                    Have questions or feedback? We'd love to hear from you. Reach out to our team anytime.
                </p>
                <form className="flex flex-col gap-4">
                    <input className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400" type="text" placeholder="Your Name" />
                    <input className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400" type="email" placeholder="Your Email" />
                    <textarea className="border border-sky-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-400 h-32" placeholder="Your Message"></textarea>
                    <Button className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg transition-all">Send Message</Button>
                </form>
            </div>
        </div>
    );
};

export default ContactUs;