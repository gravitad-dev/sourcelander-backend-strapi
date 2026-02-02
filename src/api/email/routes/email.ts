export default {
  routes: [
    {
      method: "POST",
      path: "/email/send",
      handler: "email.send",
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: "POST",
      path: "/email/send-bulk",
      handler: "email.sendBulk",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
