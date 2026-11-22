import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="page" role="alert">
      <h1>{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p>
        {notFound
          ? "That page doesn't exist. It may have been moved."
          : 'An unexpected error stopped this page from loading. Reload to try again.'}
      </p>
      <p>
        <Link to="/orders">Go to orders</Link>
      </p>
    </div>
  );
}
