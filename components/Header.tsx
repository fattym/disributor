"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import ThemeToggle from "./ThemeToggle";

const navLink =
  "text-sm font-semibold text-[#0B1F3A] dark:text-zinc-200 hover:bg-[#F4F5F7] dark:hover:bg-zinc-800 rounded-full px-4 py-2 transition-colors";

export default function ParentHeader() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const router = useRouter();
  const itemCount = getItemCount();

  return (
    <>
      <div className="bg-[#E63B00] text-white text-sm font-medium">
        <div className="max-w-6xl mx-auto flex justify-between gap-2 flex-wrap py-2.5 px-4">
          <p className="opacity-90">Mon–Fri, 8am to 6pm · 0798 734 442</p>
          <ul className="flex items-center gap-5 flex-wrap">
            {!user && (
              <li>
                <Link href="/login" className="hover:underline">
                  Log in
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="text-2xl font-extrabold text-[#0B1F3A] dark:text-zinc-100"
          >
            Learning Pack
          </Link>
          <nav className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/shop" className={navLink}>
              Shop
            </Link>
            <Link href="/cart" className={"relative " + navLink}>
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E63B00] text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={user ? logout : () => router.push("/login")}
              className={navLink}
            >
              {user ? "Sign out" : "Sign in"}
            </button>
          </nav>
        </div>
      </header>
    </>
  );
}
