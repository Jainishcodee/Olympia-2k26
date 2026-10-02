import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { doc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { cleanFirestoreData } from '@/utils/firestore';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useCollection, useDoc } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import {
  AdminHeader,
  Btn,
  Card,
  EmptyNotice,
  ErrorNotice,
  LoadingRows,
  StatusPill,
  Toolbar,
  SearchInput,
  ActionIcon,
  FilterSelect,
} from '@/components/admin/kit';
import { cn } from '@/utils/cn';
import {
  DEFAULT_SETTINGS,
  type Leaderboard,
  type LeaderboardEntry,
  type Sport,
  type Team,
  type Player,
  type Match,
  type SystemSettings,
} from '@/types';
import { saveSettings } from '@/services/settings/settingsService';
import { resolveScoringRules, deriveStandingsFromCompletedMatches } from '@/utils/standingsRules';
import {
  FiTrash2,
  FiRefreshCw,
  FiAward,
  FiLayers,
  FiExternalLink,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiArrowUp,
  FiArrowDown,
  FiPlus,
  FiSave,
  FiZap,
  FiCheck,
  FiX,
} from 'react-icons/fi';

const LeaderboardsManager: React.FC = () => {
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Live Firestore Collections
  const leaderboards = useCollection<Leaderboard>('leaderboards');
  const sports = useCollection<Sport>('sports');
  const teams = useCollection<Team>('teams');
  const players = useCollection<Player>('players');
  const matches = useCollection<Match>('matches');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');

  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('football');
  const [draftEntries, setDraftEntries] = useState<LeaderboardEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // New Contender Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContenderName, setNewContenderName] = useState('');
  const [newContenderPoints, setNewContenderPoints] = useState<number>(0);
  const [newContenderType, setNewContenderType] = useState<'team' | 'player'>('team');

  // Currently selected sport metadata
  const currentSportMeta = useMemo(() => {
    return sports.data.find((s) => s.id === selectedSport || s.slug === selectedSport) || {
      id: selectedSport,
      name: selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1).replace('-', ' '),
      icon: '🏆',
      teamBased: !['badminton', 'table-tennis', 'chess', 'carrom'].includes(selectedSport.toLowerCase()),
    };
  }, [sports.data, selectedSport]);

  const isTeamSport = currentSportMeta.teamBased !== false;

  // Load existing published leaderboard into draft whenever sport selection or Firestore data changes
  useEffect(() => {
    const existingDoc = leaderboards.data.find(
      (doc) => doc.sportId === selectedSport || doc.id === selectedSport
    );
    if (existingDoc && Array.isArray(existingDoc.entries)) {
      const sorted = [...existingDoc.entries].sort((a, b) => a.position - b.position);
      setDraftEntries(sorted);
    } else {
      setDraftEntries([]);
    }
  }, [selectedSport, leaderboards.data]);

  // Filtered leaderboard documents for overview table
  const filteredDocs = useMemo(() => {
    return leaderboards.data.filter((doc) => {
      const q = search.toLowerCase();
      if (visibilityFilter === 'visible' && doc.isHidden) return false;
      if (visibilityFilter === 'hidden' && !doc.isHidden) return false;
      return (
        doc.id?.toLowerCase().includes(q) ||
        doc.sportId?.toLowerCase().includes(q) ||
        doc.sportName?.toLowerCase().includes(q)
      );
    });
  }, [leaderboards.data, search, visibilityFilter]);

  // 1. Move Entry Up (closer to 1st)
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...draftEntries];
    const prev = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = prev;
    // Re-index ranks 1 to N
    const reindexed = updated.map((item, idx) => ({ ...item, position: idx + 1 }));
    setDraftEntries(reindexed);
  };

  // 2. Move Entry Down (closer to last)
  const handleMoveDown = (index: number) => {
    if (index >= draftEntries.length - 1) return;
    const updated = [...draftEntries];
    const next = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = next;
    // Re-index ranks 1 to N
    const reindexed = updated.map((item, idx) => ({ ...item, position: idx + 1 }));
    setDraftEntries(reindexed);
  };

  // 3. Edit Contender Field Inline
  const handleUpdateEntryField = (index: number, field: keyof LeaderboardEntry, val: unknown) => {
    setDraftEntries((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: val };
      })
    );
  };

  // 4. Remove Entry from Draft
  const handleRemoveEntry = (index: number) => {
    const updated = draftEntries.filter((_, idx) => idx !== index);
    const reindexed = updated.map((item, idx) => ({ ...item, position: idx + 1 }));
    setDraftEntries(reindexed);
    toast.success('Contender removed from draft');
  };

  // 5. Add New Contender to Draft
  const handleAddContender = () => {
    if (!newContenderName.trim()) {
      toast.error('Please enter a name for the contender');
      return;
    }
    const newEntry: LeaderboardEntry = {
      position: draftEntries.length + 1,
      entityId: `contender-${Date.now()}`,
      entityType: newContenderType,
      entityName: newContenderName.trim(),
      logo: '',
      sportId: selectedSport,
      points: Number(newContenderPoints) || 0,
      wins: 0,
      draws: 0,
      losses: 0,
      stats: { played: 0 },
    };
    setDraftEntries([...draftEntries, newEntry]);
    setNewContenderName('');
    setNewContenderPoints(0);
    setShowAddForm(false);
    toast.success(`Added ${newEntry.entityName} at rank #${newEntry.position}`);
  };

  // 6. Auto-Calculate Draft Standings from Matches
  const handleAutoFillFromMatches = () => {
    const rules = resolveScoringRules(selectedSport, settingsDoc.data?.tournamentScoringRules?.[selectedSport]);
    const registered = isTeamSport
      ? teams.data
          .filter((t) => t.sportId === selectedSport)
          .map((t) => ({ id: t.id, name: t.name, logo: t.logo, shortName: t.shortName }))
      : players.data
          .filter((p) => p.sportId === selectedSport)
          .map((p) => ({ id: p.id, name: p.name, photo: p.photo }));

    const derived = deriveStandingsFromCompletedMatches(
      selectedSport,
      matches.data,
      registered,
      !isTeamSport,
      rules
    );

    const mappedEntries: LeaderboardEntry[] = derived.map((d, idx) => ({
      position: idx + 1,
      entityId: d.entityId,
      entityType: isTeamSport ? 'team' : 'player',
      entityName: d.entityName,
      logo: d.logo || '',
      sportId: selectedSport,
      points: d.points,
      wins: d.wins,
      draws: d.draws,
      losses: d.losses,
      stats: {
        played: d.played,
        goalsFor: d.goalsFor,
        goalsAgainst: d.goalsAgainst,
        goalDifference: d.goalDifference,
        setsWon: d.setsWon,
        setsLost: d.setsLost,
        roundsWon: d.roundsWon,
        roundsLost: d.roundsLost,
        runs: d.runs,
        wickets: d.wickets,
      },
    }));

    setDraftEntries(mappedEntries);
    toast.success(`Loaded ${mappedEntries.length} draft entries from completed matches`);
  };

  // 7. Save & Publish Standings to leaderboards/{sportId}
  const handleSaveAndPublish = async () => {
    if (!db) {
      toast.error('Firebase is not initialized');
      return;
    }
    setIsSaving(true);
    try {
      const finalized: LeaderboardEntry[] = draftEntries.map((e, idx) => ({
        ...e,
        position: idx + 1,
        sportId: selectedSport,
        points: Number(e.points) || 0,
        wins: Number(e.wins) || 0,
        draws: Number(e.draws) || 0,
        losses: Number(e.losses) || 0,
        stats: {
          ...(e.stats || {}),
          played: Number(e.stats?.played ?? (Number(e.wins || 0) + Number(e.losses || 0) + Number(e.draws || 0))),
        },
      }));

      const payload: Leaderboard = {
        id: selectedSport,
        sportId: selectedSport,
        sportName: currentSportMeta?.name || selectedSport,
        category: isTeamSport ? 'team' : 'individual',
        isHidden: false,
        entries: finalized,
        lastUpdated: Timestamp.now(),
      };

      await setDoc(doc(db, 'leaderboards', selectedSport), cleanFirestoreData(payload as any));
      await log('LEADERBOARD_PUBLISHED', 'leaderboard', selectedSport, {
        label: `Saved & Published ${currentSportMeta?.name || selectedSport} standings (${finalized.length} contenders)`,
      });
      toast.success(`Standings for ${currentSportMeta?.name || selectedSport} successfully published!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish standings');
    } finally {
      setIsSaving(false);
    }
  };

  // Master Wall Visibility Toggle
  const handleToggleMasterVisibility = async () => {
    const current = settingsDoc.data?.publicLeaderboardVisible !== false;
    const next = !current;
    try {
      await saveSettings({
        ...(settingsDoc.data || DEFAULT_SETTINGS),
        publicLeaderboardVisible: next,
      });
      await log('SETTINGS_UPDATED', 'settings', 'default', {
        label: `Public leaderboard wall visibility changed to ${next ? 'visible' : 'hidden'}`,
      });
      toast.success(next ? 'Championship Leaderboard is now public' : 'Championship Leaderboard hidden from normal users');
    } catch (err) {
      toast.error('Failed to update system settings');
    }
  };

  // Toggle single document visibility
  const handleToggleDocVisibility = async (item: Leaderboard) => {
    if (!db) return;
    const docId = item.id || item.sportId;
    const next = !item.isHidden;
    try {
      await setDoc(doc(db, 'leaderboards', docId), { isHidden: next }, { merge: true });
      await log('LEADERBOARD_PUBLISHED', 'leaderboard', docId, {
        label: `${item.sportName || docId} marked as ${next ? 'hidden' : 'visible'}`,
      });
      toast.success(next ? `${item.sportName || docId} hidden from public wall` : `${item.sportName || docId} visible to public wall`);
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  // Delete a document from 'leaderboards' collection
  const handleDelete = async (docId: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete leaderboard document "${label}" (${docId})?`)) {
      return;
    }
    if (!db) {
      toast.error('Firebase is not initialized');
      return;
    }
    try {
      await deleteDoc(doc(db, 'leaderboards', docId));
      await log('LEADERBOARD_DELETED', 'leaderboard', docId, { label });
      toast.success(`Leaderboard "${label}" deleted successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <>
      <AdminHeader
        title="Leaderboards & Standings Editor"
        subtitle="Inspect, reorder #1 to last, edit points, preview, and authoritatively publish sport leaderboards."
        breadcrumbs={[{ label: 'Competition' }, { label: 'Leaderboard' }]}
        actions={
          <div className="flex items-center gap-2">
            <Btn
              variant={settingsDoc.data?.publicLeaderboardVisible !== false ? 'secondary' : 'primary'}
              onClick={handleToggleMasterVisibility}
              className={cn(
                'flex items-center gap-1.5',
                settingsDoc.data?.publicLeaderboardVisible === false && 'bg-amber-600 text-white hover:bg-amber-700'
              )}
              title="Toggle global public visibility of the leaderboard for normal users"
            >
              {settingsDoc.data?.publicLeaderboardVisible !== false ? (
                <>
                  <FiGlobe className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Public Wall: Visible</span>
                </>
              ) : (
                <>
                  <FiEyeOff className="h-3.5 w-3.5 text-amber-200" />
                  <span>Public Wall: Hidden</span>
                </>
              )}
            </Btn>
            <Btn to="/leaderboard" variant="secondary" className="flex items-center gap-2">
              <FiExternalLink className="h-4 w-4" />
              <span>View Public Wall</span>
            </Btn>
          </div>
        }
      />

      {/* =========================================================================
       *  SECTION 1: INTERACTIVE STANDINGS EDITOR & REORDERING WORKSPACE
       * =======================================================================*/}
      <div className="space-y-6">
        {/* Sport Discipline Selector Ribbon */}
        <div>
          <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
            Select Discipline to Edit & Reorder:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {sports.data.map((sport) => {
              const isSelected = selectedSport === sport.id || selectedSport === sport.slug;
              const hasPublished = leaderboards.data.some(
                (l) => (l.sportId === sport.id || l.id === sport.id) && l.entries?.length > 0
              );

              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => setSelectedSport(sport.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all shrink-0 cursor-pointer',
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-1 ring-blue-400'
                      : isDay
                        ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  )}
                >
                  <span>{sport.icon || '🏆'}</span>
                  <span>{sport.name}</span>
                  {hasPublished && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" title="Published in Firestore" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Standings Reordering Card */}
        <div
          className={cn(
            'rounded-2xl border p-5 sm:p-6 shadow-sm transition-colors',
            isDay ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          )}
        >
          {/* Card Header & Primary Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{currentSportMeta.icon || '🏆'}</span>
                <div>
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{currentSportMeta.name} Standings</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {isTeamSport ? 'Team Championship' : 'Individual Top 3 Podium'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Use ▲ and ▼ to reorder who is 1st, 2nd, and last. Edit points and stats directly, then click "Save & Publish Standings".
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Btn size="sm" variant="ghost" onClick={handleAutoFillFromMatches} className="flex items-center gap-1.5 text-amber-500">
                <FiZap className="w-3.5 h-3.5" />
                <span>Auto-Calculate from Matches</span>
              </Btn>

              <Btn size="sm" variant="secondary" onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5">
                <FiPlus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'Cancel' : 'Add Contender'}</span>
              </Btn>

              <button
                type="button"
                onClick={handleSaveAndPublish}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <FiSave className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Publishing…' : 'Save & Publish Standings'}</span>
              </button>
            </div>
          </div>

          {/* Quick Add Form Drawer */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-b border-slate-200 dark:border-white/10 py-4 bg-slate-50/50 dark:bg-white/[0.02]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Contender Name (Team / Athlete)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thunderbolts or John Doe..."
                      value={newContenderName}
                      onChange={(e) => setNewContenderName(e.target.value)}
                      className={cn(
                        'w-full text-xs p-2 rounded-lg border outline-none font-bold',
                        isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Starting Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newContenderPoints}
                      onChange={(e) => setNewContenderPoints(Number(e.target.value) || 0)}
                      className={cn(
                        'w-full text-xs p-2 rounded-lg border outline-none font-bold',
                        isDay ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddContender}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-wider transition-colors cursor-pointer"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                      <span>Confirm Add</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standings Table with Up/Down Reordering */}
          {draftEntries.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-200/50 dark:bg-white/5 flex items-center justify-center text-xl">
                {currentSportMeta.icon || '🏆'}
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                No Standings Entries For {currentSportMeta.name}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                This sport currently has zero ranked contenders. Click "Auto-Calculate from Matches" to prefill from match scores, or "+ Add Contender" to manually enter rows.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Btn size="sm" variant="secondary" onClick={handleAutoFillFromMatches}>
                  Auto-Calculate from Matches
                </Btn>
                <Btn size="sm" variant="primary" onClick={() => setShowAddForm(true)}>
                  + Add First Contender
                </Btn>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3 w-16 text-center">Rank</th>
                    <th className="py-3 px-3 w-28 text-center">Reorder</th>
                    <th className="py-3 px-3">Contender Name</th>
                    <th className="py-3 px-3 w-24 text-center">Points</th>
                    <th className="py-3 px-3 w-16 text-center">W</th>
                    <th className="py-3 px-3 w-16 text-center">D</th>
                    <th className="py-3 px-3 w-16 text-center">L</th>
                    <th className="py-3 px-3 w-20 text-center">Played</th>
                    <th className="py-3 px-3 w-16 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold">
                  {draftEntries.map((entry, index) => {
                    const rank = index + 1;
                    const isFirst = rank === 1;
                    const isSecond = rank === 2;
                    const isThird = rank === 3;
                    const isLast = rank === draftEntries.length;

                    return (
                      <tr
                        key={entry.entityId || index}
                        className={cn(
                          'transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02]',
                          isFirst && (isDay ? 'bg-amber-50/40' : 'bg-amber-950/10')
                        )}
                      >
                        {/* 1. Rank Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black font-mono shadow-xs',
                              isFirst
                                ? 'bg-amber-400 text-black ring-2 ring-amber-400/30'
                                : isSecond
                                  ? 'bg-slate-300 text-black dark:bg-slate-600 dark:text-white'
                                  : isThird
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            #{rank}
                          </span>
                        </td>

                        {/* 2. Reorder Buttons (Move Up / Move Down) */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveUp(index)}
                              disabled={isFirst}
                              title="Move UP towards 1st position"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                            >
                              <FiArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDown(index)}
                              disabled={isLast}
                              title="Move DOWN towards last position"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                            >
                              <FiArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* 3. Contender Name (Editable) */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={entry.entityName}
                            onChange={(e) => handleUpdateEntryField(index, 'entityName', e.target.value)}
                            className={cn(
                              'w-full max-w-xs text-xs font-bold px-2 py-1.5 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900' : 'bg-slate-800 border-slate-700 focus:border-blue-400 text-white'
                            )}
                          />
                        </td>

                        {/* 4. Points (Editable) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            value={entry.points}
                            onChange={(e) => handleUpdateEntryField(index, 'points', Number(e.target.value) || 0)}
                            className={cn(
                              'w-20 text-center text-xs font-black font-mono px-2 py-1.5 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 focus:border-blue-500 text-slate-900' : 'bg-slate-800 border-slate-700 focus:border-blue-400 text-white'
                            )}
                          />
                        </td>

                        {/* 5. Wins (W) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.wins}
                            onChange={(e) => handleUpdateEntryField(index, 'wins', Number(e.target.value) || 0)}
                            className={cn(
                              'w-14 text-center text-xs font-bold font-mono px-1 py-1 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                            )}
                          />
                        </td>

                        {/* 6. Draws (D) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.draws || 0}
                            onChange={(e) => handleUpdateEntryField(index, 'draws', Number(e.target.value) || 0)}
                            className={cn(
                              'w-14 text-center text-xs font-bold font-mono px-1 py-1 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                            )}
                          />
                        </td>

                        {/* 7. Losses (L) */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.losses}
                            onChange={(e) => handleUpdateEntryField(index, 'losses', Number(e.target.value) || 0)}
                            className={cn(
                              'w-14 text-center text-xs font-bold font-mono px-1 py-1 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                            )}
                          />
                        </td>

                        {/* 8. Matches Played */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={entry.stats?.played ?? (entry.wins + entry.losses + (entry.draws || 0))}
                            onChange={(e) => {
                              const p = Number(e.target.value) || 0;
                              handleUpdateEntryField(index, 'stats' as any, { ...(entry.stats || {}), played: p });
                            }}
                            className={cn(
                              'w-16 text-center text-xs font-bold font-mono px-1 py-1 rounded border outline-none',
                              isDay ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                            )}
                          />
                        </td>

                        {/* 9. Delete Action */}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(index)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remove this contender"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200 dark:border-white/10">
                <span>{draftEntries.length} Contenders Ranked (#1 to #{draftEntries.length})</span>
                <button
                  type="button"
                  onClick={handleSaveAndPublish}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <FiSave className="w-3.5 h-3.5" />
                  <span>Click to Save & Publish</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
       *  SECTION 2: PUBLISHED FIRESTORE DOCUMENTS DIRECTORY
       * =======================================================================*/}
      <div className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Published Firestore Documents Directory (`leaderboards` collection)
            </h3>
            <p className="text-xs text-slate-500">
              Active documents in Firestore. Normal users only see non-hidden documents on the public wall.
            </p>
          </div>
        </div>

        {/* Toolbar / Search */}
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Filter by sport or document ID…"
            className="w-full sm:w-72"
          />
          <FilterSelect
            value={visibilityFilter}
            onChange={setVisibilityFilter}
            options={[
              { value: '', label: 'All visibility' },
              { value: 'visible', label: 'Visible to public' },
              { value: 'hidden', label: 'Hidden from public' },
            ]}
          />
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-auto">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'Record' : 'Records'} in Firestore
          </div>
        </Toolbar>

        {/* Data Cards / Table */}
        <Card flush>
          {leaderboards.isLoading ? (
            <LoadingRows rows={3} cols={4} />
          ) : leaderboards.error ? (
            <ErrorNotice message={leaderboards.error} />
          ) : filteredDocs.length === 0 ? (
            <EmptyNotice
              title="No Leaderboard Documents Found"
              message="No documents currently exist matching your filter. Use the editor above to publish standings."
            />
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-white/5">
              {filteredDocs.map((item) => {
                const docId = item.id || item.sportId || 'unknown';
                const isTest = (item as unknown as { isTestRecord?: boolean }).isTestRecord || docId.startsWith('test-');
                const entriesCount = item.entries?.length || 0;

                return (
                  <div
                    key={docId}
                    className={cn(
                      'p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors',
                      isTest
                        ? isDay
                          ? 'bg-amber-50/60 hover:bg-amber-100/60'
                          : 'bg-amber-950/20 hover:bg-amber-900/30'
                        : isDay
                          ? 'hover:bg-slate-50'
                          : 'hover:bg-white/[0.02]',
                    )}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-base font-black',
                          isTest
                            ? 'border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                            : 'border-blue-400/40 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
                        )}
                      >
                        {isTest ? '🧪' : '🏆'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">
                            {docId}
                          </span>
                          {isTest && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                              TEST RECORD
                            </span>
                          )}
                          <StatusPill
                            value={item.category === 'individual' ? 'featured' : 'scheduled'}
                          />
                          {item.isHidden && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <FiEyeOff className="w-3 h-3" /> HIDDEN
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                          <span>Sport: <strong className="text-slate-700 dark:text-slate-300">{item.sportName || item.sportId}</strong></span>
                          <span>•</span>
                          <span>{entriesCount} Ranked {entriesCount === 1 ? 'Entry' : 'Entries'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Btn
                        size="xs"
                        variant="secondary"
                        onClick={() => setSelectedSport(item.sportId || docId)}
                        title="Load this sport into the editor above"
                      >
                        Edit Standings
                      </Btn>

                      <ActionIcon
                        label={item.isHidden ? 'Hidden from public. Click to make visible.' : 'Visible to public. Click to hide.'}
                        onClick={() => handleToggleDocVisibility(item)}
                      >
                        {item.isHidden ? (
                          <FiEyeOff className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <FiEye className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </ActionIcon>

                      <ActionIcon
                        label={`Delete ${docId}`}
                        danger
                        onClick={() => handleDelete(docId, item.sportName || docId)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </ActionIcon>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
};

export default LeaderboardsManager;
