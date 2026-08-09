import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/lib/user";
import { useDismiss } from "@/lib/useDismiss";

type IconId =
  | "profile"
  | "bell"
  | "book"
  | "family"
  | "benefits"
  | "switch"
  | "logout";

function MenuIcon({ id }: { id: IconId }) {
  const c = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (id) {
    case "profile":
      return (
        <svg {...c}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5c0-3.4 3.1-5.5 7-5.5s7 2.1 7 5.5" />
        </svg>
      );
    case "bell":
      return (
        <svg {...c}>
          <path d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 5 2 6.5 2 6.5H4.5s2-1.5 2-6.5Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
    case "book":
      return (
        <svg {...c}>
          <path d="M4.5 5.5h6.5A2.5 2.5 0 0 1 13.5 8v11.5H7A2.5 2.5 0 0 1 4.5 17V5.5Z" />
          <path d="M19.5 5.5h-6.5A2.5 2.5 0 0 0 10.5 8v11.5H17A2.5 2.5 0 0 0 19.5 17V5.5Z" />
        </svg>
      );
    case "family":
      return (
        <svg {...c}>
          <circle cx="9" cy="8" r="2.8" />
          <path d="M3.5 19c0-2.9 2.4-4.8 5.5-4.8" />
          <circle cx="16.5" cy="9" r="2.2" />
          <path d="M13.2 19c0-2.4 1.7-4 3.8-4s3.5 1.4 3.5 3.5" />
        </svg>
      );
    case "benefits":
      return (
        <svg {...c}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case "switch":
      return (
        <svg {...c}>
          <path d="M16.5 7.5A6.5 6.5 0 0 0 7 10.2" />
          <path d="M7.5 7.5H4.5v3" />
          <path d="M7.5 16.5A6.5 6.5 0 0 0 17 13.8" />
          <path d="M16.5 16.5h3v-3" />
        </svg>
      );
    default:
      return (
        <svg {...c}>
          <path d="M10 4.5H7.5A3 3 0 0 0 4.5 7.5v9A3 3 0 0 0 7.5 19.5H10" />
          <path d="M14 8.5 18.5 12 14 15.5M18.5 12H9.5" />
        </svg>
      );
  }
}

const PRIMARY: { id: IconId; label: string; to: string }[] = [
  { id: "profile", label: "Edit profile", to: "/account" },
  { id: "bell", label: "Notification settings", to: "/account/notifications" },
  { id: "book", label: "Language preference", to: "/account/language" },
  { id: "family", label: "Manage family", to: "/account/family" },
  { id: "benefits", label: "Pocketpills benefits", to: "/account/benefits" },
];

const ITEM =
  "flex w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium text-[color:var(--pp-primary-950)] transition-colors hover:bg-[color:var(--state-hover)]";

export function ProfileMenuPanel({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const { logOut } = useUser();

  const go = (to: string) => {
    onClose();
    nav(to);
  };

  return (
    <div role="menu" aria-label="Account" className="overflow-hidden rounded-2xl border border-line bg-[color:var(--pp-primary-100)] shadow-float">
      <div className="py-1.5">
        {PRIMARY.map((item) => (
          <button key={item.to} type="button" role="menuitem" onClick={() => go(item.to)} className={ITEM}>
            <span className="shrink-0 text-[color:var(--pp-primary-950)]">
              <MenuIcon id={item.id} />
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div role="separator" className="mx-4 border-t border-line" />

      <div className="py-1.5">
        <button type="button" role="menuitem" onClick={() => go("/account/switch")} className={ITEM}>
          <span className="shrink-0 text-[color:var(--pp-primary-950)]">
            <MenuIcon id="switch" />
          </span>
          Switch account
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            logOut();
            nav("/");
          }}
          className={ITEM}
        >
          <span className="shrink-0 text-[color:var(--pp-primary-950)]">
            <MenuIcon id="logout" />
          </span>
          Log out
        </button>
      </div>
    </div>
  );
}

/** Shared signed-in profile dropdown — matches product reference. */
export function ProfileMenu({
  trigger,
  align = "right",
  menuId = "user-menu",
}: {
  trigger: (opts: { open: boolean; toggle: () => void; menuId: string }) => ReactNode;
  align?: "left" | "right";
  menuId?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      {trigger({
        open,
        toggle: () => setOpen((o) => !o),
        menuId,
      })}
      {open && (
        <div
          id={menuId}
          className={"absolute z-30 mt-2 w-[17.5rem] " + (align === "right" ? "right-0" : "left-0")}
        >
          <ProfileMenuPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
