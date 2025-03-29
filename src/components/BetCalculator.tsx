'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IPL_TEAMS } from '../constants/teams';
import { FaGithub, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface TeamBet {
  odds: string;
  betAmount: string;
  estimatedPayout: number;
  recommendedAmount: number;
}

interface MatchBet {
  team1: string;
  team2: string;
  team1Bet: TeamBet;
  team2Bet: TeamBet;
}

interface InvestmentAnalysis {
  actualInvestment: number;
  recommendedInvestment: number;
  winProfit: number;    // When both teams win
  team1LossScenario: number;   // When team 1 loses and team 2 wins
  team2LossScenario: number;   // When team 2 loses and team 1 wins
}

interface Settings {
  targetPayout: number;
  maxBudget: number;
}

export default function BetCalculator() {
  const [settings, setSettings] = useState<Settings>({
    targetPayout: 2100,
    maxBudget: 0,
  });
  const [tempSettings, setTempSettings] = useState<Settings>({
    targetPayout: 2100,
    maxBudget: 0,
  });
  const [matches, setMatches] = useState<MatchBet[]>([
    {
      team1: '',
      team2: '',
      team1Bet: {
        odds: '',
        betAmount: '',
        estimatedPayout: 0,
        recommendedAmount: 0,
      },
      team2Bet: {
        odds: '',
        betAmount: '',
        estimatedPayout: 0,
        recommendedAmount: 0,
      },
    },
  ]);
  const [customTeam1, setCustomTeam1] = useState('');
  const [customTeam2, setCustomTeam2] = useState('');
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);

  const calculatePayout = (amount: number, oddsValue: number) => {
    return amount * oddsValue;
  };

  const calculateRecommendedAmount = (oddsValue: number, totalBudget: number) => {
    if (settings.maxBudget > 0) {
      // Calculate amount based on odds ratio
      const totalOdds = parseFloat(matches[0].team1Bet.odds) + parseFloat(matches[0].team2Bet.odds);
      const ratio = parseFloat(matches[0].team1Bet.odds) / totalOdds;
      const amount = (totalBudget * ratio) / settings.maxBudget;
      return Math.round(amount / 5) * 5;
    }
    const amount = settings.targetPayout / oddsValue;
    return Math.round(amount / 5) * 5;
  };

  const calculateBudgetBasedAmount = (oddsValue: number) => {
    if (settings.maxBudget <= 0) return 0;
    
    const team1Odds = parseFloat(matches[0].team1Bet.odds);
    const team2Odds = parseFloat(matches[0].team2Bet.odds);
    
    if (!team1Odds || !team2Odds) return 0;
    
    // Calculate amounts to get equal payouts
    const ratio = team1Odds / team2Odds;
    const amount1 = (settings.maxBudget * ratio) / (1 + ratio);
    const amount2 = settings.maxBudget - amount1;
    
    // Calculate payouts to verify they're equal
    const payout1 = calculatePayout(amount1, team1Odds);
    const payout2 = calculatePayout(amount2, team2Odds);
    
    // If payouts are significantly different, adjust amounts
    if (Math.abs(payout1 - payout2) > 1) {
      const avgPayout = (payout1 + payout2) / 2;
      const newAmount1 = avgPayout / team1Odds;
      const newAmount2 = avgPayout / team2Odds;
      
      // Return the appropriate amount based on which team's odds were passed
      return Math.round((oddsValue === team1Odds ? newAmount1 : newAmount2) / 5) * 5;
    }
    
    // Return the appropriate amount based on which team's odds were passed
    return Math.round((oddsValue === team1Odds ? amount1 : amount2) / 5) * 5;
  };

  const calculateInvestmentAnalysis = (match: MatchBet): InvestmentAnalysis => {
    const team1Amount = parseFloat(match.team1Bet.betAmount) || 0;
    const team2Amount = parseFloat(match.team2Bet.betAmount) || 0;
    const team1Odds = parseFloat(match.team1Bet.odds) || 0;
    const team2Odds = parseFloat(match.team2Bet.odds) || 0;

    // Calculate actual investment based on user input
    const actualInvestment = team1Amount + team2Amount;
    
    // Calculate recommended investment based on odds
    const recommendedTeam1Amount = calculateRecommendedAmount(team1Odds, actualInvestment);
    const recommendedTeam2Amount = calculateRecommendedAmount(team2Odds, actualInvestment);
    const recommendedInvestment = recommendedTeam1Amount + recommendedTeam2Amount;

    // Calculate win scenario (both teams win)
    const team1Payout = calculatePayout(team1Amount, team1Odds);
    const team2Payout = calculatePayout(team2Amount, team2Odds);
    const winProfit = (team1Payout + team2Payout) - actualInvestment;

    // Calculate loss scenarios
    // If only one team's data is entered, loss is the entire investment
    if (!team1Amount || !team2Amount) {
      return {
        actualInvestment,
        recommendedInvestment,
        winProfit,
        team1LossScenario: -actualInvestment,
        team2LossScenario: -actualInvestment,
      };
    }

    // When using budget, calculate loss based on the other team's payout
    if (settings.maxBudget > 0) {
      return {
        actualInvestment,
        recommendedInvestment,
        winProfit,
        team1LossScenario: team2Payout - actualInvestment,
        team2LossScenario: team1Payout - actualInvestment,
      };
    }

    // When both teams have data, calculate specific loss scenarios
    const team1LossScenario = team2Payout - actualInvestment;
    const team2LossScenario = team1Payout - actualInvestment;

    return {
      actualInvestment,
      recommendedInvestment,
      winProfit,
      team1LossScenario,
      team2LossScenario,
    };
  };

  const updateTeamBet = (matchIndex: number, teamIndex: 1 | 2, field: keyof TeamBet, value: string) => {
    const newMatches = [...matches];
    const teamBet = teamIndex === 1 ? 'team1Bet' : 'team2Bet';
    newMatches[matchIndex] = {
      ...newMatches[matchIndex],
      [teamBet]: {
        ...newMatches[matchIndex][teamBet],
        [field]: value,
      },
    };

    if (field === 'odds') {
      const oddsValue = parseFloat(value);
      if (!isNaN(oddsValue)) {
        newMatches[matchIndex][teamBet].recommendedAmount = calculateRecommendedAmount(oddsValue, newMatches[matchIndex].team1Bet.estimatedPayout + newMatches[matchIndex].team2Bet.estimatedPayout);
        // Clear bet amount when odds change
        newMatches[matchIndex][teamBet].betAmount = '';
        newMatches[matchIndex][teamBet].estimatedPayout = 0;
      }
    }

    if (field === 'betAmount') {
      const oddsValue = parseFloat(newMatches[matchIndex][teamBet].odds);
      const amount = parseFloat(newMatches[matchIndex][teamBet].betAmount);
      if (!isNaN(oddsValue) && !isNaN(amount)) {
        newMatches[matchIndex][teamBet].estimatedPayout = calculatePayout(amount, oddsValue);
        // Clear recommended amount when user enters any value
        newMatches[matchIndex][teamBet].recommendedAmount = 0;
      } else if (value === '') {
        // If bet amount is cleared, recalculate recommended amount if odds exist
        const oddsValue = parseFloat(newMatches[matchIndex][teamBet].odds);
        if (!isNaN(oddsValue)) {
          newMatches[matchIndex][teamBet].recommendedAmount = calculateRecommendedAmount(oddsValue, newMatches[matchIndex].team1Bet.estimatedPayout + newMatches[matchIndex].team2Bet.estimatedPayout);
        }
      }
    }

    setMatches(newMatches);
  };

  const importRecommendedAmount = (matchIndex: number, teamIndex: 1 | 2) => {
    const newMatches = [...matches];
    const teamBet = teamIndex === 1 ? 'team1Bet' : 'team2Bet';
    const recommendedAmount = newMatches[matchIndex][teamBet].recommendedAmount;
    const odds = parseFloat(newMatches[matchIndex][teamBet].odds);
    
    newMatches[matchIndex] = {
      ...newMatches[matchIndex],
      [teamBet]: {
        ...newMatches[matchIndex][teamBet],
        betAmount: recommendedAmount.toString(),
        estimatedPayout: calculatePayout(recommendedAmount, odds),
      },
    };
    setMatches(newMatches);
  };

  const addMatch = () => {
    setMatches([
      ...matches,
      {
        team1: '',
        team2: '',
        team1Bet: {
          odds: '',
          betAmount: '',
          estimatedPayout: 0,
          recommendedAmount: 0,
        },
        team2Bet: {
          odds: '',
          betAmount: '',
          estimatedPayout: 0,
          recommendedAmount: 0,
        },
      },
    ]);
  };

  const handleSettingsSave = () => {
    setSettings(tempSettings);
  };

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F172A]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] mb-2"
            >
              Bet Master
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl text-[#94A3B8] mb-4"
            >
              Professional IPL Betting Calculator
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto"
            >
              Calculate your bets and optimize your returns with our advanced betting calculator
            </motion.p>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155]"
        >
          <button
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-2xl font-semibold text-white">How to Use Bet Master</h2>
            <motion.div
              animate={{ rotate: isGuideExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isGuideExpanded ? (
                <FaChevronUp className="w-6 h-6 text-[#3B82F6]" />
              ) : (
                <FaChevronDown className="w-6 h-6 text-[#3B82F6]" />
              )}
            </motion.div>
          </button>

          <AnimatePresence>
            {isGuideExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 text-[#94A3B8] mt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-semibold">1</div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Set Your Calculator Settings</h3>
                      <p>Choose between two modes:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><span className="text-[#3B82F6]">Target Payout Mode:</span> Enter your desired payout amount</li>
                        <li><span className="text-[#3B82F6]">Maximum Budget Mode:</span> Set your total betting budget</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-semibold">2</div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Select Teams</h3>
                      <p>Choose teams from the IPL list or enter custom team names for your match.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-semibold">3</div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Enter Betting Details</h3>
                      <p>For each team:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Enter the odds for the team</li>
                        <li>Input your bet amount or use the recommended amount</li>
                        <li>View the estimated payout</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-semibold">4</div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Analyze Your Investment</h3>
                      <p>Review the investment analysis section to see:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Total investment amount</li>
                        <li>Potential total payout</li>
                        <li>Profit/loss scenarios</li>
                        <li>Loss scenarios for each team</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] font-semibold">5</div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Add More Matches</h3>
                      <p>Use the &quot;Add Another Match&quot; button to calculate multiple matches simultaneously.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Calculator Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Settings Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-[#1E293B] rounded-2xl p-6 mb-6 border border-[#334155]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-white">Calculator Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Target Payout
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                <input
                  type="number"
                  value={tempSettings.targetPayout}
                  onChange={(e) => setTempSettings({ ...tempSettings, targetPayout: Number(e.target.value) })}
                  disabled={tempSettings.maxBudget > 0}
                  className={`w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 ${
                    tempSettings.maxBudget > 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
              </div>
              {tempSettings.maxBudget > 0 && (
                <p className="mt-1 text-xs text-[#EF4444]">
                  Target Payout is disabled when Maximum Budget is set
                </p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Maximum Budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                <input
                  type="number"
                  value={tempSettings.maxBudget || ''}
                  onChange={(e) => {
                    const maxBudget = e.target.value === '' ? 0 : Number(e.target.value);
                    setTempSettings({
                      ...tempSettings,
                      maxBudget,
                      targetPayout: maxBudget > 0 ? 0 : tempSettings.targetPayout,
                    });
                  }}
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSettingsSave}
              className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#3B82F6]/20"
            >
              Save Changes
            </button>
          </div>
        </motion.div>

        {/* Matches Section */}
        <AnimatePresence>
          <div className="space-y-6">
            {matches.map((match, matchIndex) => {
              const analysis = calculateInvestmentAnalysis(match);
              return (
                <motion.div
                  key={matchIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155]"
                >
                  {/* Teams Selection */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                        Team 1
                      </label>
                      <div className="space-y-2">
                        <select
                          value={match.team1 === customTeam1 ? 'custom' : match.team1}
                          onChange={(e) => {
                            const newMatches = [...matches];
                            if (e.target.value === 'custom') {
                              setCustomTeam1('');
                              newMatches[matchIndex].team1 = '';
                            } else {
                              newMatches[matchIndex].team1 = e.target.value;
                              setCustomTeam1('');
                            }
                            setMatches(newMatches);
                          }}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.5em_1.5em] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M10%203a1%201%200%2001.707.293l3%203a1%201%200%2001-1.414%201.414L10%205.414%207.707%207.707a1%201%200%2001-1.414-1.414l3-3A1%201%200%0110%203zm-3.707%209.293a1%201%200%20011.414%200L10%2014.586l2.293-2.293a1%201%200%20011.414%201.414l-3%203a1%201%200%2001-1.414%200l-3-3a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
                        >
                          <option value="">Select team</option>
                          {IPL_TEAMS.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                          <option value="custom">Custom Team</option>
                        </select>
                        {(match.team1 === '' || match.team1 === customTeam1) && (
                          <input
                            type="text"
                            value={customTeam1}
                            onChange={(e) => {
                              setCustomTeam1(e.target.value);
                              const newMatches = [...matches];
                              newMatches[matchIndex].team1 = e.target.value;
                              setMatches(newMatches);
                            }}
                            placeholder="Enter custom team name"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center sm:mx-6">
                      <div className="text-2xl font-bold text-[#3B82F6]">
                        VS
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                        Team 2
                      </label>
                      <div className="space-y-2">
                        <select
                          value={match.team2 === customTeam2 ? 'custom' : match.team2}
                          onChange={(e) => {
                            const newMatches = [...matches];
                            if (e.target.value === 'custom') {
                              setCustomTeam2('');
                              newMatches[matchIndex].team2 = '';
                            } else {
                              newMatches[matchIndex].team2 = e.target.value;
                              setCustomTeam2('');
                            }
                            setMatches(newMatches);
                          }}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200 appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1.5em_1.5em] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2364748B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M10%203a1%201%200%2001.707.293l3%203a1%201%200%2001-1.414%201.414L10%205.414%207.707%207.707a1%201%200%2001-1.414-1.414l3-3A1%201%200%0110%203zm-3.707%209.293a1%201%200%20011.414%200L10%2014.586l2.293-2.293a1%201%200%20011.414%201.414l-3%203a1%201%200%2001-1.414%200l-3-3a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
                        >
                          <option value="">Select team</option>
                          {IPL_TEAMS.map((team) => (
                            <option key={team} value={team}>
                              {team}
                            </option>
                          ))}
                          <option value="custom">Custom Team</option>
                        </select>
                        {(match.team2 === '' || match.team2 === customTeam2) && (
                          <input
                            type="text"
                            value={customTeam2}
                            onChange={(e) => {
                              setCustomTeam2(e.target.value);
                              const newMatches = [...matches];
                              newMatches[matchIndex].team2 = e.target.value;
                              setMatches(newMatches);
                            }}
                            placeholder="Enter custom team name"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Betting Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Team 1 Betting */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white">
                        {match.team1 || 'Team 1'} Betting
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Odds
                          </label>
                          <input
                            type="number"
                            value={match.team1Bet.odds}
                            onChange={(e) => updateTeamBet(matchIndex, 1, 'odds', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                            placeholder="Enter odds"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Bet Amount
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                              <input
                                type="number"
                                value={match.team1Bet.betAmount}
                                onChange={(e) => updateTeamBet(matchIndex, 1, 'betAmount', e.target.value)}
                                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                                placeholder="Enter amount"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => importRecommendedAmount(matchIndex, 1)}
                                className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#3B82F6]/20"
                              >
                                Import Recommended
                              </button>
                              {settings.maxBudget > 0 && (
                                <button
                                  onClick={() => {
                                    const newMatches = [...matches];
                                    const amount = calculateBudgetBasedAmount(parseFloat(match.team1Bet.odds));
                                    newMatches[matchIndex].team1Bet.betAmount = amount.toString();
                                    newMatches[matchIndex].team1Bet.estimatedPayout = calculatePayout(amount, parseFloat(match.team1Bet.odds));
                                    setMatches(newMatches);
                                  }}
                                  className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#10B981]/20"
                                >
                                  Use Budget
                                </button>
                              )}
                            </div>
                          </div>
                          {match.team1Bet.recommendedAmount > 0 && (
                            <p className="mt-2 text-sm text-[#3B82F6]">
                              Recommended Amount: ₹{match.team1Bet.recommendedAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                          Estimated Payout
                        </h4>
                        <p className="text-2xl font-bold text-[#10B981]">
                          ₹{match.team1Bet.estimatedPayout.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Team 2 Betting */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-white">
                        {match.team2 || 'Team 2'} Betting
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Odds
                          </label>
                          <input
                            type="number"
                            value={match.team2Bet.odds}
                            onChange={(e) => updateTeamBet(matchIndex, 2, 'odds', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                            placeholder="Enter odds"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Bet Amount
                          </label>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]">₹</span>
                              <input
                                type="number"
                                value={match.team2Bet.betAmount}
                                onChange={(e) => updateTeamBet(matchIndex, 2, 'betAmount', e.target.value)}
                                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-[#64748B] focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all duration-200"
                                placeholder="Enter amount"
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <button
                                onClick={() => importRecommendedAmount(matchIndex, 2)}
                                className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#3B82F6]/20"
                              >
                                Import Recommended
                              </button>
                              {settings.maxBudget > 0 && (
                                <button
                                  onClick={() => {
                                    const newMatches = [...matches];
                                    const amount = calculateBudgetBasedAmount(parseFloat(match.team2Bet.odds));
                                    newMatches[matchIndex].team2Bet.betAmount = amount.toString();
                                    newMatches[matchIndex].team2Bet.estimatedPayout = calculatePayout(amount, parseFloat(match.team2Bet.odds));
                                    setMatches(newMatches);
                                  }}
                                  className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#10B981]/20"
                                >
                                  Use Budget
                                </button>
                              )}
                            </div>
                          </div>
                          {match.team2Bet.recommendedAmount > 0 && (
                            <p className="mt-2 text-sm text-[#3B82F6]">
                              Recommended Amount: ₹{match.team2Bet.recommendedAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                          Estimated Payout
                        </h4>
                        <p className="text-2xl font-bold text-[#10B981]">
                          ₹{match.team2Bet.estimatedPayout.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Investment Analysis */}
                  <div className="mt-8 pt-8 border-t border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6">
                      Investment Analysis
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                          Total Investment
                        </h4>
                        <p className="text-2xl font-bold text-[#3B82F6]">
                          ₹{analysis.actualInvestment.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                          Total Payout
                        </h4>
                        <p className="text-2xl font-bold text-[#10B981]">
                          ₹{(match.team1Bet.estimatedPayout + match.team2Bet.estimatedPayout).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                          Profit/Loss
                        </h4>
                        <p className={`text-2xl font-bold ${analysis.winProfit >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                          ₹{analysis.winProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {match.team1 && match.team2 && (
                        <>
                          {(match.team1Bet.betAmount || settings.maxBudget > 0) && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                                {match.team1} Wins, {match.team2} Loses
                              </h4>
                              <p className="text-2xl font-bold text-[#EF4444]">
                                ₹{analysis.team2LossScenario.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {(match.team2Bet.betAmount || settings.maxBudget > 0) && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                              <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                                {match.team2} Wins, {match.team1} Loses
                              </h4>
                              <p className="text-2xl font-bold text-[#EF4444]">
                                ₹{analysis.team1LossScenario.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      {/* Show single team loss scenario */}
                      {(!match.team1Bet.betAmount || !match.team2Bet.betAmount) && (match.team1Bet.betAmount || match.team2Bet.betAmount) && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-sm font-medium text-[#94A3B8] mb-1">
                            {match.team1Bet.betAmount ? match.team1 : match.team2} Loss Scenario
                          </h4>
                          <p className="text-2xl font-bold text-[#EF4444]">
                            ₹{(-analysis.actualInvestment).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={addMatch}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-[#3B82F6]/20"
            >
              Add Another Match
            </motion.button>
          </div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-[#94A3B8] bg-[#1E293B]">
        <p className="text-sm">
          Designed and developed by{' '}
          <a
            href="https://github.com/noobacker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3B82F6] hover:text-[#60A5FA] transition-colors duration-200 inline-flex items-center gap-1"
          >
            noobacker
            <FaGithub className="w-4 h-4" />
          </a>
        </p>
      </footer>
    </div>
  );
} 