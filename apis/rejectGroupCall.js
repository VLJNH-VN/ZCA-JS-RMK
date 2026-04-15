import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export const rejectGroupCallFactory = apiFactory()((api, ctx, utils) => {
    const baseUrl = api.zpwServiceMap.voice_call?.[0] || "https://voicecall-wpa.chat.zalo.me";

    /**
     * Từ chối / kết thúc một cuộc gọi nhóm qua voicecall-wpa
     * Endpoint pattern lấy từ Zalo Python API: /api/voicecall/group/
     */
    return async function rejectGroupCall(callId, groupId, convKey = null, callType = 1) {
        if (!callId) throw new ZaloApiError("callId is required to reject a group call");

        const baseParams = {
            callId:      String(callId),
            groupId:     groupId ? String(groupId) : undefined,
            callType:    callType,
            imei:        ctx.imei,
            action:      "reject",
        };
        if (convKey) baseParams.convKey = convKey;

        // Endpoints theo pattern /api/voicecall/group/ (từ Zalo Python API)
        const endpoints = [
            `${baseUrl}/api/voicecall/group/rejectcall`,
            `${baseUrl}/api/voicecall/group/endcall`,
            `${baseUrl}/api/voicecall/group/cancelcall`,
            `${baseUrl}/api/voicecall/group/leavecall`,
            `${baseUrl}/api/voicecall/group/reject`,
            `${baseUrl}/api/voicecall/group/end`,
        ];

        // voicecall API dùng zpw_ver=667, zpw_type=24
        const VOIP_QS = { zpw_ver: "667", zpw_type: "24" };

        let lastErr = null;
        for (const url of endpoints) {
            try {
                const encryptedParams = utils.encodeAES(JSON.stringify(baseParams));
                if (!encryptedParams) continue;
                const response = await utils.request(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({
                        ...VOIP_QS,
                        params: encryptedParams,
                    }),
                });
                const result = await utils.resolve(response);
                return result;
            } catch (e) {
                lastErr = e;
            }
        }

        throw lastErr || new ZaloApiError("All rejectGroupCall endpoints failed");
    };
});
