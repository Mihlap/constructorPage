import request from "supertest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createApp } from "../src/app";

const app = createApp();

const makeUser = () => ({
  email: `u_${Math.random().toString(16).slice(2)}_${Date.now()}@test.local`,
  password: "password1234"
});

const makeSchema = (headingText: string) => ({
  root: {
    id: "root",
    type: "container",
    props: { layout: "stack" },
    children: [
      {
        id: "b_heading",
        type: "heading",
        props: { text: headingText },
        children: []
      }
    ]
  }
});

describe("Page Builder backend (MVP)", () => {
  it("should reject protected endpoints without token", async () => {
    if (!(globalThis as any).__PB_DB_AVAILABLE__) return;
    const res = await request(app).post("/api/pages").send({ title: "Test" });
    expect(res.status).toBe(401);
  });

  it("auth -> pages draft -> publish -> public preview works", async () => {
    if (!(globalThis as any).__PB_DB_AVAILABLE__) return;
    const user = makeUser();

    const reg = await request(app).post("/api/auth/register").send(user);
    expect(reg.status).toBe(201);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app).post("/api/auth/login").send(user);
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();

    const create = await request(app)
      .post("/api/pages")
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({ title: "Магазин пиццы" });
    expect(create.status).toBe(201);
    const pageId: string = create.body.pageId;
    expect(create.body.schemaJson).toBeTruthy();

    const saved = await request(app)
      .post(`/api/pages/${pageId}/draft`)
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({ schemaJson: makeSchema("Hello MVP") });
    expect(saved.status).toBe(200);
    expect(saved.body.schemaJson.root.children[0].props.text).toBe("Hello MVP");

    const publish = await request(app)
      .post(`/api/pages/${pageId}/publish`)
      .set("Authorization", `Bearer ${reg.body.token}`)
      .send({});
    expect(publish.status).toBe(200);
    expect(publish.body.slug).toBeTruthy();
    expect(publish.body.schemaJson.root.children[0].props.text).toBe("Hello MVP");

    const pub = await request(app).get(`/api/public/pages/${publish.body.slug}`);
    expect(pub.status).toBe(200);
    expect(pub.body.schemaJson.root.children[0].props.text).toBe("Hello MVP");
  });

  it("should upload media locally and serve it publicly", async () => {
    if (!(globalThis as any).__PB_DB_AVAILABLE__) return;
    const user = makeUser();
    const reg = await request(app).post("/api/auth/register").send(user);
    const token = reg.body.token as string;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pb-media-"));
    const filePath = path.join(tmpDir, `${Math.random().toString(16).slice(2)}.png`);
    await fs.writeFile(filePath, Buffer.from("not-a-real-png-but-ok"));

    const up = await request(app)
      .post("/api/media")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", filePath);
    expect(up.status).toBe(201);
    expect(up.body.asset.id).toBeTruthy();

    const get = await request(app).get(`/api/media/${up.body.asset.id}`);
    expect(get.status).toBe(200);
  });
});

