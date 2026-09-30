import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  return (
    <>
      {erro && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Não foi possível confirmar seu e-mail. O link pode ter expirado.
        </p>
      )}
      <AuthForm mode="login" />
    </>
  );
}
