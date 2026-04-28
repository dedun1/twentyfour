'use client';

import { useState } from 'react';
import { Pencil, Trash2, Info, ShieldPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FeatureKey, SubscriptionStatus } from '@/lib/types';
import { PromoteAdminDialog } from '@/app/admin/components/dialogs/PromoteAdminDialog';
import { DemoteAdminDialog } from '@/app/admin/components/dialogs/DemoteAdminDialog';
import { DeleteAdminDialog } from '@/app/admin/components/dialogs/DeleteAdminDialog';

type AdminRow = {
  clientId: string;
  profileId: string;
  businessName: string;
  contactEmail: string;
  status: SubscriptionStatus;
  plan: string | null;
  monthlyPrice: number | null;
  features: FeatureKey[];
  approvedAt: string | null;
};

type Props = {
  clients: AdminRow[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (clientId: string) => void;
  onRefresh: () => Promise<void> | void;
  currentProfileId?: string | null;
};

const STATUS_BADGE_CLASS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-500/15 text-green-500',
  trial: 'bg-blue-500/15 text-blue-500',
  pending_approval: 'bg-amber-500/15 text-amber-500',
  paused: 'bg-yellow-500/15 text-yellow-500',
  rejected: 'bg-red-500/15 text-red-500',
  cancelled: 'bg-zinc-500/15 text-zinc-400',
};

export function AdminsTab({
  clients,
  search,
  onSearchChange,
  onEdit,
  onRefresh,
  currentProfileId,
}: Props) {
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState<AdminRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Admins</h2>
          <Badge variant="secondary">{clients.length}</Badge>
        </div>
        <Button className="bg-amber-500 text-black hover:bg-amber-400" onClick={() => setPromoteOpen(true)}>
          <ShieldPlus />
          Promote to Admin
        </Button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>Admin accounts have full access regardless of subscription status. Their appointments and data are excluded from client analytics.</p>
        </div>
      </div>

      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search admins..."
      />

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Approved At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const isCurrentUser = client.profileId === currentProfileId;
                return (
                  <TableRow key={client.profileId} className="transition-colors hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15 text-sm font-semibold uppercase text-amber-500">
                          {(client.businessName || 'A').charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{client.businessName || '-'}</p>
                            <Badge className="bg-amber-500/15 text-amber-500">admin</Badge>
                            {isCurrentUser ? <span className="text-xs text-muted-foreground">(you)</span> : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{client.contactEmail || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={STATUS_BADGE_CLASS[client.status ?? 'pending_approval']}>
                          {client.status ?? 'pending_approval'}
                        </Badge>
                        <Badge className="bg-amber-500/15 text-amber-500">admin</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{client.plan || '-'}</TableCell>
                    <TableCell>{client.contactEmail || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(client.features || []).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.approvedAt ? new Date(client.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(client.clientId)}>
                          <Pencil />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!client.profileId) {
                              toast.error('Cannot perform action: missing profile link. Run the backfill migration.');
                              return;
                            }
                            setDemoteTarget(client);
                          }}
                        >
                          <UserMinus />
                          Demote
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (!client.profileId) {
                              toast.error('Cannot perform action: missing profile link. Run the backfill migration.');
                              return;
                            }
                            setDeleteTarget(client);
                          }}
                        >
                          <Trash2 />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PromoteAdminDialog
        open={promoteOpen}
        onOpenChange={setPromoteOpen}
        onSuccess={onRefresh}
      />

      <DemoteAdminDialog
        open={Boolean(demoteTarget)}
        onOpenChange={(open) => !open && setDemoteTarget(null)}
        profileId={demoteTarget?.profileId || ''}
        businessName={demoteTarget?.businessName || 'Admin'}
        onSuccess={onRefresh}
      />

      <DeleteAdminDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        userId={deleteTarget?.profileId || ''}
        businessName={deleteTarget?.businessName || 'Admin'}
        email={deleteTarget?.contactEmail || '-'}
        onSuccess={onRefresh}
      />
    </div>
  );
}
