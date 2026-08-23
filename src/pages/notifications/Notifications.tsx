import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  formatNotificationWhen,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type PatientNotification,
} from "@/lib/patientNotifications";

export function Notifications() {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [items, setItems] = useState(() => listNotifications());

  const refresh = () => setItems(listNotifications());
  const unread = items.filter((n) => !n.read).length;

  const openItem = (n: PatientNotification) => {
    markNotificationRead(n.id);
    refresh();
    if (n.href) nav(n.href);
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="pp-caps text-[color:var(--pp-violet)]">{tx("Account")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)]">
            {tx("Notifications")}
          </h1>
          <p className="mt-2 max-w-xl text-base text-ink-secondary">
            {unread > 0 ? `${unread} ${tx("unread")}` : tx("You’re all caught up.")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unread > 0 ? (
            <Button
              size="sm"
              variant="outline"
              className="!h-9 !px-4 !py-0"
              onClick={() => {
                markAllNotificationsRead();
                refresh();
              }}
            >
              {tx("Mark all read")}
            </Button>
          ) : null}
          <Link
            to="/account/notifications"
            className="inline-flex h-9 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]"
          >
            {tx("Notification settings")}
          </Link>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-medium text-[color:var(--pp-primary-950)]">
            {tx("No notifications yet")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-tertiary">
            {tx("Order, refill, and care updates will show up here.")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => openItem(n)}
                className={
                  "flex w-full gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors " +
                  (n.read
                    ? "border-line bg-white/70 hover:bg-white"
                    : "border-[color:var(--pp-primary-950)]/25 bg-white hover:bg-[color:var(--state-hover)]")
                }
              >
                <span
                  className={
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                    (n.read ? "bg-transparent" : "bg-[color:var(--pp-violet)]")
                  }
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span
                      className={
                        "text-sm text-[color:var(--pp-primary-950)] " +
                        (n.read ? "font-medium" : "font-semibold")
                      }
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-2xs text-ink-tertiary">
                      {tx(formatNotificationWhen(n.at))}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-ink-secondary">{n.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
