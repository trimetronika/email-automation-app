import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contactsDB } from "./db";

export interface ImportContactsRequest {
  contacts: {
    name: string;
    email: string;
    company?: string;
    sector?: string;
    phone?: string;
    notes?: string;
  }[];
}

export interface ImportContactsResponse {
  imported: number;
  skipped: number;
  errors: string[];
}

// Imports multiple contacts from CSV data.
export const importContacts = api<ImportContactsRequest, ImportContactsResponse>(
  { auth: true, expose: true, method: "POST", path: "/contacts/import" },
  async (req) => {
    const auth = getAuthData()!;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contact of req.contacts) {
      try {
        // Validate email format
        if (!emailRegex.test(contact.email)) {
          errors.push(`Invalid email format: ${contact.email}`);
          skipped++;
          continue;
        }

        // Check for duplicate
        const existing = await contactsDB.queryRow`
          SELECT id FROM contacts 
          WHERE email = ${contact.email} AND user_id = ${auth.userID}
        `;

        if (existing) {
          skipped++;
          continue;
        }

        // Insert contact
        await contactsDB.exec`
          INSERT INTO contacts (name, email, company, sector, phone, notes, user_id)
          VALUES (${contact.name}, ${contact.email}, ${contact.company}, ${contact.sector}, ${contact.phone}, ${contact.notes}, ${auth.userID})
        `;

        imported++;
      } catch (error) {
        errors.push(`Error importing ${contact.email}: ${error}`);
        skipped++;
      }
    }

    return {
      imported,
      skipped,
      errors,
    };
  }
);
