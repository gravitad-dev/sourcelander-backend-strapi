export default {
  routes: [
    {
      method: "GET",
      path: "/search/freelancers",
      handler: "search.find",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
