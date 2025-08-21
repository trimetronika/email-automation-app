import { api, APIError } from "encore.dev/api";
import { templatesDB } from "./db";

export interface CreateTemplateRequest {
  name: string;
  subject: string;
  htmlContent: string;
  variables?: string[];
}

export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new email template.
export const create = api<CreateTemplateRequest, EmailTemplate>(
  { auth: false, expose: true, method: "POST", path: "/templates" },
  async (req) => {
    // For development, use a default user ID
    const userId = "dev-user-1";

    // Extract variables from template content
    const variableRegex = /\{\{(\w+)\}\}/g;
    const extractedVariables = new Set<string>();
    let match;
    
    while ((match = variableRegex.exec(req.htmlContent + req.subject)) !== null) {
      extractedVariables.add(match[1]);
    }

    const variables = req.variables || Array.from(extractedVariables);

    const template = await templatesDB.queryRow<EmailTemplate>`
      INSERT INTO email_templates (name, subject, html_content, variables, user_id)
      VALUES (${req.name}, ${req.subject}, ${req.htmlContent}, ${JSON.stringify(variables)}, ${userId})
      RETURNING id, name, subject, html_content as "htmlContent", variables, user_id as "userId", 
                is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
    `;

    if (!template) {
      throw APIError.internal("failed to create template");
    }

    return {
      ...template,
      variables: template.variables as string[],
    };
  }
);
