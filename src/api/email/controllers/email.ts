export default {
  async send(ctx) {
    const { to, subject, html, attachments } = ctx.request.body;

    try {
      const result = await strapi.service("api::email.enhanced-email").send({
        to,
        subject,
        html,
        attachments,
      });

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },

  async sendBulk(ctx) {
    const { to, subject, html, attachments } = ctx.request.body;

    try {
      const result = await strapi
        .service("api::email.enhanced-email")
        .sendBulk({
          to,
          subject,
          html,
          attachments,
        });

      ctx.body = result;
    } catch (error) {
      ctx.throw(400, error.message);
    }
  },
};
