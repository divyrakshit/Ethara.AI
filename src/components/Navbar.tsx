"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

interface User {
  name: string;
  email: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.ok ? await res.json() : null;
          if (data && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user in Navbar", err);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <nav className={styles.navbar}>
      <Link href="/dashboard" className={styles.logo}>
        Aether Tasks
      </Link>

      <div className={styles.menu}>
        <Link
          href="/dashboard"
          className={`${styles.link} ${
            pathname === "/dashboard" ? styles.activeLink : ""
          }`}
        >
          Dashboard
        </Link>

        {user && (
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>{getInitials(user.name)}</div>
              <span className={styles.userName}>{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className={`${styles.logoutBtn} btn-secondary`}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
