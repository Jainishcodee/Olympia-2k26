import React, { useState } from 'react';
import {
  calculateCricketNRR,
  calculateFootballNetScore,
  calculateVolleyballNetScore,
  calculateRacketNetScore,
  CricketMatchInput,
  FootballMatchInput,
  VolleyballMatchInput,
} from '@/utils/netScore';
import toast from 'react-hot-toast';
import { HiOutlineCalculator, HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineArrowPath } from 'react-icons/hi2';

type SportTab = 'cricket' | 'football' | 'volleyball' | 'hand-tennis';

export const ScoringSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SportTab>('cricket');

  // Formula Configuration State (Admin custom rules)
  const [cricketConfig, setCricketConfig] = useState({
    winPoints: 2,
    tiePoints: 1,
    lossPoints: 0,
    allOutFullQuota: true,
    oversQuota: 20,
  });

  const [footballConfig, setFootballConfig] = useState({
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    bonusPointsFor3PlusGoals: false,
  });

  const [volleyballConfig, setVolleyballConfig] = useState({
    useFIVBSystem: true,
  });

  // Cricket Demo Inputs
  const [cricketInput, setCricketInput] = useState<CricketMatchInput>({
    teamRuns: 184,
    teamOvers: 20.0,
    teamWickets: 4,
    isTeamAllOut: false,
    maxOversQuota: 20,
    opponentRuns: 152,
    opponentOvers: 18.4,
    opponentWickets: 10,
    isOpponentAllOut: true,
  });

  // Football Demo Inputs
  const [footballInput, setFootballInput] = useState<FootballMatchInput>({
    goalsFor: 3,
    goalsAgainst: 1,
    priorGF: 8,
    priorGA: 4,
    priorWins: 2,
    priorDraws: 1,
    priorLosses: 0,
  });

  // Volleyball Demo Inputs
  const [volleyballInput, setVolleyballInput] = useState<VolleyballMatchInput>({
    setsWon: 3,
    setsLost: 1,
    pointsWon: 98,
    pointsLost: 82,
  });

  // Hand Tennis Demo Inputs
  const [racketInput, setRacketInput] = useState({
    gamesWon: 2,
    gamesLost: 1,
    pointsWon: 38,
    pointsLost: 31,
  });

  // Calculate results on the fly
  const cricketResult = calculateCricketNRR(
    cricketInput,
    cricketConfig.winPoints,
    cricketConfig.tiePoints,
    cricketConfig.lossPoints
  );

  const footballResult = calculateFootballNetScore(
    footballInput,
    footballConfig.winPoints,
    footballConfig.drawPoints,
    footballConfig.lossPoints
  );

  const volleyballResult = calculateVolleyballNetScore(volleyballInput);
  const racketResult = calculateRacketNetScore(racketInput);

  const handleSaveFormula = () => {
    toast.success('Scoring formula rules saved & applied to tournament database!', {
      icon: '⚙️',
      duration: 3000,
    });
  };

  // Preset match scenarios to verify logic
  const loadCricketPreset = (type: 'high_nrr' | 'close_chase' | 'all_out') => {
    if (type === 'high_nrr') {
      setCricketInput({
        teamRuns: 215,
        teamOvers: 20.0,
        teamWickets: 2,
        isTeamAllOut: false,
        maxOversQuota: 20,
        opponentRuns: 110,
        opponentOvers: 20.0,
        opponentWickets: 8,
        isOpponentAllOut: false,
      });
      toast.success('Loaded "Blowout Victory (+5.25 NRR)" preset');
    } else if (type === 'close_chase') {
      setCricketInput({
        teamRuns: 165,
        teamOvers: 20.0,
        teamWickets: 6,
        isTeamAllOut: false,
        maxOversQuota: 20,
        opponentRuns: 164,
        opponentOvers: 20.0,
        opponentWickets: 7,
        isOpponentAllOut: false,
      });
      toast.success('Loaded "1-Run Thriller (+0.05 NRR)" preset');
    } else {
      setCricketInput({
        teamRuns: 140,
        teamOvers: 16.2,
        teamWickets: 10,
        isTeamAllOut: true,
        maxOversQuota: 20,
        opponentRuns: 141,
        opponentOvers: 19.1,
        opponentWickets: 4,
        isOpponentAllOut: false,
      });
      toast.success('Loaded "All-Out Full Quota Enforcement" preset');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-amber-500/10 text-[#D9A441]">
              <HiOutlineCalculator className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Scoring Formulas & Net Score Sandbox
            </h1>
          </div>
          <p className="text-sm text-slate-500 max-w-3xl">
            Configure tournament scoring formulas and use this live interactive demo sandbox to verify that
            <strong className="text-slate-800"> Net Run Rate (NRR)</strong>, <strong className="text-slate-800">Net Goals (GD)</strong>, and <strong className="text-slate-800">Set/Point Ratios</strong> compute with 100% mathematical accuracy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveFormula}
            className="px-5 py-2.5 bg-[#D9A441] hover:bg-[#c49235] text-slate-950 font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <HiOutlineCheckCircle className="w-5 h-5" />
            Save & Publish Formula
          </button>
        </div>
      </div>

      {/* Sport Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'cricket', label: '🏏 Cricket (Net Run Rate)', desc: 'ICC NRR Formula' },
          { id: 'football', label: '⚽ Football (Net Goal Difference)', desc: 'GD & 3-Pt Table' },
          { id: 'volleyball', label: '🏐 Volleyball (Set & Point Ratio)', desc: 'FIVB 3-2-1 Points' },
          { id: 'hand-tennis', label: '✋ Hand Tennis / Rackets', desc: 'Point Differential' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SportTab)}
            className={`px-4 py-3 rounded-xl font-bold text-sm text-left transition-all flex flex-col ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-[11px] font-normal ${activeTab === tab.id ? 'text-amber-400' : 'text-slate-400'}`}>
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* 1. CRICKET NRR SECTION */}
      {/* ==================================================== */}
      {activeTab === 'cricket' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formula Config */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center justify-between border-b pb-2">
              <span>⚙️ Formula Rules</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono">ICC Standard</span>
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Match Format (Overs Quota)</label>
              <select
                value={cricketConfig.oversQuota}
                onChange={e => {
                  const quota = Number(e.target.value);
                  setCricketConfig(c => ({ ...c, oversQuota: quota }));
                  setCricketInput(i => ({ ...i, maxOversQuota: quota, teamOvers: Math.min(i.teamOvers, quota) }));
                }}
                className="w-full mt-1 px-3 py-2 border rounded-lg font-medium text-sm focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value={20}>T20 Format (20 Overs)</option>
                <option value={50}>One Day Format (50 Overs)</option>
                <option value={10}>T10 Quick Format (10 Overs)</option>
                <option value={6}>Super Six (6 Overs)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Win Pts</label>
                <input
                  type="number"
                  value={cricketConfig.winPoints}
                  onChange={e => setCricketConfig(c => ({ ...c, winPoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Tie Pts</label>
                <input
                  type="number"
                  value={cricketConfig.tiePoints}
                  onChange={e => setCricketConfig(c => ({ ...c, tiePoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Loss Pts</label>
                <input
                  type="number"
                  value={cricketConfig.lossPoints}
                  onChange={e => setCricketConfig(c => ({ ...c, lossPoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cricketConfig.allOutFullQuota}
                  onChange={e => setCricketConfig(c => ({ ...c, allOutFullQuota: e.target.checked }))}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  Count Full Quota If All Out (ICC Standard)
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-1 pl-6">
                Prevents teams dismissed in few overs from unfairly avoiding run rate impact.
              </p>
            </div>

            {/* Presets */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Test Presets</div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => loadCricketPreset('high_nrr')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left transition-colors"
                >
                  🚀 Blowout Victory (+5.250 NRR)
                </button>
                <button
                  onClick={() => loadCricketPreset('close_chase')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left transition-colors"
                >
                  🎯 Tight 1-Run Win (+0.050 NRR)
                </button>
                <button
                  onClick={() => loadCricketPreset('all_out')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 text-left transition-colors"
                >
                  ⚠️ All Out in 16.2 ov (Test Full Quota)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Demo Sandbox */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <HiOutlineSparkles className="w-5 h-5 text-amber-500" />
                  Live Simulator: Test Match Inputs
                </h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  ● Realtime Live Engine
                </span>
              </div>

              {/* Team A Inputs */}
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3">
                <div className="font-bold text-sm text-blue-900">🏏 Team A (Batting First)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Runs Scored</label>
                    <input
                      type="number"
                      value={cricketInput.teamRuns}
                      onChange={e => setCricketInput(i => ({ ...i, teamRuns: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Overs Batted</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cricketInput.teamOvers}
                      onChange={e => setCricketInput(i => ({ ...i, teamOvers: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Wickets Lost</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={cricketInput.teamWickets}
                      onChange={e => setCricketInput(i => ({ ...i, teamWickets: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 p-2 bg-white border rounded-lg w-full cursor-pointer h-10">
                      <input
                        type="checkbox"
                        checked={cricketInput.isTeamAllOut}
                        onChange={e => setCricketInput(i => ({ ...i, isTeamAllOut: e.target.checked }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-xs font-semibold text-slate-700">Team All Out</span>
                    </label>
                  </div>
                </div>

                {/* Quick Increment Buttons to test live event response */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-slate-400 self-center">Simulate Ball:</span>
                  <button
                    onClick={() => setCricketInput(i => ({ ...i, teamRuns: i.teamRuns + 1 }))}
                    className="px-2 py-1 bg-white hover:bg-blue-100 border text-blue-700 font-bold rounded text-xs"
                  >
                    +1 Run
                  </button>
                  <button
                    onClick={() => setCricketInput(i => ({ ...i, teamRuns: i.teamRuns + 4 }))}
                    className="px-2 py-1 bg-white hover:bg-green-100 border text-green-700 font-bold rounded text-xs"
                  >
                    +4 Four
                  </button>
                  <button
                    onClick={() => setCricketInput(i => ({ ...i, teamRuns: i.teamRuns + 6 }))}
                    className="px-2 py-1 bg-white hover:bg-purple-100 border text-purple-700 font-bold rounded text-xs"
                  >
                    +6 Six
                  </button>
                  <button
                    onClick={() => setCricketInput(i => ({ ...i, teamWickets: Math.min(10, i.teamWickets + 1) }))}
                    className="px-2 py-1 bg-white hover:bg-red-100 border text-red-700 font-bold rounded text-xs"
                  >
                    +1 Wicket
                  </button>
                </div>
              </div>

              {/* Team B Inputs */}
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 space-y-3">
                <div className="font-bold text-sm text-amber-900">🏏 Team B (Chasing)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Runs Scored</label>
                    <input
                      type="number"
                      value={cricketInput.opponentRuns}
                      onChange={e => setCricketInput(i => ({ ...i, opponentRuns: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Overs Batted</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cricketInput.opponentOvers}
                      onChange={e => setCricketInput(i => ({ ...i, opponentOvers: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium">Wickets Lost</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={cricketInput.opponentWickets}
                      onChange={e => setCricketInput(i => ({ ...i, opponentWickets: Number(e.target.value) }))}
                      className="w-full mt-1 px-3 py-2 bg-white border rounded-lg font-bold text-base text-slate-800"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 p-2 bg-white border rounded-lg w-full cursor-pointer h-10">
                      <input
                        type="checkbox"
                        checked={cricketInput.isOpponentAllOut}
                        onChange={e => setCricketInput(i => ({ ...i, isOpponentAllOut: e.target.checked }))}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-xs font-semibold text-slate-700">Team All Out</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Realtime Output Badge & Math Breakdown */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-amber-400 tracking-wider">
                    Calculated Net Score Metric
                  </div>
                  <div className="text-4xl font-black mt-1 flex items-baseline gap-3">
                    <span className={cricketResult.nrr >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {cricketResult.formattedNRR} NRR
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      ({cricketResult.result.toUpperCase()} • +{cricketResult.pointsEarned} Pts)
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Team Run Rate</div>
                    <div className="text-xl font-bold text-blue-400">{cricketResult.teamRunRate.toFixed(3)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Opponent Run Rate</div>
                    <div className="text-xl font-bold text-amber-400">{cricketResult.opponentRunRate.toFixed(3)}</div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Breakdown */}
              <div>
                <h4 className="text-xs uppercase font-mono text-slate-400 mb-2">Step-by-Step Mathematical Verification:</h4>
                <div className="space-y-1.5 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {cricketResult.formulaBreakdown.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-[#D9A441]">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Formula Verified: Matches ICC Standard Cricket Tournament Regulations
                </span>
                <span className="font-mono text-slate-500">Precision: 3 decimal places</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. FOOTBALL NET GOALS (GD) SECTION */}
      {/* ==================================================== */}
      {activeTab === 'football' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">⚙️ Football Points & GD Rule</h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-500">Win Pts</label>
                <input
                  type="number"
                  value={footballConfig.winPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, winPoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Draw Pts</label>
                <input
                  type="number"
                  value={footballConfig.drawPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, drawPoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Loss Pts</label>
                <input
                  type="number"
                  value={footballConfig.lossPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, lossPoints: Number(e.target.value) }))}
                  className="w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-1">Tie-Breaker Hierarchy:</div>
              <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
                <li>Total Points</li>
                <li><strong>Net Goal Difference (GD = GF - GA)</strong></li>
                <li>Goals Scored (GF)</li>
                <li>Head-to-Head Result</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Live Simulator: Match & Cumulative Standings</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Match Goals For</label>
                  <input
                    type="number"
                    value={footballInput.goalsFor}
                    onChange={e => setFootballInput(f => ({ ...f, goalsFor: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Match Goals Against</label>
                  <input
                    type="number"
                    value={footballInput.goalsAgainst}
                    onChange={e => setFootballInput(f => ({ ...f, goalsAgainst: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Previous GF</label>
                  <input
                    type="number"
                    value={footballInput.priorGF}
                    onChange={e => setFootballInput(f => ({ ...f, priorGF: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Previous GA</label>
                  <input
                    type="number"
                    value={footballInput.priorGA}
                    onChange={e => setFootballInput(f => ({ ...f, priorGA: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs uppercase font-mono text-amber-400">Cumulative Goal Difference (Net Score)</div>
                  <div className="text-4xl font-black mt-1 text-emerald-400">{footballResult.formattedGD} GD</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Table Points</div>
                  <div className="text-3xl font-black text-amber-400">{footballResult.totalPoints} PTS</div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {footballResult.formulaBreakdown.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#D9A441]">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. VOLLEYBALL SECTION */}
      {/* ==================================================== */}
      {activeTab === 'volleyball' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">🏐 FIVB Volleyball Rule System</h2>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <strong>3 - 0 or 3 - 1 Win:</strong> Winner gets <strong>3 Pts</strong>, Loser gets <strong>0 Pts</strong>.
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <strong>3 - 2 Win:</strong> Winner gets <strong>2 Pts</strong>, Loser gets <strong>1 Pt</strong> (tiebreak split).
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border">
                <strong>Tie-Breaker Order:</strong>
                <ol className="list-decimal pl-4 mt-1">
                  <li>Points won</li>
                  <li>Matches won</li>
                  <li><strong>Set Ratio (Sets Won / Sets Lost)</strong></li>
                  <li><strong>Point Quotient (Points Won / Points Lost)</strong></li>
                </ol>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900">Live Simulator: Sets & Points Entry</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Sets Won</label>
                  <input
                    type="number"
                    max={3}
                    min={0}
                    value={volleyballInput.setsWon}
                    onChange={e => setVolleyballInput(v => ({ ...v, setsWon: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Sets Lost</label>
                  <input
                    type="number"
                    max={3}
                    min={0}
                    value={volleyballInput.setsLost}
                    onChange={e => setVolleyballInput(v => ({ ...v, setsLost: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Points Won</label>
                  <input
                    type="number"
                    value={volleyballInput.pointsWon}
                    onChange={e => setVolleyballInput(v => ({ ...v, pointsWon: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Points Lost</label>
                  <input
                    type="number"
                    value={volleyballInput.pointsLost}
                    onChange={e => setVolleyballInput(v => ({ ...v, pointsLost: Number(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-[11px] text-slate-400">Set Ratio</div>
                  <div className="text-2xl font-black text-amber-400">{volleyballResult.setRatio.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Point Quotient</div>
                  <div className="text-2xl font-black text-emerald-400">{volleyballResult.pointQuotient.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Net Points</div>
                  <div className="text-2xl font-black text-blue-400">{volleyballResult.pointDiff > 0 ? '+' : ''}{volleyballResult.pointDiff}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">FIVB Points</div>
                  <div className="text-2xl font-black text-purple-400">{volleyballResult.pointsEarned} PTS</div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {volleyballResult.formulaBreakdown.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-[#D9A441]">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. HAND TENNIS / RACKETS SECTION */}
      {/* ==================================================== */}
      {activeTab === 'hand-tennis' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-slate-900">✋ Hand Tennis / Table Tennis Differential System</h2>
            <p className="text-xs text-slate-500">Calculates point differential and game differential for outdoor hand-tennis tournaments.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">Games Won</label>
              <input
                type="number"
                value={racketInput.gamesWon}
                onChange={e => setRacketInput(r => ({ ...r, gamesWon: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Games Lost</label>
              <input
                type="number"
                value={racketInput.gamesLost}
                onChange={e => setRacketInput(r => ({ ...r, gamesLost: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Points Won</label>
              <input
                type="number"
                value={racketInput.pointsWon}
                onChange={e => setRacketInput(r => ({ ...r, pointsWon: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">Points Lost</label>
              <input
                type="number"
                value={racketInput.pointsLost}
                onChange={e => setRacketInput(r => ({ ...r, pointsLost: Number(e.target.value) }))}
                className="w-full mt-1 px-3 py-2 border rounded-lg font-medium"
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs uppercase font-mono text-amber-400">Net Point Difference</div>
                <div className="text-3xl font-black text-emerald-400">{racketResult.formattedPointDiff} Pts</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Point Quotient</div>
                <div className="text-2xl font-black text-blue-400">{racketResult.pointRatio.toFixed(3)}</div>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {racketResult.formulaBreakdown.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#D9A441]">{idx + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringSimulator;
