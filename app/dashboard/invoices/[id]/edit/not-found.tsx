import { FaceFrownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <FaceFrownIcon className="w-20 text-gray-400" />
      <h2 className="text-xl font-semibold">404 Not Found</h2>
      <p>Could not find the requested invoice.</p>
      <Link
        href="/dashboard/invoices"
        className="bg-blue-500 hover:bg-blue-400 mt-4 rounded-md px-4 py-2 text-white text-sm transition-colors"
      >
        Go Back
      </Link>
    </main>
  );
}
