import { Hono } from "hono";
import { useRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";

const app = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
}>();

app.route("/api/vi/user", useRouter);
app.route("/api/vi/blog", blogRouter);

export default app;
