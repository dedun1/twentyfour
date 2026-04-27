'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';

interface DashboardNotificationsProps {
  userId: string;
}

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
};

export function DashboardNotifications({ userId }: DashboardNotificationsProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('id,title,message,is_read')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      const rows = (data || []) as NotificationRow[];
      if (!rows.length) return;

      setUnreadCount(rows.length);
      rows.forEach((n) => {
        toast.success(n.title, { description: n.message });
      });

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', rows.map((n) => n.id));

      setUnreadCount(0);
    };
    run();
  }, [userId]);

  return (
    <div className="fixed right-6 top-6 z-40">
      <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm">
        <Bell className="size-4 text-muted-foreground" />
        {unreadCount > 0 ? (
          <Badge className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1 text-[10px]">
            {unreadCount}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
