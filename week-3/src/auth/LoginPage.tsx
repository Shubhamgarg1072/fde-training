import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { login } from './authApi.ts';
import { useAuthStore } from './authStore.ts';
import { credentialsSchema, type Credentials } from './schemas.ts';
import type { LoginLocationState } from './RequireAuth.tsx';
import { TextField } from '../ui/TextField.tsx';
import { apiErrorStatus, errorMessage } from '../lib/apiError.ts';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const status = useAuthStore((state) => state.status);
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();
  const locationState = (useLocation().state ?? {}) as LoginLocationState;
  const redirectTo = locationState.from ?? '/orders';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      signIn(session);
      void navigate(redirectTo, { replace: true });
    },
  });

  if (status === 'signedIn' && !loginMutation.isSuccess) {
    return <Navigate to={redirectTo} replace />;
  }

  const serverError = loginMutation.isError
    ? apiErrorStatus(loginMutation.error) === 401
      ? 'Email or password is incorrect.'
      : errorMessage(
          loginMutation.error,
          "We couldn't sign you in. Try again in a moment.",
        )
    : null;

  return (
    <main className={styles.screen}>
      <title>Sign in · Slow Pour Admin</title>
      <div className={`card ${styles.panel}`}>
        <div className={styles.heading}>
          <p className={styles.brand}>Slow Pour Admin</p>
          <h1>Sign in</h1>
        </div>

        {locationState.expired && !serverError && (
          <p className="alert alert--info" role="status">
            Your session expired. Sign in again to pick up where you left off.
          </p>
        )}
        {serverError && (
          <p className="alert" role="alert">
            {serverError}
          </p>
        )}

        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            void handleSubmit((credentials) => {
              loginMutation.mutate(credentials);
            })(event);
          }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="submit"
            className="button button--primary"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className={styles.demo}>
          Demo account: <code>ops@slowpour.example</code> / <code>brew-better</code>
        </p>
      </div>
    </main>
  );
}
