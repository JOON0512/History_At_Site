import { identityHandlers } from "../_shared/identity-handler.ts";
import { settings } from "../_shared/settings.ts";
declare const Deno: {
  serve(handler: (request: Request) => Promise<Response>): void;
};
Deno.serve(identityHandlers(settings()).session);
