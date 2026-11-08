
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setError("No tenés permisos de administrador.");
      setLoading(false);
      return;
    }

    router.replace("/admin/solicitudes");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-xl font-black text-orange-600">
            CVC
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Panel administrativo
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Ingresá con tu cuenta de administrador.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Correo electrónico
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Contraseña
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 py-4 font-bold text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <a
          href="/"
          className="mt-7 block text-center text-sm text-slate-500 hover:text-orange-600"
        >
          Volver al sitio
        </a>
      </div>
    </main>
  );
}
