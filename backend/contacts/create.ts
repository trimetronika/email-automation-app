import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { contactsDB } from "./db";

export interface CreateContactRequest {
  name: string;
  email: string;
  company?: string;
  sector?: string;
  phone?: string;
  notes?: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  company?: string;
  sector?: string;
  phone?: string;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new contact.
export const create = api<CreateContactRequest, Contact>(
  { auth: true, expose: true, method: "POST", path: "/contacts" },
  async (req) => {
    const auth = getAuthData()!;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      throw APIError.invalidArgument("invalid email format");
    }

    // Check for duplicate email for this user
    const existing = await contactsDB.queryRow`
      SELECT id FROM contacts 
      WHERE email = ${req.email} AND user_id = ${auth.userID}
    `;
    
    if (existing) {
      throw APIError.alreadyExists("contact with this email already exists");
    }

    const contact = await contactsDB.queryRow<Contact>`
      INSERT INTO contacts (name, email, company, sector, phone, notes, user_id)
      VALUES (${req.name}, ${req.email}, ${req.company}, ${req.sector}, ${req.phone}, ${req.notes}, ${auth.userID})
      RETURNING id, name, email, company, sector, phone, notes, user_id as "userId", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!contact) {
      throw APIError.internal("failed to create contact");
    }

    return contact;
  }
);
