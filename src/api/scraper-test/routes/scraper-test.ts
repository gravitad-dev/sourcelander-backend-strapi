export default {
  routes: [
    {
      method: "GET",
      path: "/scraper-test",
      handler: "scraper-test.test",
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
