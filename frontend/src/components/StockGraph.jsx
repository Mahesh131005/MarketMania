import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const StockGraph = ({ gameId, isOpen, onClose, defaultStock }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStock, setSelectedStock] = useState(defaultStock || "");

    useEffect(() => {
        if (defaultStock) {
            setSelectedStock(defaultStock);
        }
    }, [defaultStock]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch(`http://localhost:3000/api/game/${gameId}/history`)
                .then(res => res.json())
                .then(data => {
                    setHistory(data);
                    if (!selectedStock && data.length > 0) {
                        setSelectedStock(data[0].stock_name);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch graph data:", err);
                    setLoading(false);
                });
        }
    }, [gameId, isOpen]);

    if (!isOpen) return null;

    // Process data for Chart.js
    // Data format from DB: [{round_number: 1, stock_name: "RIL", price: 100}, ...]

    // 1. Get unique rounds
    const rounds = [...new Set(history.map(h => h.round_number))].sort((a, b) => a - b);

    // 2. Get unique stocks
    const stocks = [...new Set(history.map(h => h.stock_name))];

    // 3. Filter data for selected stock
    const stockData = history.filter(h => h.stock_name === selectedStock);

    // 4. Map prices to rounds (ensure alignment)
    const prices = rounds.map(r => {
        const entry = stockData.find(h => h.round_number === r);
        return entry ? entry.price : null;
    });

    const data = {
        labels: rounds.map(r => `Round ${r}`),
        datasets: [
            {
                label: selectedStock,
                data: prices,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Price History: ${selectedStock}`,
            },
        },
        scales: {
            y: {
                beginAtZero: false
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl transform animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Stock Price Trends</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-bold">&times;</button>
                </div>

                <div className="mb-4">
                    <label className="mr-2 font-semibold">Select Stock:</label>
                    <select
                        value={selectedStock}
                        onChange={(e) => setSelectedStock(e.target.value)}
                        className="p-2 border rounded shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                        {stocks.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-96">
                    {loading ? <p>Loading data...</p> :
                        history.length > 0 ? <Line options={options} data={data} /> : <p className="text-center text-gray-500 flex items-center justify-center h-full">Graphs will be available once the game starts.</p>}
                </div>

                <div className="mt-4 flex justify-end">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition">Close</button>
                </div>
            </div>
        </div>
    );
};

export default StockGraph;
