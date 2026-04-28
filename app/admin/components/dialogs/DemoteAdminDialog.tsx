'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  profileId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function DemoteAdminDialog({ profileId, businessName, open, onOpenChange, onSuccess }: Props) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!profileId) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/demote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        toast.error(result.error || 'Failed to demote admin');
        return;
      }
      toast.success('Admin demoted to client');
      await onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to demote admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Demote {businessName || 'admin'} to client?</AlertDialogTitle>
          <AlertDialogDescription>
            This admin will become a regular client. They keep their account and data, but lose admin access.
            Their subscription status and features remain unchanged.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !profileId}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Demote
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
