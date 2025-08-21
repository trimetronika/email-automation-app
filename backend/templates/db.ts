import { SQLDatabase } from "encore.dev/storage/sqldb";

export const templatesDB = new SQLDatabase("templates", {
  migrations: "./migrations",
});
