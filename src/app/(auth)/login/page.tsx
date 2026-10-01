import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  return (
    <>
      {erro && (
        <p className="mb-6 text-[15px] text-accent-2-700" role="alert">
          Não foi possível confirmar seu e-mail. O link pode ter expirado.
        </p>
      )}
      <AuthForm mode="login" />
    </>
  );
}
