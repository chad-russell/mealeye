import "server-only";

import createClient from "openapi-fetch";
import type { paths } from "../types/openapi-generated";

export const API_BASE = "https://mealie.crussell.io";

export const MEALIE_API_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb25nX3Rva2VuIjp0cnVlLCJpZCI6ImVkOGU2MDdiLTU5ODQtNDBkNC04ZGFmLTA3MjU2ZjEwNmUxOSIsIm5hbWUiOiJtZWFsZXllIiwiaW50ZWdyYXRpb25faWQiOiJnZW5lcmljIiwiZXhwIjoxODk4ODc0MTEzfQ.pgMrapOfHC1LGEcf8J_54xf3bLP9YAeKLIWKQu2E3rM";

export const client = createClient<paths>({
  baseUrl: API_BASE,
  headers: {
    Authorization: `Bearer ${MEALIE_API_KEY}`,
  },
});
