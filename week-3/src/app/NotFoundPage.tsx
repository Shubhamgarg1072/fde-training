import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="page">
      <title>Not found · Slow Pour Admin</title>
      <h1 tabIndex={-1}>Page not found</h1>
      <p>That page doesn't exist. It may have been moved.</p>
      <p>
        <Link to="/orders">Go to orders</Link>
      </p>
    </div>
  );
}
