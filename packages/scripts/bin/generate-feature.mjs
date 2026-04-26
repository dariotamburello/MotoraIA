#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const PACKAGE_DIR = dirname(__filename);
const REPO_ROOT = resolve(PACKAGE_DIR, "..", "..", "..");
const FUNCTIONS_SRC = resolve(REPO_ROOT, "functions", "src");

const ALLOWED_TYPES = ["CRUD", "AI", "Webhook"];

function parseArgs(argv) {
  const args = { name: null, type: null };
  for (const arg of argv) {
    if (arg.startsWith("--name=")) args.name = arg.slice("--name=".length);
    else if (arg.startsWith("--type=")) args.type = arg.slice("--type=".length);
  }
  return args;
}

function pascalCase(input) {
  return input
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
}

function camelCase(input) {
  const pc = pascalCase(input);
  return pc[0].toLowerCase() + pc.slice(1);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function writeIfMissing(path, contents) {
  if (existsSync(path)) {
    console.error(`✖ Ya existe: ${path} — abortando para no sobrescribir.`);
    process.exit(2);
  }
  ensureDir(dirname(path));
  writeFileSync(path, contents, "utf8");
  console.log(`✓ Creado: ${path}`);
}

function controllerTemplate(pascal, camel, type) {
  return `import { onCall } from "firebase-functions/v2/https";
import { assertAuth } from "../../shared/assertAuth.js";
import { ${camel}Service } from "../../services/${camel}/${camel}Service.js";

/**
 * ${pascal} controller (${type}).
 * Generado por @motora/scripts — refinar antes de deploy.
 */
export const ${camel}Controller = onCall({ region: "us-central1" }, async (request) => {
  const uid = assertAuth(request);
  const data = request.data;
  return await ${camel}Service.handle(uid, data);
});
`;
}

function controllerTestTemplate(pascal, camel) {
  return `// ${pascal}Controller test — completar
describe("${camel}Controller", () => {
  test.todo("validates auth and delegates to service");
});
`;
}

function serviceBarrelTemplate(camel) {
  return `export { ${camel}Service } from "./${camel}Service.js";
`;
}

function serviceTemplate(pascal, camel, type) {
  if (type === "CRUD") {
    return `// ${pascal}Service — CRUD scaffold
export const ${camel}Service = {
  async create(uid: string, data: unknown): Promise<unknown> {
    void uid;
    void data;
    throw new Error("not implemented");
  },
  async read(uid: string, id: string): Promise<unknown> {
    void uid;
    void id;
    throw new Error("not implemented");
  },
  async update(uid: string, id: string, data: unknown): Promise<unknown> {
    void uid;
    void id;
    void data;
    throw new Error("not implemented");
  },
  async delete(uid: string, id: string): Promise<void> {
    void uid;
    void id;
    throw new Error("not implemented");
  },
  async handle(uid: string, data: unknown): Promise<unknown> {
    void uid;
    void data;
    throw new Error("not implemented");
  },
};
`;
  }
  if (type === "AI") {
    return `// ${pascal}Service — AI scaffold (PREMIUM tier required)
export const ${camel}Service = {
  async handle(uid: string, data: unknown): Promise<unknown> {
    void uid;
    void data;
    throw new Error("not implemented — verifica subscriptionTier === PREMIUM antes de invocar el modelo");
  },
};
`;
  }
  return `// ${pascal}Service — Webhook scaffold
export const ${camel}Service = {
  async handle(uid: string, data: unknown): Promise<unknown> {
    void uid;
    void data;
    throw new Error("not implemented");
  },
};
`;
}

function serviceTestTemplate(pascal, camel) {
  return `// ${pascal}Service test — completar
describe("${camel}Service", () => {
  test.todo("covers happy path and edge cases");
});
`;
}

function main() {
  const { name, type } = parseArgs(process.argv.slice(2));
  if (!name) {
    console.error("Uso: pnpm run generate:feature --name=<feature> --type=CRUD|AI|Webhook");
    process.exit(1);
  }
  if (!type || !ALLOWED_TYPES.includes(type)) {
    console.error(`--type debe ser uno de: ${ALLOWED_TYPES.join(", ")}`);
    process.exit(1);
  }

  const pascal = pascalCase(name);
  const camel = camelCase(name);

  const targets = [
    {
      path: resolve(FUNCTIONS_SRC, "controllers", camel, `${camel}Controller.ts`),
      content: controllerTemplate(pascal, camel, type),
    },
    {
      path: resolve(FUNCTIONS_SRC, "controllers", camel, `${camel}Controller.test.ts`),
      content: controllerTestTemplate(pascal, camel),
    },
    {
      path: resolve(FUNCTIONS_SRC, "services", camel, "index.ts"),
      content: serviceBarrelTemplate(camel),
    },
    {
      path: resolve(FUNCTIONS_SRC, "services", camel, `${camel}Service.ts`),
      content: serviceTemplate(pascal, camel, type),
    },
    {
      path: resolve(FUNCTIONS_SRC, "services", camel, `${camel}Service.test.ts`),
      content: serviceTestTemplate(pascal, camel),
    },
  ];

  for (const t of targets) {
    writeIfMissing(t.path, t.content);
  }

  console.log(`\n✔ Feature "${pascal}" (${type}) generada en functions/src/`);
}

main();
