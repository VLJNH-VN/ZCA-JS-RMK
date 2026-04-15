import { getServerInfo, login } from "./apis/login.js";
import { appContext } from "./context.js";
import { logger } from "./utils.js";
import { CookieJar, Cookie } from "tough-cookie";
import { checkUpdate } from "./update.js";
import { API } from "./apis.js";

class ZCARMK {
  constructor(options = {}) {
    this.options = options;
    this.enableEncryptParam = true;
    if (options) Object.assign(appContext.options, options);
  }

  parseCookies(cookie) {
    if (typeof cookie === "string") return cookie;
    const cookieArr = Array.isArray(cookie) ? cookie : cookie.cookies;
    const cookieString = cookieArr.map((c) => `${c.name || c.key}=${c.value}`).join("; ");
    return cookieString;
  }

  validateParams(credentials) {
    if (!credentials.imei || !credentials.cookie || !credentials.userAgent) {
      throw new Error("Missing required params");
    }
  }

  async login(credentials) {
    this.validateParams(credentials);
    appContext.imei = credentials.imei;

    if (credentials.cookie instanceof CookieJar) {
      appContext.cookie = credentials.cookie;
    } else if (Array.isArray(credentials.cookie) && credentials.cookie.length > 0 && credentials.cookie[0].key !== undefined) {
      const jar = new CookieJar();
      const extraDomains = ["https://zalo.me", "https://chat.zalo.me", "https://id.zalo.me"];
      for (const c of credentials.cookie) {
        const cookieDomain = c.domain || "zalo.me";
        const cookieUrl = `https://${cookieDomain.replace(/^\./, "")}`;
        try {
          const cookie = new Cookie({
            key: c.key || c.name,
            value: c.value,
            domain: cookieDomain,
            path: c.path || "/",
            secure: c.secure || false,
            httpOnly: c.httpOnly || false,
          });
          await jar.setCookie(cookie, cookieUrl);
          for (const domain of extraDomains) {
            if (domain !== cookieUrl) {
              try {
                const extra = new Cookie({ key: c.key || c.name, value: c.value, domain: new URL(domain).hostname, path: "/" });
                await jar.setCookie(extra, domain);
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
      appContext.cookie = jar;
    } else {
      const cookieString = this.parseCookies(credentials.cookie);
      const jar = new CookieJar();
      for (const part of cookieString.split("; ")) {
        const eqIdx = part.indexOf("=");
        if (eqIdx < 0) continue;
        const name = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1).trim();
        try {
          for (const domain of ["https://zalo.me", "https://chat.zalo.me", "https://id.zalo.me"]) {
            const c = new Cookie({ key: name, value, domain: new URL(domain).hostname, path: "/" });
            await jar.setCookie(c, domain);
          }
        } catch (_) {}
      }
      appContext.cookie = jar;
    }

    appContext.userAgent = credentials.userAgent;
    appContext.language = credentials.language || "vi";
    appContext.timeMessage = credentials.timeMessage || 0;
    appContext.secretKey = null;

    await checkUpdate(appContext);
    const loginData = await login(this.enableEncryptParam);
    const serverInfo = await getServerInfo(this.enableEncryptParam);
    if (!loginData || !serverInfo) throw new Error("Failed to login");

    if (!loginData.data) {
      logger(appContext).error("Zalo getLoginInfo returned empty data:", JSON.stringify(loginData));
      throw new Error("Login failed: Zalo server rejected the session (error_code: " + (loginData.error_code ?? loginData.error ?? "unknown") + ")");
    }
    appContext.secretKey = loginData.data.zpw_enk;
    if (!appContext.secretKey) {
      throw new Error("Login failed: zpw_enk (session key) is missing — cookie session may have expired");
    }
    appContext.uid = loginData.data.uid;

    let uin = loginData.data.zpw_uin || loginData.data.uin;
    if (!uin) {
      const vks = [loginData.data.zfamily?.viewer_key, loginData.data.viewerkey].filter(Boolean);
      for (const vk of vks) {
        const parts = vk.split(".");
        const idPart = parts.find(p => /^\d+$/.test(p) && p.length < 12);
        if (idPart) {
          uin = idPart;
          break;
        }
      }
    }
    appContext.uin = uin;

    logger(appContext).info(`Đã đăng nhập: UID=${appContext.uid} | UIN=${appContext.uin || "Không xác định"}`);

    appContext.settings = serverInfo.setttings || serverInfo.settings;

    const rawServiceMap = loginData.data.zpw_service_map_v3 || loginData.data.zpw_service_map || loginData.data.zpwServiceMap || {};
    const zpwServiceMap = {};
    for (const [k, v] of Object.entries(rawServiceMap)) {
      zpwServiceMap[k] = Array.isArray(v) ? v : (typeof v === "string" ? v.split(",").map(s => s.trim()) : [v]);
    }

    const rawWs = loginData.data.zpw_ws || loginData.data.zpwWs || loginData.data.ws_url || [];

    return new API(appContext, zpwServiceMap, Array.isArray(rawWs) ? rawWs : [rawWs]);
  }

  async loginQR(options, callback) {
    const { loginQR: _loginQR } = await import("./apis/loginQR.js");
    const result = await _loginQR(options, callback);
    return this.login(result);
  }
}

ZCARMK.API_TYPE = 30;
ZCARMK.API_VERSION = 671;

export { ZCARMK, ZCARMK as Zalo, API };
