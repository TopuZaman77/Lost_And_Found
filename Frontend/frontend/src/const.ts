export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export function isSafeInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//");
}

export function getLoginPath(nextPath = "/") {
  const safePath = isSafeInternalPath(nextPath) ? nextPath : "/";
  return `/login?next=${encodeURIComponent(safePath)}`;
}
