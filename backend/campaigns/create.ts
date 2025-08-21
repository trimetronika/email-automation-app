import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { campaignsDB } from "./db";
import { contactsDB } from "../contacts/db";

export interface CreateCampaignRequest {
  name: string;
  templateId: number;
  contactIds: number[];
  scheduledAt?: Date;
}

export interface Campaign {
  id: number;
  name: string;
  templateId: number;
  userId: string;
  status: string;
  scheduledAt?: Date;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Creates a new email campaign.
export const create = api<CreateCampaignRequest, Campaign>(
  { auth: true, expose: true, method: "POST", path: "/campaigns" },
  async (req) => {
    const auth = getAuthData()!;

    // Validate contacts belong to user
    const validContacts = await contactsDB.queryAll<{ id: number; email: string }>`
      SELECT id, email FROM contacts 
      WHERE id = ANY(${req.contactIds}) AND user_id = ${auth.userID}
    `;

    if (validContacts.length !== req.contactIds.length) {
      throw APIError.invalidArgument("some contacts do not exist or do not belong to user");
    }

    // Begin transaction
    await using tx = await campaignsDB.begin();

    try {
      // Create campaign
      const campaign = await tx.queryRow<Campaign>`
        INSERT INTO campaigns (name, template_id, user_id, scheduled_at, total_recipients, status)
        VALUES (${req.name}, ${req.templateId}, ${auth.userID}, ${req.scheduledAt}, ${validContacts.length}, 
                ${req.scheduledAt ? 'scheduled' : 'draft'})
        RETURNING id, name, template_id as "templateId", user_id as "userId", status, scheduled_at as "scheduledAt",
                  total_recipients as "totalRecipients", sent_count as "sentCount", failed_count as "failedCount",
                  created_at as "createdAt", updated_at as "updatedAt"
      `;

      if (!campaign) {
        throw APIError.internal("failed to create campaign");
      }

      // Add recipients
      for (const contact of validContacts) {
        await tx.exec`
          INSERT INTO campaign_recipients (campaign_id, contact_id, email)
          VALUES (${campaign.id}, ${contact.id}, ${contact.email})
        `;
      }

      await tx.commit();
      return campaign;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);
