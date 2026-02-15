import React, { useState } from "react";
import { Sidebar } from "../components/ui/sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";

export default function LearningPage() {
    const [query, setQuery] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await fetch("http://localhost:3000/api/game/learn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: query, userId: user.user_id })
            });
            const data = await res.json();
            setResponse(data.answer);
        } catch (e) {
            setResponse("Error contacting AI mentor.");
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen bg-sky-50">
            <Sidebar />
            <div className="flex-1 p-8">
                <h1 className="text-3xl font-bold text-sky-700 mb-6">AI Trading Mentor</h1>
                <Card className="max-w-2xl mx-auto p-6">
                    <div className="space-y-4">
                        <Input
                            placeholder="Ask about P/E ratio, Diversification, etc..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                        />
                        <Button onClick={handleAsk} disabled={loading} className="w-full">
                            {loading ? "Thinking..." : "Ask AI"}
                        </Button>
                        {response && (
                            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                <p className="text-indigo-900">{response}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}