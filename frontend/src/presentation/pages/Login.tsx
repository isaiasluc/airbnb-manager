import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { FirebaseError } from "firebase/app";
import ThemeToggle from "@/presentation/shared/ThemeToggle";
import { useAuth } from "@/application/auth/useAuth";

type LoginLocationState = {
  from?: {
    pathname: string;
    search: string;
  };
};

function getLoginErrorMessage(error: unknown) {
  const code = (error as FirebaseError).code;
  if (code === "auth/invalid-credential") return "E-mail ou senha inválidos.";
  if (code === "auth/too-many-requests") {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  return "Não foi possível entrar. Verifique os dados e tente novamente.";
}

export default function Login() {
  const { loading, signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LoginLocationState | null;
  const from = state?.from
    ? `${state.from.pathname}${state.from.search}`
    : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen bg-paper font-sans transition-colors dark:bg-paper-dark">
      <header className="flex justify-end px-6 py-4">
        <ThemeToggle />
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-md items-center px-6 pb-16">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-line bg-surface px-6 py-7 shadow-sm transition-colors dark:border-line-dark dark:bg-surface-dark"
        >
          <div className="mb-7">
            <p className="text-sm font-medium text-ink-muted dark:text-ink-muted-dark">
              Airbnb Manager
            </p>
            <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight text-ink dark:text-ink-dark">
              Entrar
            </h1>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-ink-muted dark:text-ink-muted-dark">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink outline-none transition-colors focus:border-accent dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-accent-dark"
              />
            </label>

            <label className="block text-sm font-medium text-ink-muted dark:text-ink-muted-dark">
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="mt-1 h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink outline-none transition-colors focus:border-accent dark:border-line-dark dark:bg-paper-dark dark:text-ink-dark dark:focus:border-accent-dark"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || submitting}
            className="mt-6 h-11 w-full rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 dark:bg-accent-dark dark:text-ink dark:hover:bg-accent-hover-dark"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
