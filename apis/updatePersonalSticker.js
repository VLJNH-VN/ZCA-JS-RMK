import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { apiFactory } from "../utils.js";

export const updatePersonalStickerFactory = apiFactory()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.sticker[0]}/api/message/sticker/personalized/update`);

    /**
     * Đồng bộ danh sách sticker cá nhân theo version
     *
     * @param cateIds Mảng category ID (number[] | string[] | number)
     * @param version Version hiện tại của sticker cá nhân
     *
     * @throws {ZaloApiError}
     */
    return async function updatePersonalSticker(cateIds, version = 0) {
        let ids = [];
        if (Array.isArray(cateIds)) {
            ids = cateIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));
        } else if (cateIds !== undefined && cateIds !== null) {
            const parsed = parseInt(cateIds);
            if (!isNaN(parsed)) ids = [parsed];
        }

        const params = {
            version,
            sticker_cates: ids,
            imei: ctx.imei,
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(params));
        if (!encryptedParams)
            throw new ZaloApiError("Failed to encrypt params");

        const response = await utils.request(utils.makeURL(serviceURL, { params: encryptedParams }), {
            method: "GET",
        });
        return utils.resolve(response);
    };
});
