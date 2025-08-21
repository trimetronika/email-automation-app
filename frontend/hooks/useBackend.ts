import backend from "~backend/client";

// Returns the backend client.
// Note: Authentication is temporarily disabled for development.
export function useBackend() {
  return backend;
}
