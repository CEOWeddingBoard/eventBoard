"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { listOrgNotifications, markOrgNotificationsRead } from "@/lib/actions/org-ecosystem.actions";

type Notification = {
  id: string;
  createdAt: Date;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
};

export function OrgNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listOrgNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (id: string) => {
    await markOrgNotificationsRead([id]);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open) {
      const unread = notifications.filter((n) => !n.read);
      unread.forEach((n) => handleMarkRead(n.id));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded hover:bg-white/10 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-800">Powiadomienia</p>
          </div>
          <div className="divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-neutral-400 text-center">Brak powiadomień</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 hover:bg-neutral-50 ${!n.read ? "bg-blue-50/50" : ""}`}
                >
                  <p className="text-xs font-medium text-neutral-800">{n.title}</p>
                  {n.body && <p className="text-[11px] text-neutral-500 mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-neutral-400 mt-1">
                    {new Date(n.createdAt).toLocaleString("pl-PL", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {n.link && (
                    <a
                      href={n.link}
                      className="text-[11px] text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Przejdź →
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
