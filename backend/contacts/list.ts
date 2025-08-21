import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { contactsDB } from "./db";
import type { Contact } from "./create";

export interface ListContactsRequest {
  search?: Query<string>;
  sector?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

export interface ListContactsResponse {
  contacts: Contact[];
  total: number;
}

// Lists contacts with optional search and filtering.
export const list = api<ListContactsRequest, ListContactsResponse>(
  { auth: false, expose: true, method: "GET", path: "/contacts" },
  async (req) => {
    // For development, use a default user ID
    const userId = "dev-user-1";
    const limit = req.limit || 50;
    const offset = req.offset || 0;

    let whereClause = "WHERE user_id = $1";
    let params: any[] = [userId];
    let paramIndex = 2;

    if (req.search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR company ILIKE $${paramIndex})`;
      params.push(`%${req.search}%`);
      paramIndex++;
    }

    if (req.sector) {
      whereClause += ` AND sector = $${paramIndex}`;
      params.push(req.sector);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as count FROM contacts ${whereClause}`;
    const totalResult = await contactsDB.rawQueryRow<{ count: number }>(countQuery, ...params);
    const total = totalResult?.count || 0;

    const contactsQuery = `
      SELECT id, name, email, company, sector, phone, notes, user_id as "userId", 
             created_at as "createdAt", updated_at as "updatedAt"
      FROM contacts 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const contacts = await contactsDB.rawQueryAll<Contact>(
      contactsQuery, 
      ...params, 
      limit, 
      offset
    );

    return {
      contacts,
      total,
    };
  }
);
