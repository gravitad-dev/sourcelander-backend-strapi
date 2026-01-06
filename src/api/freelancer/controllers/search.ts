export default {
  async search(ctx) {
    const { query, page = 1, source } = ctx.request.query;

    const filters: any = {};
    if (query) {
      filters.$or = [
        { query: { $containsi: query } },
        { name: { $containsi: query } },
        { skills: { $containsi: query } },
      ];
    }
    if (source) {
      filters.source = source;
    }

    const limit = 20;
    const offset = ((page as number) - 1) * limit;

    try {
      const [freelancers, total] = await Promise.all([
        strapi.entityService.findMany(
          "api::cached-freelancer.cached-freelancer" as any,
          {
            filters,
            limit,
            start: offset,
            sort: { scrapedAt: "desc" },
          },
        ),
        strapi.entityService.count(
          "api::cached-freelancer.cached-freelancer" as any,
          { filters },
        ),
      ]);

      ctx.body = {
        success: true,
        data: freelancers.map((f: any) => ({
          id: f.sourceId,
          name: f.name,
          title: f.title,
          description: f.description,
          profileUrl: f.profileUrl,
          profileImageUrl: f.avatar,
          country: f.country,
          hourlyRate: f.hourlyRate ? `$${f.hourlyRate}/hr` : "",
          skills: f.skills || [],
          rating: f.rating,
          projectsCompleted: f.projectsCompleted,
        })),
        meta: {
          total,
          page: Number(page),
          pageSize: limit,
          pageCount: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      ctx.throw(500, error.message);
    }
  },
};
