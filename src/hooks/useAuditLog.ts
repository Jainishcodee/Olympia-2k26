import { useCallback, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logAudit } from '@/services/audit/auditService';
import type { AuditAction } from '@/types';

/**
 * Fire-and-forget audit writer bound to the signed-in administrator.
 *
 * Import this anywhere an admin action happens and call it once the write
 * succeeded. Failures are swallowed by `logAudit` so the UI never breaks.
 */
export const useAuditLog = () => {
  const { user, admin } = useAuth();
  const [isLogging, setIsLogging] = useState(false);

  const log = useCallback(
    async (
      action: AuditAction,
      resourceType: string,
      resourceId: string,
      extra?: { label?: string; metadata?: Record<string, unknown> },
    ) => {
      setIsLogging(true);
      try {
        await logAudit({
          adminId: user?.uid ?? 'anonymous',
          adminEmail: user?.email ?? undefined,
          adminName:
            admin?.displayName ?? user?.displayName ?? user?.email ?? undefined,
          action,
          resourceType,
          resourceId,
          resourceLabel: extra?.label,
          metadata: extra?.metadata,
        });
      } finally {
        setIsLogging(false);
      }
    },
    [user, admin],
  );

  return { log, isLogging };
};

export default useAuditLog;
