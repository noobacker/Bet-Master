'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IPL_TEAMS } from '../constants/teams';

export default function BetCalculator() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [odds, setOdds] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [estimatedPayout, setEstimatedPayout] = useState(0);
  const [recommendedAmount, setRecommendedAmount] = useState(0);

  const calculatePayout = (amount: number, oddsValue: number) => {
    return amount * oddsValue;
  };

  const calculateRecommendedAmount = (oddsValue: number) => {
    const targetPayout = 2100;
    const amount = targetPayout / oddsValue;
    // Round to nearest 5
    const roundedAmount = Math.round(amount / 5) * 5;
    return roundedAmount;
  };

  useEffect(() => {
    if (odds && betAmount) {
      const oddsValue = parseFloat(odds);
      const amount = parseFloat(betAmount);
      if (!isNaN(oddsValue) && !isNaN(amount)) {
        setEstimatedPayout(calculatePayout(amount, oddsValue));
        setRecommendedAmount(calculateRecommendedAmount(oddsValue));
      }
    }
  }, [odds, betAmount]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          BetWise Pro
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a team</option>
              {IPL_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Odds
            </label>
            <input
              type="number"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter odds value"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Bet Amount
            </label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter bet amount"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Estimated Payout
            </h2>
            <p className="text-2xl font-bold text-green-600">
              ₹{estimatedPayout.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Recommended Bet Amount
            </h2>
            <p className="text-2xl font-bold text-blue-600">
              ₹{recommendedAmount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              (Target payout: ₹2100 ± ₹10)
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 