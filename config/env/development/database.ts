import path from "path";

export default ({ env }) => ({
  connection: {
    client: "sqlite",
    connection: {
      // keep the DB OUTSIDE dist/, and ensure it's exactly the env path
      filename: env("DATABASE_FILENAME", path.join(process.cwd(), ".tmp/dev.db")),
    },
    useNullAsDefault: true,
  },
});
