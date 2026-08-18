import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer reads the connection string from schema.prisma, and it
// does not load .env on its own - hence the dotenv import above.
export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
