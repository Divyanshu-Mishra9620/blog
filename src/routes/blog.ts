import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const jwt = c.req.header("Authorization");
  if (!jwt) {
    return c.json({ error: "unauthorized" }, 401);
  }

  const token = jwt.split(" ")[1];
  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    //@ts-ignore
    c.set("userId", payload.id);
    await next();
  } catch (err) {
    console.error("JWT Error:", err);
    return c.json({ error: "invalid token" }, 403);
  }
});

blogRouter.post("/", async (c) => {
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: userId,
        published: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        name: post.author?.name || "Anonymous",
      },
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return c.json({ error: "failed to create post" }, 500);
  }
});

blogRouter.put("/", async (c) => {
  const userId = c.get("userId");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const post = await prisma.post.update({
      where: {
        id: body.id,
        authorId: userId,
      },
      data: {
        title: body.title,
        content: body.content,
        published: body.published,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
      },
    });

    return c.json(post);
  } catch (err) {
    console.error("Error updating post:", err);
    return c.json({ error: "post not found or unauthorized" }, 404);
  }
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        content: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    return c.json({
      posts: posts.map((post) => ({
        ...post,
        author: {
          name: post.author?.name || "Anonymous",
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return c.json({ error: "failed to fetch posts" }, 500);
  }
});

blogRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const post = await prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        published: true,
        author: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!post) {
      return c.json({ error: "post not found" }, 404);
    }

    return c.json({
      ...post,
      author: {
        name: post.author?.name || "Anonymous",
      },
    });
  } catch (err) {
    console.error("Error fetching post:", err);
    return c.json({ error: "failed to fetch post" }, 500);
  }
});
