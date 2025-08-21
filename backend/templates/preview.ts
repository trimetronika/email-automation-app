import { api } from "encore.dev/api";

export interface PreviewTemplateRequest {
  subject: string;
  htmlContent: string;
  variables: Record<string, string>;
}

export interface PreviewTemplateResponse {
  subject: string;
  htmlContent: string;
}

// Previews an email template with variable substitution.
export const preview = api<PreviewTemplateRequest, PreviewTemplateResponse>(
  { auth: false, expose: true, method: "POST", path: "/templates/preview" },
  async (req) => {
    let processedSubject = req.subject;
    let processedHtml = req.htmlContent;

    // Replace variables in both subject and content
    for (const [key, value] of Object.entries(req.variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedSubject = processedSubject.replace(regex, value);
      processedHtml = processedHtml.replace(regex, value);
    }

    return {
      subject: processedSubject,
      htmlContent: processedHtml,
    };
  }
);
