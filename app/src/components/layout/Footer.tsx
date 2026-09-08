import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[16px]">explore</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            Findr — Lost &amp; Found
          </span>
        </div>

        <p className="text-xs text-slate-500">
          A simple, community-focused platform for reuniting lost belongings.
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Explore
          </Link>
          <Link href="/report" className="hover:text-blue-600 transition-colors">
            Report Item
          </Link>
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
