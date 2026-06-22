# TAD-PAK Sanity Studio

Content + sellable catalog for TAD-PAK (project `7sxkke45`, dataset `production`).

Schemas: `deviceType` (sellable device catalog, maps to app via `deviceTypeId`), `accessory`
(maps via `accessoryId`). CMS doc types (page, blog, solution, testimonial, navLink) to be added.

## Run / deploy
```bash
pnpm install
# auth: either `npx sanity login`, or set a deploy token
export SANITY_AUTH_TOKEN=<deploy token from /.env.sanity>
pnpm run dev            # local studio at http://localhost:3333
pnpm run deploy         # deploy hosted studio
pnpm run schema:deploy  # deploy the schema (enables typed queries)
```

The catalog was seeded directly via the content API (10 device types + 5 accessories); this Studio
is the editing UI on top of that data. `.gitignore`d: `node_modules`, `dist`, `.sanity`, `.env*.local`.
