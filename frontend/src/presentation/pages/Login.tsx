import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { FirebaseError } from "firebase/app";
import { useAuth } from "@/application/auth/useAuth";
// Layouts disponíveis: LoginSplit (A), LoginCard (B), LoginHero (C).
// Troque o import abaixo para alternar o visual da tela.
import LoginLayout from "@/presentation/components/login/LoginSplit";

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
    <LoginLayout
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      error={error}
      submitting={submitting}
      disabled={loading || submitting}
    />
  );
}
