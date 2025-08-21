import { SQLDatabase } from "encore.dev/storage/sqldb";

export const campaignsDB = new SQLDatabase("campaigns", {
  migrations: "./migrations",
});
