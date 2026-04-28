'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void> | void;
};

export function PromoteAdminDialog({ open, onOpenChange, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        toast.error(result.error || 'Failed to promote user');
        return;
      }
      toast.success(`✓ ${email} is now an admin`);
      await onSuccess();
      onOpenChange(false);
      setEmail('');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to promote user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote user to admin</DialogTitle>
          <DialogDescription>
            Enter the email of an existing user to grant admin access. They must have already registered an account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="promote-email">Email</Label>
          <Input
            id="promote-email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            User will gain full admin access and bypass subscription requirements.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !email.trim()}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {saving ? 'Promoting...' : 'Promote to admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
