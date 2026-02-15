import React from 'react';
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-sky-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl text-left mb-6">
        <Link to="/user-home">
          <Button variant="outline">← Back</Button>
        </Link>
      </div>
      <div className="max-w-4xl bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-4xl font-bold text-sky-700 mb-6">About MarketMania</h1>
        <p className="text-gray-600 text-lg mb-4">
          Market Mania is a virtual multiplayer stock market game designed to help you learn, trade, and compete in a fun and engaging environment.
        </p>
        <p className="text-gray-600 text-lg">
          Whether you are a beginner looking to understand the basics of trading or a pro testing new strategies, Market Mania offers a realistic simulation without the financial risk.
        </p>
      </div>
    </div>
  );
};

export default AboutUs;