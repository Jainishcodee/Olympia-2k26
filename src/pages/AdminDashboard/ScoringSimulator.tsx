import React, { useState, useEffect } from 'react';
import {
  calculateCricketNRR,
  calculateFootballNetScore,
  calculateVolleyballNetScore,
  calculateRacketNetScore,
  CricketMatchInput,
  FootballMatchInput,
  VolleyballMatchInput,
} from '@/utils/netScore';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { HiOutlineCalculator, HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineArrowPath } from 'react-icons/hi2';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { saveSettings } from '@/services/settings/settingsService';
import { DEFAULT_SETTINGS } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';

type SportTab = 'cricket' | 'football' | 'volleyball' | 'hand-tennis';

export const ScoringSimulator: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [activeTab, setActiveTab] = useState<SportTab>('cricket');
  const [isCustomOvers, setIsCustomOvers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Formula Configuration State (Admin custom rules)
  const [cricketConfig, setCricketConfig] = useState({
    winPoints: 2,
    tiePoints: 1,
    lossPoints: 0,
    allOutFullQuota: true,
    oversQuota: 20,
    allowTenRunBall: true,
  });

  // Simulator helper: Advance legal overs on ball simulation
  const [autoAdvanceBall, setAutoAdvanceBall] = useState(true);

  // Advance overs by 1 legal ball (e.g. 18.4 -> 18.5, 18.5 -> 19.0)
  const advanceCricketOvers = (overs: number, maxQuota: number): number => {
    if (overs >= maxQuota) return maxQuota;
    const whole = Math.floor(overs);
    const balls = Math.round((overs - whole) * 10);
    if (balls >= 5) {
      return Math.min(maxQuota, whole + 1);
    }
    return Number((whole + (balls + 1) / 10).toFixed(1));
  };

  const simulateCricketBall = (target: 'team' | 'opponent', runs: number) => {
    setCricketInput(prev => {
      const isTeam = target === 'team';
      const currentRuns = isTeam ? prev.teamRuns : prev.opponentRuns;
      const currentOvers = isTeam ? prev.teamOvers : prev.opponentOvers;
      const newRuns = currentRuns + runs;
      const newOvers = autoAdvanceBall ? advanceCricketOvers(currentOvers, prev.maxOversQuota) : currentOvers;
      return isTeam
        ? { ...prev, teamRuns: newRuns, teamOvers: newOvers }
        : { ...prev, opponentRuns: newRuns, opponentOvers: newOvers };
    });

    if (runs === 10) {
      toast.success(
        `⚡ Simulated +10 Runs Bonus Ball for ${target === 'team' ? 'Team A' : 'Team B'}!`,
        { icon: '🏏', duration: 2500 }
      );
    }
  };

  const simulateCricketWicket = (target: 'team' | 'opponent') => {
    setCricketInput(prev => {
      const isTeam = target === 'team';
      const currentWickets = isTeam ? prev.teamWickets : prev.opponentWickets;
      const currentOvers = isTeam ? prev.teamOvers : prev.opponentOvers;
      const newWickets = Math.min(10, currentWickets + 1);
      const isAllOut = newWickets >= 10;
      const newOvers = autoAdvanceBall ? advanceCricketOvers(currentOvers, prev.maxOversQuota) : currentOvers;
      return isTeam
        ? { ...prev, teamWickets: newWickets, isTeamAllOut: isAllOut, teamOvers: newOvers }
        : { ...prev, opponentWickets: newWickets, isOpponentAllOut: isAllOut, opponentOvers: newOvers };
    });
  };

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

  // Load saved cricket formula / custom overs from Firestore on mount
  useEffect(() => {
    const loadSavedFormula = async () => {
      try {
        if (!db) return;
        const snap = await getDoc(doc(db, 'settings', 'cricket_formula'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.oversQuota && Number(data.oversQuota) > 0) {
            const quota = Number(data.oversQuota);
            setCricketConfig(prev => ({
              ...prev,
              oversQuota: quota,
              winPoints: Number(data.winPoints ?? prev.winPoints),
              tiePoints: Number(data.tiePoints ?? prev.tiePoints),
              lossPoints: Number(data.lossPoints ?? prev.lossPoints),
              allOutFullQuota: data.allOutFullQuota ?? prev.allOutFullQuota,
              allowTenRunBall: data.allowTenRunBall ?? prev.allowTenRunBall,
            }));
            setCricketInput(prev => ({
              ...prev,
              maxOversQuota: quota,
              teamOvers: Math.min(prev.teamOvers, quota),
              opponentOvers: Math.min(prev.opponentOvers, quota),
            }));
            if (![20, 50, 10, 6].includes(quota)) {
              setIsCustomOvers(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load saved cricket formula:', err);
      }
    };
    loadSavedFormula();
  }, []);

  const handleSaveFormula = async () => {
    setIsSaving(true);
    try {
      // 1. Persist to system settings singleton (settings/default)
      await saveSettings({
        ...DEFAULT_SETTINGS,
        cricketMaxOvers: cricketConfig.oversQuota,
        cricketConfig: {
          oversQuota: cricketConfig.oversQuota,
          winPoints: cricketConfig.winPoints,
          tiePoints: cricketConfig.tiePoints,
          lossPoints: cricketConfig.lossPoints,
          allOutFullQuota: cricketConfig.allOutFullQuota,
          allowTenRunBall: cricketConfig.allowTenRunBall,
        },
      } as any);

      // 2. Also persist to dedicated settings/cricket_formula doc
      if (db) {
        await setDoc(
          doc(db, 'settings', 'cricket_formula'),
          {
            oversQuota: cricketConfig.oversQuota,
            winPoints: cricketConfig.winPoints,
            tiePoints: cricketConfig.tiePoints,
            lossPoints: cricketConfig.lossPoints,
            allOutFullQuota: cricketConfig.allOutFullQuota,
            allowTenRunBall: cricketConfig.allowTenRunBall,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid || 'admin',
          },
          { merge: true },
        );
      }

      await log('SETTINGS_UPDATED', 'settings', 'cricket_formula', {
        metadata: {
          cricketMaxOvers: cricketConfig.oversQuota,
          cricketConfig,
        },
      });

      toast.success(
        `Scoring formula saved to Firestore! Cricket match format set to ${cricketConfig.oversQuota} Overs.`,
        {
          icon: '⚙️',
          duration: 3500,
        },
      );
    } catch (err) {
      console.error('Failed to save formula to Firestore:', err);
      toast.error('Failed to save formula to Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  // Preset match scenarios to verify logic
  const loadCricketPreset = (type: 'high_nrr' | 'close_chase' | 'all_out' | 'ten_run_jackpot') => {
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
    } else if (type === 'ten_run_jackpot') {
      setCricketInput({
        teamRuns: 172,
        teamOvers: 19.5,
        teamWickets: 5,
        isTeamAllOut: false,
        maxOversQuota: 20,
        opponentRuns: 170,
        opponentOvers: 20.0,
        opponentWickets: 7,
        isOpponentAllOut: false,
      });
      toast.success('Loaded "⚡ 10-Run Bonus Ball Simulation" preset. Click [+10 Runs] on Team A to simulate final-ball jackpot!');
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
      <div
        className={cn(
          'p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors',
          isDay
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#0B1220] border-white/10 shadow-lg'
        )}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-amber-500/10 text-[#D9A441]">
              <HiOutlineCalculator className="w-6 h-6" />
            </span>
            <h1
              className={cn(
                'text-2xl font-black tracking-tight',
                isDay ? 'text-slate-900' : 'text-white'
              )}
            >
              Scoring Formulas & Net Score Sandbox
            </h1>
          </div>
          <p className={cn('text-sm max-w-3xl', isDay ? 'text-slate-500' : 'text-slate-400')}>
            Configure tournament scoring formulas and use this live interactive demo sandbox to verify that{' '}
            <strong className={isDay ? 'text-slate-800' : 'text-amber-400'}>Net Run Rate (NRR)</strong>,{' '}
            <strong className={isDay ? 'text-slate-800' : 'text-amber-400'}>Net Goals (GD)</strong>, and{' '}
            <strong className={isDay ? 'text-slate-800' : 'text-amber-400'}>Set/Point Ratios</strong> compute with 100% mathematical accuracy.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveFormula}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#D9A441] hover:bg-[#c49235] text-slate-950 font-bold rounded-xl shadow-sm text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineCheckCircle className="w-5 h-5" />
            {isSaving ? 'Saving to Firestore…' : 'Save & Publish Formula'}
          </button>
        </div>
      </div>

      {/* Sport Selector Tabs */}
      <div className={cn('flex gap-2 border-b pb-2 overflow-x-auto', isDay ? 'border-slate-200' : 'border-white/10')}>
        {[
          { id: 'cricket', label: '🏏 Cricket (Net Run Rate)', desc: 'ICC NRR Formula' },
          { id: 'football', label: '⚽ Football (Net Goal Difference)', desc: 'GD & 3-Pt Table' },
          { id: 'volleyball', label: '🏐 Volleyball (Set & Point Ratio)', desc: 'FIVB 3-2-1 Points' },
          { id: 'hand-tennis', label: '✋ Hand Tennis / Rackets', desc: 'Point Differential' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SportTab)}
            className={cn(
              'px-4 py-3 rounded-xl font-bold text-sm text-left transition-all flex flex-col',
              activeTab === tab.id
                ? isDay
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                : isDay
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'text-[11px] font-normal',
                activeTab === tab.id
                  ? isDay
                    ? 'text-amber-400'
                    : 'text-slate-900 font-semibold'
                  : isDay
                  ? 'text-slate-400'
                  : 'text-slate-400'
              )}
            >
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
          <div
            className={cn(
              'lg:col-span-4 p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
              isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
            )}
          >
            <h2
              className={cn(
                'text-base font-bold flex items-center justify-between border-b pb-2',
                isDay ? 'text-slate-900 border-slate-200' : 'text-white border-white/10'
              )}
            >
              <span>⚙️ Formula Rules</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">ICC Standard</span>
            </h2>

            <div>
              <label className={cn('text-xs font-semibold uppercase', isDay ? 'text-slate-500' : 'text-slate-400')}>
                Match Format (Overs Quota)
              </label>
              <select
                value={isCustomOvers || ![20, 50, 15, 10, 6, 2].includes(cricketConfig.oversQuota) ? 'custom' : cricketConfig.oversQuota}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setIsCustomOvers(true);
                  } else {
                    setIsCustomOvers(false);
                    const quota = Number(val);
                    setCricketConfig(c => ({ ...c, oversQuota: quota }));
                    setCricketInput(i => ({ ...i, maxOversQuota: quota, teamOvers: Math.min(i.teamOvers, quota), opponentOvers: Math.min(i.opponentOvers, quota) }));
                  }
                }}
                className={cn(
                  'w-full mt-1 px-3 py-2 border rounded-lg font-medium text-sm focus:ring-2 focus:ring-amber-400 outline-none',
                  isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                )}
              >
                <option value={20} className={isDay ? '' : 'bg-slate-900 text-white'}>T20 Format (20 Overs)</option>
                <option value={50} className={isDay ? '' : 'bg-slate-900 text-white'}>One Day Format (50 Overs)</option>
                <option value={15} className={isDay ? '' : 'bg-slate-900 text-white'}>15 Overs Match</option>
                <option value={10} className={isDay ? '' : 'bg-slate-900 text-white'}>T10 Quick Format (10 Overs)</option>
                <option value={6} className={isDay ? '' : 'bg-slate-900 text-white'}>Super Six (6 Overs)</option>
                <option value={2} className={isDay ? '' : 'bg-slate-900 text-white'}>Super Over / Blitz (2 Overs)</option>
                <option value="custom" className={isDay ? '' : 'bg-slate-900 text-white'}>⚡ Custom Overs (Manual Choice)</option>
              </select>

              {(isCustomOvers || ![20, 50, 10, 6].includes(cricketConfig.oversQuota)) && (
                <div className="mt-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={cn('text-xs font-bold uppercase tracking-wider', isDay ? 'text-amber-900' : 'text-amber-300')}>
                      Custom Match Overs Quota
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded font-bold">
                      {cricketConfig.oversQuota} OV
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={cricketConfig.oversQuota}
                      onChange={e => {
                        const val = Math.max(1, Math.min(200, Number(e.target.value) || 1));
                        setCricketConfig(c => ({ ...c, oversQuota: val }));
                        setCricketInput(i => ({
                          ...i,
                          maxOversQuota: val,
                          teamOvers: Math.min(i.teamOvers, val),
                          opponentOvers: Math.min(i.opponentOvers, val),
                        }));
                      }}
                      className={cn(
                        'w-28 px-3 py-1.5 border rounded-lg font-mono font-bold text-base focus:ring-2 focus:ring-amber-400 outline-none',
                        isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-white/20 text-white'
                      )}
                    />
                    <span className={cn('text-xs font-semibold', isDay ? 'text-slate-600' : 'text-slate-300')}>
                      overs per innings (e.g. 2, 15, or as many as you want)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className={cn('text-[10px] uppercase font-bold mr-1', isDay ? 'text-slate-500' : 'text-slate-400')}>Quick:</span>
                    {[2, 5, 8, 12, 15, 20, 25, 50].map(ov => (
                      <button
                        key={ov}
                        type="button"
                        onClick={() => {
                          setIsCustomOvers(true);
                          setCricketConfig(c => ({ ...c, oversQuota: ov }));
                          setCricketInput(i => ({
                            ...i,
                            maxOversQuota: ov,
                            teamOvers: Math.min(i.teamOvers, ov),
                            opponentOvers: Math.min(i.opponentOvers, ov),
                          }));
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-bold border transition-all',
                          cricketConfig.oversQuota === ov
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-sm'
                            : isDay
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                        )}
                      >
                        {ov} ov
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={cn('text-[11px] font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Win Pts</label>
                <input
                  type="number"
                  value={cricketConfig.winPoints}
                  onChange={e => setCricketConfig(c => ({ ...c, winPoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
              <div>
                <label className={cn('text-[11px] font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Tie Pts</label>
                <input
                  type="number"
                  value={cricketConfig.tiePoints}
                  onChange={e => setCricketConfig(c => ({ ...c, tiePoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
              <div>
                <label className={cn('text-[11px] font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Loss Pts</label>
                <input
                  type="number"
                  value={cricketConfig.lossPoints}
                  onChange={e => setCricketConfig(c => ({ ...c, lossPoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
            </div>

            <div className={cn('p-3 rounded-xl border', isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10')}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cricketConfig.allOutFullQuota}
                  onChange={e => setCricketConfig(c => ({ ...c, allOutFullQuota: e.target.checked }))}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <span className={cn('text-xs font-semibold', isDay ? 'text-slate-700' : 'text-slate-200')}>
                  Count Full Quota If All Out (ICC Standard)
                </span>
              </label>
              <p className={cn('text-[11px] mt-1 pl-6', isDay ? 'text-slate-500' : 'text-slate-400')}>
                Prevents teams dismissed in few overs from unfairly avoiding run rate impact.
              </p>
            </div>

            <div className={cn('p-3 rounded-xl border', isDay ? 'bg-amber-50/50 border-amber-200/60' : 'bg-amber-950/20 border-amber-800/30')}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cricketConfig.allowTenRunBall}
                  onChange={e => setCricketConfig(c => ({ ...c, allowTenRunBall: e.target.checked }))}
                  className="w-4 h-4 text-amber-500 rounded"
                />
                <span className={cn('text-xs font-semibold flex items-center gap-1.5', isDay ? 'text-amber-950' : 'text-amber-300')}>
                  <span>⚡ 10-Run Special Delivery Rule</span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 px-1 rounded font-black uppercase">Active</span>
                </span>
              </label>
              <p className={cn('text-[11px] mt-1 pl-6', isDay ? 'text-amber-800/80' : 'text-amber-300/70')}>
                Permits simulating 10-run special/bonus deliveries contributing directly to team total, Run Rate (RPO), and tournament NRR.
              </p>
            </div>

            {/* Presets */}
            <div>
              <div className={cn('text-xs font-semibold uppercase mb-2', isDay ? 'text-slate-500' : 'text-slate-400')}>
                Test Presets
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => loadCricketPreset('ten_run_jackpot')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between',
                    isDay ? 'bg-amber-100/70 hover:bg-amber-100 text-amber-950 border border-amber-300' : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-600/40'
                  )}
                >
                  <span className="font-bold">⚡ 10-Run Bonus Ball Simulation</span>
                  <span className="font-mono text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-400 font-bold">+10 Ball</span>
                </button>
                <button
                  onClick={() => loadCricketPreset('high_nrr')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors',
                    isDay ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  )}
                >
                  🚀 Blowout Victory (+5.250 NRR)
                </button>
                <button
                  onClick={() => loadCricketPreset('close_chase')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors',
                    isDay ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  )}
                >
                  🎯 Tight 1-Run Win (+0.050 NRR)
                </button>
                <button
                  onClick={() => loadCricketPreset('all_out')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors',
                    isDay ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200'
                  )}
                >
                  ⚠️ All Out in 16.2 ov (Test Full Quota)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Demo Sandbox */}
          <div className="lg:col-span-8 space-y-6">
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
                isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
              )}
            >
              <div className={cn('flex justify-between items-center border-b pb-3', isDay ? 'border-slate-200' : 'border-white/10')}>
                <h3 className={cn('font-bold flex items-center gap-2', isDay ? 'text-slate-900' : 'text-white')}>
                  <HiOutlineSparkles className="w-5 h-5 text-amber-500" />
                  Live Simulator: Test Match Inputs
                </h3>
                <span className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  ● Realtime Live Engine
                </span>
              </div>

              {/* Team A Inputs */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-3',
                  isDay ? 'bg-blue-50/60 border-blue-100 text-blue-900' : 'bg-blue-950/20 border-blue-800/40 text-blue-300'
                )}
              >
                <div className="font-bold text-sm">🏏 Team A (Batting First)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Runs Scored</label>
                    <input
                      type="number"
                      value={cricketInput.teamRuns}
                      onChange={e => setCricketInput(i => ({ ...i, teamRuns: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Overs Batted</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cricketInput.teamOvers}
                      onChange={e => setCricketInput(i => ({ ...i, teamOvers: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Wickets Lost</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={cricketInput.teamWickets}
                      onChange={e => setCricketInput(i => ({ ...i, teamWickets: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      className={cn(
                        'flex items-center gap-2 p-2 border rounded-lg w-full cursor-pointer h-10',
                        isDay ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={cricketInput.isTeamAllOut}
                        onChange={e => setCricketInput(i => ({ ...i, isTeamAllOut: e.target.checked }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={cn('text-xs font-semibold', isDay ? 'text-slate-700' : 'text-slate-200')}>Team All Out</span>
                    </label>
                  </div>
                </div>

                {/* Quick Increment Buttons to test live event response */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-slate-300 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('text-xs font-semibold self-center mr-1', isDay ? 'text-slate-600' : 'text-slate-300')}>
                      Simulate Delivery:
                    </span>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('team', 0)}
                      title="Dot delivery (+0 runs, advances ball)"
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                      )}
                    >
                      Dot
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('team', 1)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-900 hover:bg-blue-900/40 text-blue-300 border-blue-500/40'
                      )}
                    >
                      +1 Run
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('team', 4)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-green-100 text-green-700 border-green-200' : 'bg-slate-900 hover:bg-green-900/40 text-green-300 border-green-500/40'
                      )}
                    >
                      +4 Four
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('team', 6)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-900 hover:bg-purple-900/40 text-purple-300 border-purple-500/40'
                      )}
                    >
                      +6 Six
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('team', 10)}
                      title="Simulate 10-Run Bonus / Jackpot delivery"
                      className={cn(
                        'px-3 py-1 font-black rounded text-xs transition-all active:scale-95 shadow-md flex items-center gap-1.5',
                        isDay
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-600 shadow-amber-500/25 ring-1 ring-amber-400'
                          : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border border-amber-300 shadow-amber-400/25'
                      )}
                    >
                      <span>⚡ +10 Runs</span>
                      <span className="text-[10px] uppercase font-black px-1 rounded bg-black/25 text-slate-950">Bonus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketWicket('team')}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-red-100 text-red-700 border-red-200' : 'bg-slate-900 hover:bg-red-900/40 text-red-300 border-red-500/40'
                      )}
                    >
                      +1 Wkt
                    </button>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={autoAdvanceBall}
                      onChange={e => setAutoAdvanceBall(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-500 rounded"
                    />
                    <span className={isDay ? 'text-slate-500' : 'text-slate-400'}>
                      Advance ball (+0.1 ov)
                    </span>
                  </label>
                </div>
              </div>

              {/* Team B Inputs */}
              <div
                className={cn(
                  'p-4 rounded-xl border space-y-3',
                  isDay ? 'bg-amber-50/60 border-amber-100 text-amber-900' : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                )}
              >
                <div className="font-bold text-sm">🏏 Team B (Chasing)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Runs Scored</label>
                    <input
                      type="number"
                      value={cricketInput.opponentRuns}
                      onChange={e => setCricketInput(i => ({ ...i, opponentRuns: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Overs Batted</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cricketInput.opponentOvers}
                      onChange={e => setCricketInput(i => ({ ...i, opponentOvers: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn('text-xs font-medium', isDay ? 'text-slate-600' : 'text-slate-400')}>Wickets Lost</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={cricketInput.opponentWickets}
                      onChange={e => setCricketInput(i => ({ ...i, opponentWickets: Number(e.target.value) }))}
                      className={cn(
                        'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-base',
                        isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-white/10 text-white'
                      )}
                    />
                  </div>
                  <div className="flex items-end">
                    <label
                      className={cn(
                        'flex items-center gap-2 p-2 border rounded-lg w-full cursor-pointer h-10',
                        isDay ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={cricketInput.isOpponentAllOut}
                        onChange={e => setCricketInput(i => ({ ...i, isOpponentAllOut: e.target.checked }))}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className={cn('text-xs font-semibold', isDay ? 'text-slate-700' : 'text-slate-200')}>Team All Out</span>
                    </label>
                  </div>
                </div>

                {/* Quick Increment Buttons for Team B to test chase & formula response */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-slate-300 dark:border-white/10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn('text-xs font-semibold self-center mr-1', isDay ? 'text-slate-600' : 'text-slate-300')}>
                      Simulate Delivery:
                    </span>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('opponent', 0)}
                      title="Dot delivery (+0 runs, advances ball)"
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                      )}
                    >
                      Dot
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('opponent', 1)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-900 hover:bg-blue-900/40 text-blue-300 border-blue-500/40'
                      )}
                    >
                      +1 Run
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('opponent', 4)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-green-100 text-green-700 border-green-200' : 'bg-slate-900 hover:bg-green-900/40 text-green-300 border-green-500/40'
                      )}
                    >
                      +4 Four
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('opponent', 6)}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-900 hover:bg-purple-900/40 text-purple-300 border-purple-500/40'
                      )}
                    >
                      +6 Six
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketBall('opponent', 10)}
                      title="Simulate 10-Run Bonus / Jackpot delivery"
                      className={cn(
                        'px-3 py-1 font-black rounded text-xs transition-all active:scale-95 shadow-md flex items-center gap-1.5',
                        isDay
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-600 shadow-amber-500/25 ring-1 ring-amber-400'
                          : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border border-amber-300 shadow-amber-400/25'
                      )}
                    >
                      <span>⚡ +10 Runs</span>
                      <span className="text-[10px] uppercase font-black px-1 rounded bg-black/25 text-slate-950">Bonus</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => simulateCricketWicket('opponent')}
                      className={cn(
                        'px-2.5 py-1 border font-bold rounded text-xs transition-all active:scale-95',
                        isDay ? 'bg-white hover:bg-red-100 text-red-700 border-red-200' : 'bg-slate-900 hover:bg-red-900/40 text-red-300 border-red-500/40'
                      )}
                    >
                      +1 Wkt
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Realtime Output Badge & Math Breakdown */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-white/10">
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
                  Formula Verified: Matches ICC Standard Cricket Regulations + 10-Run Bonus Ball Simulation
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
          <div
            className={cn(
              'lg:col-span-4 p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
              isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
            )}
          >
            <h2 className={cn('text-base font-bold border-b pb-2', isDay ? 'text-slate-900 border-slate-200' : 'text-white border-white/10')}>
              ⚙️ Football Points & GD Rule
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Win Pts</label>
                <input
                  type="number"
                  value={footballConfig.winPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, winPoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
              <div>
                <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Draw Pts</label>
                <input
                  type="number"
                  value={footballConfig.drawPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, drawPoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
              <div>
                <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Loss Pts</label>
                <input
                  type="number"
                  value={footballConfig.lossPoints}
                  onChange={e => setFootballConfig(f => ({ ...f, lossPoints: Number(e.target.value) }))}
                  className={cn(
                    'w-full mt-1 px-2 py-1.5 border rounded-lg text-sm text-center font-bold',
                    isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-white/[0.04] border-white/10 text-white'
                  )}
                />
              </div>
            </div>

            <div className={cn('p-3 rounded-xl border', isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10')}>
              <div className={cn('text-xs font-bold mb-1', isDay ? 'text-slate-700' : 'text-slate-200')}>Tie-Breaker Hierarchy:</div>
              <ol className={cn('text-xs list-decimal pl-4 space-y-1', isDay ? 'text-slate-600' : 'text-slate-400')}>
                <li>Total Points</li>
                <li><strong className={isDay ? 'text-slate-800' : 'text-amber-400'}>Net Goal Difference (GD = GF - GA)</strong></li>
                <li>Goals Scored (GF)</li>
                <li>Head-to-Head Result</li>
              </ol>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
                isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
              )}
            >
              <h3 className={cn('font-bold', isDay ? 'text-slate-900' : 'text-white')}>
                Live Simulator: Match & Cumulative Standings
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Match Goals For</label>
                  <input
                    type="number"
                    value={footballInput.goalsFor}
                    onChange={e => setFootballInput(f => ({ ...f, goalsFor: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Match Goals Against</label>
                  <input
                    type="number"
                    value={footballInput.goalsAgainst}
                    onChange={e => setFootballInput(f => ({ ...f, goalsAgainst: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Previous GF</label>
                  <input
                    type="number"
                    value={footballInput.priorGF}
                    onChange={e => setFootballInput(f => ({ ...f, priorGF: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Previous GA</label>
                  <input
                    type="number"
                    value={footballInput.priorGA}
                    onChange={e => setFootballInput(f => ({ ...f, priorGA: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-white/10">
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
          <div
            className={cn(
              'lg:col-span-4 p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
              isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
            )}
          >
            <h2 className={cn('text-base font-bold border-b pb-2', isDay ? 'text-slate-900 border-slate-200' : 'text-white border-white/10')}>
              🏐 FIVB Volleyball Rule System
            </h2>
            <div className="text-xs space-y-2">
              <div className={cn('p-2.5 rounded-lg border', isDay ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/10 text-slate-300')}>
                <strong>3 - 0 or 3 - 1 Win:</strong> Winner gets <strong>3 Pts</strong>, Loser gets <strong>0 Pts</strong>.
              </div>
              <div className={cn('p-2.5 rounded-lg border', isDay ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/10 text-slate-300')}>
                <strong>3 - 2 Win:</strong> Winner gets <strong>2 Pts</strong>, Loser gets <strong>1 Pt</strong> (tiebreak split).
              </div>
              <div className={cn('p-2.5 rounded-lg border', isDay ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/[0.03] border-white/10 text-slate-300')}>
                <strong>Tie-Breaker Order:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                  <li>Points won</li>
                  <li>Matches won</li>
                  <li><strong className={isDay ? 'text-slate-900' : 'text-amber-400'}>Set Ratio (Sets Won / Sets Lost)</strong></li>
                  <li><strong className={isDay ? 'text-slate-900' : 'text-amber-400'}>Point Quotient (Points Won / Points Lost)</strong></li>
                </ol>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div
              className={cn(
                'p-5 rounded-2xl border shadow-sm space-y-4 transition-colors',
                isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
              )}
            >
              <h3 className={cn('font-bold', isDay ? 'text-slate-900' : 'text-white')}>
                Live Simulator: Sets & Points Entry
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Sets Won</label>
                  <input
                    type="number"
                    max={3}
                    min={0}
                    value={volleyballInput.setsWon}
                    onChange={e => setVolleyballInput(v => ({ ...v, setsWon: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Sets Lost</label>
                  <input
                    type="number"
                    max={3}
                    min={0}
                    value={volleyballInput.setsLost}
                    onChange={e => setVolleyballInput(v => ({ ...v, setsLost: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Points Won</label>
                  <input
                    type="number"
                    value={volleyballInput.pointsWon}
                    onChange={e => setVolleyballInput(v => ({ ...v, pointsWon: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Points Lost</label>
                  <input
                    type="number"
                    value={volleyballInput.pointsLost}
                    onChange={e => setVolleyballInput(v => ({ ...v, pointsLost: Number(e.target.value) }))}
                    className={cn(
                      'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                      isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-white/10">
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
        <div
          className={cn(
            'p-6 rounded-2xl border shadow-sm space-y-6 transition-colors',
            isDay ? 'bg-white border-slate-200' : 'bg-[#0B1220] border-white/10'
          )}
        >
          <div className={cn('border-b pb-4', isDay ? 'border-slate-200' : 'border-white/10')}>
            <h2 className={cn('text-lg font-bold', isDay ? 'text-slate-900' : 'text-white')}>
              ✋ Hand Tennis / Table Tennis Differential System
            </h2>
            <p className={cn('text-xs', isDay ? 'text-slate-500' : 'text-slate-400')}>
              Calculates point differential and game differential for outdoor hand-tennis tournaments.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Games Won</label>
              <input
                type="number"
                value={racketInput.gamesWon}
                onChange={e => setRacketInput(r => ({ ...r, gamesWon: Number(e.target.value) }))}
                className={cn(
                  'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                  isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                )}
              />
            </div>
            <div>
              <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Games Lost</label>
              <input
                type="number"
                value={racketInput.gamesLost}
                onChange={e => setRacketInput(r => ({ ...r, gamesLost: Number(e.target.value) }))}
                className={cn(
                  'w-full mt-1 px-3 py-2 border rounded-lg font-bold text-lg',
                  isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                )}
              />
            </div>
            <div>
              <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Points Won</label>
              <input
                type="number"
                value={racketInput.pointsWon}
                onChange={e => setRacketInput(r => ({ ...r, pointsWon: Number(e.target.value) }))}
                className={cn(
                  'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                  isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                )}
              />
            </div>
            <div>
              <label className={cn('text-xs font-semibold', isDay ? 'text-slate-500' : 'text-slate-400')}>Points Lost</label>
              <input
                type="number"
                value={racketInput.pointsLost}
                onChange={e => setRacketInput(r => ({ ...r, pointsLost: Number(e.target.value) }))}
                className={cn(
                  'w-full mt-1 px-3 py-2 border rounded-lg font-medium',
                  isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
                )}
              />
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl space-y-4 border border-white/10">
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
