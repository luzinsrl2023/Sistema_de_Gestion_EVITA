import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";

export async function customLogin(email, password) {
  // Buscar usuario por correo
  const { data: user, error } = await supabase
    .from("usuarios_app")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error("Usuario no encontrado");
  }

  // Comparar contraseña (por ahora texto plano, luego bcrypt)
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("Contraseña incorrecta");
  }

  // Crear sesión simple en localStorage
  localStorage.setItem(
    "usuario",
    JSON.stringify({ id: user.id, email: user.email })
  );

  return user;
}

export async function registerUser(email, password) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const { data, error } = await supabase
    .from("usuarios_app")
    .insert([{ email, password_hash: hash }]);

  if (error) throw error;
  return data;
}
