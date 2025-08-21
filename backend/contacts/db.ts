import { SQLDatabase } from "encore.dev/storage/sqldb";

export const contactsDB = new SQLDatabase("contacts", {
  migrations: "./migrations",
});
