import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import {
  displayPeerName,
  formatMessageTime,
  getThread,
  initials,
  listThreads,
  markThreadRead,
  resolveThreadId,
  sendMessage,
  subscribeCareChat,
  threadWhenLabel,
  unreadCountFor,
  type CareChatThread,
  type ChatSender,
} from "@/lib/careChat";

type Side = "patient" | "provider";

function youSender(side: Side): ChatSender {
  return side === "patient" ? "patient" : "provider";
}

function isYou(side: Side, sender: ChatSender) {
  return youSender(side) === sender;
}

function counterpartLabel(side: Side, thread: CareChatThread, tx: (s: string) => string) {
  if (side === "patient") {
    return displayPeerName(thread.peerName, tx);
  }
  return thread.patientName;
}

function counterpartMeta(side: Side, thread: CareChatThread, tx: (s: string) => string) {
  if (side === "patient") {
    return tx(thread.peerRole);
  }
  return `${tx("Patient")} · ${tx(thread.peerRole)}`;
}

function isUnread(side: Side, thread: CareChatThread) {
  return side === "patient" ? thread.unreadPatient : thread.unreadProvider;
}

export function CareChatWorkspace({
  side,
  title,
  subtitle,
  eyebrow = "Messages",
}: {
  side: Side;
  title: string;
  subtitle: string;
  eyebrow?: string;
}) {
  const { tx } = useI18n();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const withParam = params.get("with");
  const orderParam = params.get("order");

  const [threads, setThreads] = useState(() => listThreads(side));
  const [activeId, setActiveId] = useState(() => resolveThreadId(withParam, orderParam, side));
  const [compose, setCompose] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(Boolean(withParam || orderParam));
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = () => setThreads(listThreads(side));

  useEffect(() => subscribeCareChat(refresh), [side]);

  useEffect(() => {
    const next = resolveThreadId(withParam, orderParam, side);
    setActiveId(next);
    markThreadRead(next, side);
    refresh();
    if (withParam || orderParam) setMobileShowChat(true);
  }, [withParam, orderParam, side]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeId, threads.find((t) => t.id === activeId)?.messages.length]);

  const active = getThread(activeId) ?? threads[0] ?? null;
  const messages = active?.messages ?? [];
  const unreadCount = unreadCountFor(side);

  const openThread = (id: string) => {
    setActiveId(id);
    markThreadRead(id, side);
    refresh();
    setMobileShowChat(true);
    const next = new URLSearchParams(params);
    next.set("with", id);
    if (!orderParam) next.delete("order");
    setParams(next, { replace: true });
  };

  const send = () => {
    if (!active || !compose.trim()) return;
    sendMessage(active.id, youSender(side), compose);
    setCompose("");
    refresh();
  };

  const orderNote =
    orderParam && active && (active.id === "care" || active.id === "pharmacy" || active.orderId)
      ? `${tx("About order")} ${orderParam}`
      : null;

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col">
      <header className="mb-5 shrink-0 lg:mb-6">
        <p className="pp-caps text-[color:var(--pp-violet)]">{tx(eyebrow)}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-[color:var(--pp-primary-950)] md:text-4xl">
          {tx(title)}
        </h1>
        <p className="mt-2 max-w-xl text-base text-ink-secondary">{tx(subtitle)}</p>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <aside
          className={
            "flex min-h-[22rem] flex-col border-line lg:min-h-[32rem] lg:border-r " +
            (mobileShowChat ? "hidden lg:flex" : "flex")
          }
        >
          <div className="border-b border-line px-4 py-3.5">
            <p className="text-sm font-semibold text-[color:var(--pp-primary-950)]">{tx("Inbox")}</p>
            <p className="mt-0.5 text-2xs text-ink-tertiary">
              {unreadCount} {tx("unread")}
            </p>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {threads.map((t) => {
              const selected = t.id === activeId;
              const titleName = counterpartLabel(side, t, tx);
              const last = t.messages.at(-1);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={
                      "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors " +
                      (selected
                        ? "bg-[color:var(--pp-primary-200)]"
                        : "hover:bg-[color:var(--state-hover)]")
                    }
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${t.tone}`}
                    >
                      {initials(titleName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[color:var(--pp-primary-950)]">
                          {titleName}
                        </span>
                        <span className="shrink-0 text-2xs text-ink-tertiary">{threadWhenLabel(t)}</span>
                      </span>
                      <span className="mt-0.5 block text-2xs text-ink-tertiary">
                        {counterpartMeta(side, t, tx)}
                      </span>
                      <span
                        className={
                          "mt-1 block truncate text-sm " +
                          (isUnread(side, t)
                            ? "font-medium text-[color:var(--pp-primary-950)]"
                            : "text-ink-tertiary")
                        }
                      >
                        {tx(last?.body ?? t.preview)}
                      </span>
                    </span>
                    {isUnread(side, t) ? (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[color:var(--pp-violet)]"
                        aria-label={tx("Unread")}
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section
          className={
            "flex min-h-[28rem] flex-col lg:min-h-[32rem] " +
            (mobileShowChat ? "flex" : "hidden lg:flex")
          }
        >
          {!active ? (
            <div className="grid flex-1 place-items-center px-4 text-sm text-ink-tertiary">
              {tx("Select a conversation.")}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 sm:px-5">
                <button
                  type="button"
                  className="text-sm font-medium text-ink-tertiary hover:text-[color:var(--pp-primary-950)] lg:hidden"
                  onClick={() => setMobileShowChat(false)}
                >
                  ← {tx("Inbox")}
                </button>
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${active.tone}`}
                >
                  {initials(counterpartLabel(side, active, tx))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[color:var(--pp-primary-950)]">
                    {counterpartLabel(side, active, tx)}
                  </p>
                  <p className="truncate text-2xs text-ink-tertiary">
                    {counterpartMeta(side, active, tx)}
                    {orderNote
                      ? ` · ${orderNote}`
                      : ` · ${tx("Typically replies in a few hours")}`}
                  </p>
                </div>
                {orderParam && side === "patient" ? (
                  <button
                    type="button"
                    onClick={() => nav(`/orders/${orderParam}`)}
                    className="hidden shrink-0 rounded-full border border-line px-3 py-1.5 text-2xs font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)] sm:inline-flex"
                  >
                    {tx("View order")}
                  </button>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-[color:var(--pp-page)]/40 px-4 py-5 sm:px-5">
                {orderParam ? (
                  <div className="mx-auto max-w-md rounded-2xl border border-line bg-white px-4 py-3 text-center text-2xs text-ink-secondary">
                    {tx("Conversation linked to")}{" "}
                    <span className="font-semibold text-[color:var(--pp-primary-950)]">{orderParam}</span>
                  </div>
                ) : null}
                {messages.map((m) => {
                  const mine = isYou(side, m.sender);
                  return (
                    <div
                      key={m.id}
                      className={"flex " + (mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={
                          "max-w-[min(100%,22rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed " +
                          (mine
                            ? "rounded-br-md bg-[color:var(--pp-primary-950)] text-white"
                            : "rounded-bl-md border border-line bg-white text-[color:var(--pp-primary-950)]")
                        }
                      >
                        <p>{m.id.startsWith("msg-") ? m.body : tx(m.body)}</p>
                        <p
                          className={
                            "mt-1.5 text-2xs " + (mine ? "text-white/65" : "text-ink-tertiary")
                          }
                        >
                          {formatMessageTime(m.at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form
                className="border-t border-line bg-white p-3 sm:p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <div className="flex items-end gap-2 rounded-2xl border border-line bg-[color:var(--pp-primary-100)]/40 p-2 focus-within:border-[color:var(--pp-primary-800)]">
                  <label className="sr-only" htmlFor={`care-chat-compose-${side}`}>
                    {tx("Write a message")}
                  </label>
                  <textarea
                    id={`care-chat-compose-${side}`}
                    rows={1}
                    value={compose}
                    onChange={(e) => setCompose(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder={`${tx("Message")} ${counterpartLabel(side, active, tx).split(" ")[0]}…`}
                    className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-ink-tertiary"
                  />
                  <Button type="submit" size="sm" disabled={!compose.trim()}>
                    {tx("Send")}
                  </Button>
                </div>
                <p className="mt-2 px-1 text-2xs text-ink-tertiary">
                  {side === "patient"
                    ? tx("Not for emergencies. If you need urgent care, call 911 or visit a clinic.")
                    : tx("Replies appear instantly in the patient’s Messages inbox.")}
                </p>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
