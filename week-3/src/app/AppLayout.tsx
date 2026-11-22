import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useNavigation } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../auth/authStore.ts';
import { logout } from '../auth/authApi.ts';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // A client-side navigation doesn't move focus the way a page load does, so screen
  // reader users wouldn't know the page changed. Put focus on the new page's heading.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
  }, [pathname]);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      signOut();
      void navigate('/login', { replace: true });
    },
  });

  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={styles.sidebar}>
        <p className={styles.brand}>Slow Pour Admin</p>
        <nav aria-label="Main">
          <ul className={styles.nav} role="list">
            <li>
              <NavLink to="/orders">Orders</NavLink>
            </li>
            <li>
              <NavLink to="/products">Products</NavLink>
            </li>
          </ul>
        </nav>
        <div className={styles.account}>
          <p className={styles.user}>{user?.name}</p>
          <button
            type="button"
            className={styles.signOut}
            disabled={logoutMutation.isPending}
            onClick={() => {
              logoutMutation.mutate();
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {navigation.state === 'loading' && (
        <div className={styles.progress} role="progressbar" aria-label="Loading page" />
      )}

      <main id="main" ref={mainRef} className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
