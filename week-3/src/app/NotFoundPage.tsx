import { Link } from 'react-router';
import { PageHeading } from '../ui/PageHeading.tsx';

export function NotFoundPage() {
  return (
    <div className="page">
      <title>Not found · Slow Pour Admin</title>
      <PageHeading>Page not found</PageHeading>
      <p>That page doesn't exist. It may have been moved.</p>
      <p>
        <Link to="/orders">Go to orders</Link>
      </p>
    </div>
  );
}
