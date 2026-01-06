import {
  isValidEmail,
  isNotEmpty,
  isValidBulkEmails,
  isValidHtmlContent,
  isValidSenderEmail,
  isValidSubject,
  validationMessages,
} from "../../../utils/email-validators";

interface Attachment {
  filename: string;
  content: Buffer | string;
}

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

interface BulkSendOptions {
  to: string[];
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export default ({ strapi }) => ({
  async send({ to, subject, html, attachments = [] }: SendOptions) {
    if (!isValidEmail(to)) {
      throw new Error(validationMessages.invalidEmail);
    }

    if (![to, subject, html].every(isNotEmpty)) {
      throw new Error(validationMessages.missingField + "to, subject or html");
    }

    if (!isValidSubject(subject)) {
      throw new Error(validationMessages.invalidSubject);
    }

    if (!isValidHtmlContent(html)) {
      throw new Error(validationMessages.invalidHtmlContent);
    }

    try {
      await strapi.plugin("email").service("email").send({
        to,
        subject,
        html,
        attachments,
      });

      return { success: true, to };
    } catch (error) {
      strapi.log.error("Error sending email:", error);
      throw new Error("Could not send the email");
    }
  },

  async sendBulk({ to, subject, html, attachments = [] }: BulkSendOptions) {
    if (!isValidBulkEmails(to)) {
      throw new Error(validationMessages.invalidBulkEmails);
    }

    if (![subject, html].every(isNotEmpty)) {
      throw new Error(validationMessages.missingField + "subject or html");
    }

    if (!isValidSubject(subject)) {
      throw new Error(validationMessages.invalidSubject);
    }

    if (!isValidHtmlContent(html)) {
      throw new Error(validationMessages.invalidHtmlContent);
    }

    try {
      await strapi
        .plugin("email")
        .service("email")
        .send({
          to: to.join(", "),
          subject,
          html,
          attachments,
        });

      return { success: true, recipients: to.length };
    } catch (error) {
      strapi.log.error("Error sending bulk emails:", error);
      throw new Error("Could not send bulk emails");
    }
  },

  async sendToMany({ to, subject, html, attachments = [] }: BulkSendOptions) {
    if (!isValidBulkEmails(to)) {
      throw new Error(validationMessages.invalidBulkEmails);
    }

    const results = await Promise.allSettled(
      to.map((recipient) =>
        this.send({ to: recipient, subject, html, attachments }),
      ),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { succeeded, failed, total: to.length };
  },
});
