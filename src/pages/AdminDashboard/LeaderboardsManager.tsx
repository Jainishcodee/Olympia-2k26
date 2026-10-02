import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { doc, deleteDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
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
import { DEFAULT_SETTINGS, type Leaderboard, type Sport, type Team, type Player, type SystemSettings } from '@/types';
import { saveSettings } from '@/services/settings/settingsService';
import { FiTrash2, FiRefreshCw, FiAward, FiLayers, FiExternalLink, FiEye, FiEyeOff, FiGlobe } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const LeaderboardsManager: React.FC = () => {
  const { log } = useAuditLog();
  const { theme } = useTheme();
  const isDay = theme === 'day';

  // Live Firestore Collections
  const leaderboards = useCollection<Leaderboard>('leaderboards');
  const sports = useCollection<Sport>('sports');
  const teams = useCollection<Team>('teams');
  const players = useCollection<Player>('players');
  const settingsDoc = useDoc<SystemSettings>('settings', 'default');

  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [syncingSport, setSyncingSport] = useState<string | null>(null);

  // Filtered leaderboard documents
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

  const handleBulkSetVisibility = async (hide: boolean) => {
    if (!db || filteredDocs.length === 0) return;
    const targets = filteredDocs.filter((d) => Boolean(d.isHidden) !== hide);
    if (targets.length === 0) {
      toast.success(hide ? 'All filtered documents are already hidden' : 'All filtered documents are already visible');
      return;
    }
    try {
      await Promise.all(
        targets.map((d) => setDoc(doc(db!, 'leaderboards', d.id || d.sportId), { isHidden: hide }, { merge: true }))
      );
      toast.success(`${targets.length} sports marked as ${hide ? 'hidden' : 'visible'}`);
    } catch (err) {
      toast.error('Failed to update records');
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

  // Sync / publish a sport's standings into 'leaderboards/{sportId}'
  const handleSyncSport = async (sportId: string, sportName: string, isTeam: boolean) => {
    if (!db) {
      toast.error('Firebase is not initialized');
      return;
    }
    setSyncingSport(sportId);
    try {
      const { syncSportLeaderboardToFirestore } = await import('@/services/standings/standingsService');
      const entries = await syncSportLeaderboardToFirestore(
        sportId,
        sportName,
        isTeam ? 'team' : 'individual'
      );

      await log('LEADERBOARD_PUBLISHED', 'leaderboard', sportId, { label: sportName });
      toast.success(`Published live standings (${entries.length} entries) from completed matches to leaderboards/${sportId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncingSport(null);
    }
  };

  return (
    <>
      <AdminHeader
        title="Leaderboards & Standings"
        subtitle="Manage the Firestore 'leaderboards' collection, publish real-time standings, and inspect active records."
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
        <div className="flex items-center gap-1">
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(true)} title="Hide all currently filtered sport leaderboards from normal users">
            <FiEyeOff className="h-3 w-3 text-amber-500" />
            <span className="hidden xl:inline">Hide Filtered</span>
          </Btn>
          <Btn size="xs" variant="ghost" onClick={() => handleBulkSetVisibility(false)} title="Make all currently filtered sport leaderboards visible to normal users">
            <FiEye className="h-3 w-3 text-emerald-500" />
            <span className="hidden xl:inline">Show Filtered</span>
          </Btn>
        </div>
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
            message="No documents currently exist in the 'leaderboards' collection. Run the seed script or publish a sport below."
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

      {/* Quick Standings Sync Section */}
      <div className="mt-8">
        <h3 className={cn('text-sm font-black uppercase tracking-wider mb-3', isDay ? 'text-slate-700' : 'text-slate-300')}>
          Quick Publish Standings to 'leaderboards' Collection
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Click any sport to capture its current standings and publish directly to the Firestore <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">leaderboards/{'{sportId}'}</code> document.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sports.data.map((sport) => {
            const isTeam = sport.teamBased !== false;
            const isBusy = syncingSport === sport.id;

            return (
              <motion.button
                key={sport.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={isBusy}
                onClick={() => handleSyncSport(sport.id, sport.name, isTeam)}
                className={cn(
                  'p-3.5 rounded-xl border text-left flex flex-col justify-between transition-colors group cursor-pointer',
                  isDay
                    ? 'bg-white border-slate-200 hover:border-blue-400 shadow-2xs'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-2xs',
                )}
              >
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block opacity-50">
                    {isTeam ? 'Team Sport' : 'Individual'}
                  </span>
                  <span className={cn('text-sm font-black uppercase tracking-tight block truncate mt-0.5', isDay ? 'text-slate-800' : 'text-white')}>
                    {sport.name}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>{isBusy ? 'Publishing…' : 'Publish'}</span>
                  <FiRefreshCw className={cn('w-3.5 h-3.5', isBusy && 'animate-spin')} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default LeaderboardsManager;
