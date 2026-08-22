"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../lib/supabase/client";
import { navLinks } from "./navLinks";

function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // onAuthStateChange fires once immediately with the current session
    // (event INITIAL_SESSION) in addition to future changes, so a separate
    // getUser() call here would just duplicate that initial check.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoadingUser(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <nav className="navbar" suppressHydrationWarning>
      {/* Brand */}
      <div className="navbar-brand">
        <Link href="/">
          <span className="navbar-logo-icon">▶</span>
          ScreenCrave
        </Link>
      </div>

      {/* Center nav links */}
      <div className="navbar-links">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`nav-link${pathname === href ? " nav-active" : ""}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right: auth area */}
      <div className="navbar-auth">
        {!loadingUser && user && (
          <div className="nav-user-pill" onClick={() => setMenuOpen((p) => !p)}>
            <div className="nav-avatar" aria-label="User menu">
              {initials}
            </div>
            <span className="nav-user-name">{displayName}</span>
            <svg className="nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {menuOpen && (
              <div className="nav-dropdown">
                <div className="nav-dropdown-header">
                  <div className="nav-dropdown-avatar">{initials}</div>
                  <div>
                    <p className="nav-dropdown-name">{displayName}</p>
                    <p className="nav-dropdown-email">{user.email}</p>
                  </div>
                </div>
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item nav-dropdown-logout" onClick={handleLogout}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}

        {!loadingUser && !user && (
          <div className="navbar-auth-links">
            <Link href="/login" className="nav-link">
              Log In
            </Link>
            <Link href="/signup" className="nav-btn-signup">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavBar;