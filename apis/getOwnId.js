import { apiFactory } from "../utils.js";
import { appContext } from "../context.js";
export const getOwnIdFactory = apiFactory()((_, ctx) => {
    return () => ctx.uid;
});
export function getOwnId() {
    return appContext.uid;
}
