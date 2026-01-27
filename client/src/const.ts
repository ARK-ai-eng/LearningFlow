export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Optional returnTo parameter to redirect back after login
export const getLoginUrl = (returnTo?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Callback URL ohne Query-Parameter - returnTo wird im state kodiert
  const callbackUrl = `${window.location.origin}/api/oauth/callback`;
  
  // State enthält sowohl die callbackUrl als auch optional returnTo
  const stateData = {
    callbackUrl,
    returnTo: returnTo || null
  };
  const state = btoa(JSON.stringify(stateData));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", callbackUrl);
  url.searchParams.set("state", state);

  return url.toString();
};
