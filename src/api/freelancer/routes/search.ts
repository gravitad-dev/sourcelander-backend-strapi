export default {
  routes: [
    {
      method: "GET",
      path: "/freelancers/search",
      handler: "search.search",
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
