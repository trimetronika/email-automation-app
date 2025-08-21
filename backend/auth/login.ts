import { api, Cookie } from "encore.dev/api";
import { authDB } from "./db";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  session: Cookie<"session">;
}

// Login endpoint for development.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    // For development, accept any @absenku.com email
    if (!req.email.endsWith("@absenku.com")) {
      throw new Error("Only @absenku.com emails are allowed");
    }

    // Check if user exists, if not create them
    let user = await authDB.queryRow<{
      id: number;
      email: string;
      name: string;
      role: string;
    }>`
      SELECT id, email, name, role FROM users WHERE email = ${req.email}
    `;

    if (!user) {
      // Create new user
      const name = req.email.split("@")[0].replace(".", " ");
      user = await authDB.queryRow<{
        id: number;
        email: string;
        name: string;
        role: string;
      }>`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (${req.email}, 'dev-hash', ${name}, 'AE')
        RETURNING id, email, name, role
      `;
    }

    if (!user) {
      throw new Error("Failed to create or find user");
    }

    return {
      success: true,
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        value: `session-${user.id}`,
        expires: new Date(Date.now() + 3600 * 24 * 30 * 1000), // 30 days
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      }
    };
  }
);
