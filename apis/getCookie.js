import { apiFactory } from "../utils.js";
export const getCookieFactory = apiFactory()((_, ctx) => {
    /**
     * Get the zpw_sek cookie in "zpw_sek=value" format
     */
    return async function getCookie() {
        const cookieString = await ctx.cookie.getCookieString("https://chat.zalo.me");
        const match = cookieString.match(/(?:^|;\s*)(zpw_sek=[^;]+)/);
        return match ? match[1].trim() : cookieString;
    };
});
