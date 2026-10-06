import React, { useState, useEffect } from 'react';
import { DbStatus } from '../types/index.js';
import { api } from '../api/client.js';
import { Database, CheckCircle2, RefreshCw, AlertCircle, HardDrive } from 'lucide-react';

interface DbStatusBadgeProps {
  onDataReset?: () => void;
}

export const DbStatusBadge: React.FC<DbStatusBadgeProps> = ({ onDataReset }) => {
  const [status, setStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.system.getStatus();
      if (res.success && res.status) {
        setStatus(res.status);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset database with demo seed users, posts, and comments?')) return;
    try {
      setReseeding(true);
      await api.auth.reseed();
      await fetchStatus();
      if (onDataReset) onDataReset();
    } catch (err: any) {
      alert(err.message || 'Reseed failed');
    } finally {
      setReseeding(false);
    }
  };

  if (!status) return null;

  const isMongo = status.engine === 'mongodb';

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs text-xs text-neutral-600">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-medium hover:text-neutral-900 text-left focus:outline-none"
        >
          {isMongo ? (
            <Database className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span className="font-semibold text-neutral-800">
            {isMongo ? 'MongoDB Atlas' : 'Persistent Storage'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
        </button>

        <button
          onClick={handleReseed}
          disabled={reseeding}
          className="p-1 text-neutral-400 hover:text-indigo-600 rounded hover:bg-neutral-100 transition-colors"
          title="Reseed demo data"
          aria-label="Reseed demo data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex flex-col gap-1.5 text-[11px] text-neutral-500">
          <div className="flex justify-between">
            <span>Engine:</span>
            <span className="font-mono text-neutral-800">{status.engine}</span>
          </div>
          <div className="flex justify-between">
            <span>Database Records:</span>
            <span className="font-mono text-neutral-800 tabular-nums">
              {status.userCount} users · {status.postCount} posts
            </span>
          </div>
          {status.uri && (
            <div className="truncate text-neutral-400 text-[10px]">
              URI: {status.uri}
            </div>
          )}
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="mt-1 text-left text-indigo-600 hover:text-indigo-800 font-medium text-[11px]"
          >
            {reseeding ? 'Resetting dataset...' : '↺ Reseed initial users & posts'}
          </button>
        </div>
      )}
    </div>
  );
};
