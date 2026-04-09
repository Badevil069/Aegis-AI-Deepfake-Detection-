import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function NotFoundPage() {
  return (
    <PageTransition className="flex min-h-[60vh] items-center justify-center py-14">
      <div className="glass-card max-w-lg p-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-cyan">404</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">Page Not Found</h1>
        <p className="mt-3 text-sm text-slate-300">The page you requested does not exist in this frontend build.</p>
        <Link to="/" className="cyber-button mt-6 inline-flex px-5 py-3 text-sm">
          Return Home
        </Link>
      </div>
    </PageTransition>
  );
}
