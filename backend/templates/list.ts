import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { templatesDB } from "./db";
import type { EmailTemplate } from "./create";

export interface ListTemplatesResponse {
  templates: EmailTemplate[];
}

// Lists all email templates for the current user.
export const list = api<void, ListTemplatesResponse>(
  { auth: true, expose: true, method: "GET", path: "/templates" },
  async () => {
    const auth = getAuthData()!;

    const templates = await templatesDB.queryAll<EmailTemplate>`
      SELECT id, name, subject, html_content as "htmlContent", variables, user_id as "userId",
             is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
      FROM email_templates 
      WHERE user_id = ${auth.userID} AND is_active = true
      ORDER BY created_at DESC
    `;

    return {
      templates: templates.map(template => ({
        ...template,
        variables: template.variables as string[],
      })),
    };
  }
);
