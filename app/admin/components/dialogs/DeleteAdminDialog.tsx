'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Props = {
  userId: string;
  businessName: string;
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function DeleteAdminDialog({ userId, businessName, email, open, onOpenChange, onSuccess }: Props) {
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const canDelete = confirmation === 'DELETE' && !!userId;

  const handleSubmit = async () => {
    if (!userId || !canDelete) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        toast.error(result.error || 'Failed to delete admin');
        return;
      }
      toast.success('Admin account deleted');
      await onSuccess();
      onOpenChange(false);
      setConfirmation('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete admin account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {businessName || 'this admin'} ({email || '-'}) - their auth account,
            profile, client record, and all related data. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Type DELETE to confirm</p>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canDelete || saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Delete forever
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
