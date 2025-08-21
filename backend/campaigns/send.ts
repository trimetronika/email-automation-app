import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { campaignsDB } from "./db";
import { templatesDB } from "../templates/db";
import { contactsDB } from "../contacts/db";
import { secret } from "encore.dev/config";

const smtpHost = secret("SMTPHost");
const smtpPort = secret("SMTPPort");
const smtpUser = secret("SMTPUser");
const smtpPassword = secret("SMTPPassword");

export interface SendCampaignRequest {
  campaignId: number;
}

export interface SendCampaignResponse {
  success: boolean;
  message: string;
}

// Sends an email campaign immediately.
export const send = api<SendCampaignRequest, SendCampaignResponse>(
  { auth: true, expose: true, method: "POST", path: "/campaigns/:campaignId/send" },
  async (req) => {
    const auth = getAuthData()!;

    // Check rate limit
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);

    const rateLimit = await campaignsDB.queryRow<{ email_count: number }>`
      SELECT email_count FROM email_rate_limits 
      WHERE user_id = ${auth.userID} AND hour_bucket = ${currentHour}
    `;

    const currentCount = rateLimit?.email_count || 0;
    if (currentCount >= 250) {
      throw APIError.resourceExhausted("rate limit exceeded: 250 emails per hour");
    }

    // Get campaign details
    const campaign = await campaignsDB.queryRow`
      SELECT id, template_id, status, total_recipients 
      FROM campaigns 
      WHERE id = ${req.campaignId} AND user_id = ${auth.userID}
    `;

    if (!campaign) {
      throw APIError.notFound("campaign not found");
    }

    if (campaign.status === 'completed') {
      throw APIError.invalidArgument("campaign already completed");
    }

    if (campaign.status === 'sending') {
      throw APIError.invalidArgument("campaign is already being sent");
    }

    // Check if we can send all emails within rate limit
    if (currentCount + campaign.total_recipients > 250) {
      throw APIError.resourceExhausted(`cannot send ${campaign.total_recipients} emails, would exceed rate limit`);
    }

    // Get template
    const template = await templatesDB.queryRow`
      SELECT subject, html_content FROM email_templates 
      WHERE id = ${campaign.template_id}
    `;

    if (!template) {
      throw APIError.notFound("template not found");
    }

    // Update campaign status
    await campaignsDB.exec`
      UPDATE campaigns 
      SET status = 'sending', started_at = NOW() 
      WHERE id = ${req.campaignId}
    `;

    // Get recipients
    const recipients = await campaignsDB.queryAll<{ id: number; contact_id: number; email: string }>`
      SELECT cr.id, cr.contact_id, cr.email
      FROM campaign_recipients cr
      WHERE cr.campaign_id = ${req.campaignId} AND cr.status = 'pending'
    `;

    let sentCount = 0;
    let failedCount = 0;

    // Send emails (simplified - in production, use a proper email service)
    for (const recipient of recipients) {
      try {
        // Get contact details for personalization
        const contact = await contactsDB.queryRow<{ name: string; company: string }>`
          SELECT name, company FROM contacts WHERE id = ${recipient.contact_id}
        `;

        // Replace variables in template
        let personalizedSubject = template.subject;
        let personalizedContent = template.html_content;

        if (contact) {
          personalizedSubject = personalizedSubject.replace(/\{\{nama\}\}/g, contact.name || '');
          personalizedSubject = personalizedSubject.replace(/\{\{perusahaan\}\}/g, contact.company || '');
          personalizedContent = personalizedContent.replace(/\{\{nama\}\}/g, contact.name || '');
          personalizedContent = personalizedContent.replace(/\{\{perusahaan\}\}/g, contact.company || '');
        }

        // Here you would integrate with actual email service (Nodemailer with Zimbra SMTP)
        // For now, we'll simulate success
        
        await campaignsDB.exec`
          UPDATE campaign_recipients 
          SET status = 'sent', sent_at = NOW() 
          WHERE id = ${recipient.id}
        `;
        
        sentCount++;
      } catch (error) {
        await campaignsDB.exec`
          UPDATE campaign_recipients 
          SET status = 'failed', error_message = ${String(error)} 
          WHERE id = ${recipient.id}
        `;
        failedCount++;
      }
    }

    // Update campaign completion
    await campaignsDB.exec`
      UPDATE campaigns 
      SET status = 'completed', completed_at = NOW(), sent_count = ${sentCount}, failed_count = ${failedCount}
      WHERE id = ${req.campaignId}
    `;

    // Update rate limit
    await campaignsDB.exec`
      INSERT INTO email_rate_limits (user_id, hour_bucket, email_count)
      VALUES (${auth.userID}, ${currentHour}, ${currentCount + sentCount})
      ON CONFLICT (user_id, hour_bucket)
      DO UPDATE SET email_count = email_rate_limits.email_count + ${sentCount}
    `;

    return {
      success: true,
      message: `Campaign sent successfully. ${sentCount} emails sent, ${failedCount} failed.`,
    };
  }
);
