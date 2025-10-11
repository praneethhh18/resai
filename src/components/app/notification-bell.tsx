
'use client';

import React from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, type CollectionReference } from 'firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

type NotificationDoc = {
  message: string;
  read: boolean;
  createdAt: { seconds: number; nanoseconds: number };
  link?: string;
};

export function NotificationBell() {
  const { user } = useUser();
  const firestore = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'notifications') as CollectionReference<NotificationDoc>;
  }, [user, firestore]);

  const { data: notifications, isLoading } = useCollection<NotificationDoc>(notificationsQuery);

  const unreadCount = React.useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-primary-foreground text-xs items-center justify-center">
                    {unreadCount}
                </span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-semibold border-b">
          Notifications
        </div>
        <ScrollArea className="h-96">
            {isLoading && (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            {!isLoading && notifications && notifications.length > 0 ? (
                <div className="divide-y">
                    {notifications.map(notification => (
                        <div key={notification.id} className={cn("p-4 hover:bg-accent", !notification.read && "bg-accent/50")}>
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt.seconds * 1000), { addSuffix: true })}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                !isLoading && <p className="text-center text-sm text-muted-foreground p-8">You have no new notifications.</p>
            )}
        </ScrollArea>
        <div className="p-2 text-center border-t">
            <Button variant="link" size="sm">Mark all as read</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
