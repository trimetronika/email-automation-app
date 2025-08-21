import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  role: string;
  name: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    // For development, create a mock user
    // In production, implement proper JWT validation
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    
    if (!token) {
      // Return a default user for development
      return {
        userID: "dev-user-1",
        email: "developer@absenku.com",
        role: "AE",
        name: "Development User",
      };
    }

    // For now, return the same mock user
    // TODO: Implement proper JWT token validation
    return {
      userID: "dev-user-1",
      email: "developer@absenku.com", 
      role: "AE",
      name: "Development User",
    };
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
