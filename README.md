# zca-js-rmk
#Đây là phiên bản rmk lại từ zca-js, đã fix và update 1 số tính năng
> Thư viện Zalo API không chính thức dành cho Node.js — gửi/nhận tin nhắn, quản lý nhóm, bạn bè và nhiều tính năng khác qua WebSocket.

---

## Mục lục

- [Cài đặt](#cài-đặt)
- [Yêu cầu](#yêu-cầu)
- [Đăng nhập](#đăng-nhập)
  - [Đăng nhập bằng Cookie](#đăng-nhập-bằng-cookie)
  - [Đăng nhập bằng QR](#đăng-nhập-bằng-qr)
- [Lắng nghe sự kiện](#lắng-nghe-sự-kiện)
- [API Reference](#api-reference)
  - [Tin nhắn](#tin-nhắn)
  - [File & Media](#file--media)
  - [Bạn bè](#bạn-bè)
  - [Nhóm](#nhóm)
  - [Tài khoản & Cài đặt](#tài-khoản--cài-đặt)
  - [Thăm dò ý kiến (Poll)](#thăm-dò-ý-kiến-poll)
  - [Ghi chú & Nhắc nhở](#ghi-chú--nhắc-nhở)
  - [Hội thoại & Nhãn](#hội-thoại--nhãn)
  - [Sticker](#sticker)
  - [Tiện ích khác](#tiện-ích-khác)
- [Models / Kiểu dữ liệu](#models--kiểu-dữ-liệu)
- [Hằng số](#hằng-số)
- [Alias tương thích ngược](#alias-tương-thích-ngược)
- [License](#license)

---

## Cài đặt

```bash
npm install zca-js-rmk
```

> **Yêu cầu Node.js ≥ 18** và `"type": "module"` trong `package.json` của bạn (ESM).

---

## Yêu cầu

| Trường | Mô tả |
|--------|-------|
| `cookie` | Cookie Zalo (string, array, hoặc `CookieJar`) |
| `imei` | IMEI thiết bị (lấy từ trình duyệt / app) |
| `userAgent` | User-Agent trình duyệt tương ứng với cookie |

---

## Đăng nhập

### Đăng nhập bằng Cookie

```js
import { ZCAJSRMK } from "zca-js-rmk";

const zalo = new ZCARMK();

const api = await zalo.login({
    imei: "your-imei",
    cookie: "your-cookie-string", // hoặc array object, hoặc CookieJar
    userAgent: "Mozilla/5.0 ...",
    language: "vi", // tuỳ chọn, mặc định "vi"
});

console.log("UID:", await api.getOwnId());
```

Cũng hỗ trợ **array cookie** (định dạng Netscape / EditThisCookie):

```js
const api = await zalo.login({
    imei: "your-imei",
    cookie: [
        { name: "zpw_sek", value: "abc123", domain: ".zalo.me" },
        { name: "zpsid",   value: "xyz789", domain: ".zalo.me" },
        // ...
    ],
    userAgent: "Mozilla/5.0 ...",
});
```

---

### Đăng nhập bằng QR

```js
import { ZCAJSRMK } from "zca-js-rmk";
import qrcode from "qrcode-terminal";

const zalo = new ZCARMK();

const api = await zalo.loginQR({}, (qrData) => {
    qrcode.generate(qrData.data, { small: true });
    console.log("Quét QR bằng app Zalo để đăng nhập");
});

console.log("Đăng nhập thành công! UID:", await api.getOwnId());
```

---

## Lắng nghe sự kiện

```js
const listener = api.listen();

listener.on("message", (msg) => {
    console.log(`[${msg.isGroup ? "Nhóm" : "Riêng"}] ${msg.data.content}`);

    // Trả lời tin nhắn
    api.sendMessage(
        { msg: "Xin chào!" },
        msg.threadId,
        msg.type
    );
});

listener.on("group_event", (event) => {
    console.log("Sự kiện nhóm:", event.data.act_type);
});

listener.on("reaction",       (data) => { /* phản cảm xúc */ });
listener.on("seen",           (data) => { /* đã xem */ });
listener.on("delivered",      (data) => { /* đã nhận */ });
listener.on("undo",           (data) => { /* thu hồi */ });
listener.on("typing",         (data) => { /* đang nhập */ });
listener.on("friend_event",   (data) => { /* kết bạn / xoá bạn */ });
listener.on("unknown",        (data) => { /* sự kiện khác */ });
listener.on("unknown_control",(data) => { /* control event (VOIP, v.v.) */ });
listener.on("error",          (err)  => { console.error(err); });
listener.on("close",          ()     => { console.log("WebSocket đóng"); });

listener.start();
```

---

## API Reference

> Tất cả phương thức đều **async** và trả về `Promise`.  
> `threadType` nhận giá trị `ThreadType.User` (0) hoặc `ThreadType.Group` (1).

---

### Tin nhắn

#### `sendMessage(content, threadId, threadType)`

Gửi tin nhắn văn bản.

```js
// Văn bản đơn giản
await api.sendMessage({ msg: "Hello!" }, threadId, ThreadType.Group);

// Kèm quote (trích dẫn)
await api.sendMessage(
    { msg: "Reply nè", attachments: [], quote: msgObject },
    threadId,
    ThreadType.Group
);

// Mention thành viên
await api.sendMessage(
    { msg: "@Tên người dùng", mentions: [{ uid: "userId", pos: 0, len: 13 }] },
    threadId,
    ThreadType.Group
);
```

#### `sendMessagePrivate(content, userId)`

Gửi tin nhắn riêng tư (1-1).

```js
await api.sendMessagePrivate({ msg: "Hi bạn!" }, userId);
```

#### `sendLink(linkData, threadId, threadType)`

Gửi tin nhắn dạng link preview.

```js
await api.sendLink(
    { url: "https://example.com", title: "Example", thumbnail: "https://..." },
    threadId,
    ThreadType.Group
);
```

#### `forwardMessage(message, threadId, threadType)`

Chuyển tiếp tin nhắn.

#### `deleteMessage(msgId, threadId, threadType, onlyMe?)`

Xoá tin nhắn (chỉ mình xem hoặc xoá với mọi người).

#### `undo(msgId, threadId, threadType)` · alias: `undoMessage`

Thu hồi tin nhắn đã gửi.

#### `sendTypingEvent(threadId, threadType)`

Gửi sự kiện "đang nhập".

#### `sendSeenEvent(msgId, threadId, threadType)`

Đánh dấu đã xem tin nhắn.

#### `sendDeliveredEvent(msgId, senderId, clientMsgId)`

Gửi sự kiện đã nhận.

#### `addReaction(msgId, emoji, threadId, threadType)`

Thêm/đổi reaction cho tin nhắn.

```js
await api.addReaction(msgId, "❤️", threadId, ThreadType.Group);
```

---

### File & Media

#### `sendImage(imageData, threadId, threadType)`

Gửi ảnh.

```js
import { readFileSync } from "fs";

await api.sendImage(
    { data: readFileSync("image.jpg"), fileName: "image.jpg" },
    threadId,
    ThreadType.Group
);
// Hoặc URL
await api.sendImage({ url: "https://example.com/img.jpg" }, threadId, ThreadType.Group);
```

#### `sendGif(gifData, threadId, threadType)`

Gửi GIF.

#### `sendVideo(videoData, threadId, threadType)`

Gửi video.

#### `sendVoice(voiceData, threadId, threadType)` · alias: `sendVoiceUnified`

Gửi tin nhắn thoại.

#### `sendFile(filePath, threadId, threadType)`

Gửi file bất kỳ.

```js
await api.sendFile("document.pdf", threadId, ThreadType.Group);
```

#### `sendSticker(stickerId, stickerType, threadId, threadType)`

Gửi sticker mặc định.

#### `sendCustomSticker(stickerData, threadId, threadType)`

Gửi sticker tuỳ chỉnh.

#### `sendCard(cardData, threadId, threadType)`

Gửi danh thiếp người dùng.

#### `sendBankCard(cardData, threadId, threadType)`

Gửi thông tin thẻ ngân hàng.

#### `uploadAttachment(filePath, threadId, threadType)`

Upload file đính kèm và trả về URL, dùng để gửi media thông qua URL.

#### `uploadThumbnail(imagePath)`

Upload ảnh thumbnail.

---

### Bạn bè

#### `getAllFriends()`

Lấy danh sách tất cả bạn bè.

```js
const friends = await api.getAllFriends();
console.log(friends); // [{ uid, zaloName, ... }, ...]
```

#### `getUserInfo(userId)` / `getMultiUsersByPhones(phones)`

Lấy thông tin người dùng.

#### `findUser(phone)` / `findUserByUsername(username)`

Tìm người dùng theo số điện thoại hoặc username.

#### `sendFriendRequest(userId, msg?)`

Gửi lời mời kết bạn.

#### `acceptFriendRequest(userId)`

Chấp nhận lời mời kết bạn.

#### `rejectFriendRequest(userId)`

Từ chối lời mời kết bạn.

#### `undoFriendRequest(userId)`

Thu hồi lời mời kết bạn đã gửi.

#### `removeFriend(userId)`

Xoá bạn bè.

#### `getSentFriendRequest()`

Lấy danh sách lời mời đã gửi.

#### `getFriendRequestStatus(userId)`

Kiểm tra trạng thái lời mời kết bạn.

#### `getCloseFriends()`

Lấy danh sách bạn thân.

#### `getFriendOnlines()`

Lấy trạng thái online của bạn bè.

#### `lastOnline(userId)`

Kiểm tra lần cuối online của người dùng.

#### `blockUser(userId)` / `unblockUser(userId)`

Chặn / bỏ chặn người dùng.

#### `changeFriendAlias(userId, alias)` / `removeFriendAlias(userId)`

Đặt / xoá biệt danh bạn bè.

#### `getAliasList()`

Lấy danh sách biệt danh đã đặt.

#### `inviteUserToGroups(userId, groupIds)`

Mời người dùng vào nhiều nhóm cùng lúc.

#### `getFriendBoardList()` / `getFriendRecommendations()`

Lấy bảng tin bạn bè / đề xuất kết bạn.

---

### Nhóm

#### `getAllGroups()`

Lấy danh sách tất cả nhóm.

```js
const { gridVerMap } = await api.getAllGroups();
const groupIds = Object.keys(gridVerMap);
```

#### `getGroupInfo(groupId)`

Lấy thông tin nhóm.

#### `createGroup(name, userIds)`

Tạo nhóm mới.

```js
const group = await api.createGroup("Tên nhóm", ["uid1", "uid2"]);
```

#### `addUserToGroup(userId, groupId)` / `removeUserFromGroup(userId, groupId)`

Thêm / xoá thành viên khỏi nhóm.

#### `leaveGroup(groupId)` / `disperseGroup(groupId)`

Rời nhóm / giải tán nhóm.

#### `changeGroupName(name, groupId)`

Đổi tên nhóm.

#### `changeGroupAvatar(imagePath, groupId)`

Đổi ảnh đại diện nhóm.

#### `changeGroupOwner(newOwnerId, groupId)`

Chuyển quyền trưởng nhóm.

#### `addGroupAdmins(userIds, groupId)` / `removeGroupAdmins(userIds, groupId)`

Thêm / xoá phó nhóm.

#### `addGroupDeputy(userId, groupId)` / `removeGroupDeputy(userId, groupId)`

Thêm / xoá phó nhóm (cấp 2).

#### `getGroupMembersInfo(groupId)` · alias: `getGroupMembers`

Lấy danh sách thành viên nhóm.

#### `getPendingGroupMembers(groupId)` · alias: `getGroupMembersJoinRequest`

Lấy danh sách thành viên chờ duyệt.

#### `reviewPendingMemberRequest(action, memberIds, groupId)` · alias: `handleGroupPendingMembers`

Duyệt hoặc từ chối thành viên chờ.

```js
// action: "ACCEPT" | "DENY"
await api.reviewPendingMemberRequest("ACCEPT", ["uid1"], groupId);
```

#### `updateGroupSettings(settings, groupId)` · alias: `changeGroupSetting`

Cập nhật cài đặt nhóm.

#### `getGroupChatHistory(groupId, count?)`

Lấy lịch sử chat nhóm.

#### `blockUsersInGroup(userIds, groupId)` · alias: `blockUsers`

Chặn thành viên trong nhóm.

#### `unblockUsersInGroup(userIds, groupId)` · alias: `unblockUsers`

Bỏ chặn thành viên trong nhóm.

#### `addGroupBlockedMember(userId, groupId)` / `removeGroupBlockedMember(userId, groupId)`

Thêm / xoá khỏi danh sách chặn nhóm.

#### `getGroupBlockedMember(groupId)`

Lấy danh sách thành viên bị chặn.

#### `enableGroupLink(groupId)` / `disableGroupLink(groupId)`

Bật / tắt link tham gia nhóm.

#### `changeGroupLink(groupId)` / `getGroupLinkInfo(groupId)` / `getGroupLinkDetail(groupId)`

Quản lý link nhóm.

#### `joinGroupLink(link)` · alias: `joinGroupByLink` / `joinGroup`

Tham gia nhóm qua link.

```js
await api.joinGroupLink("https://zalo.me/g/xxxxxx");
```

#### `handleGroupInvite(action, inviteId)`

Chấp nhận / từ chối lời mời vào nhóm.

#### `getGroupInvites()`

Lấy danh sách lời mời nhóm.

#### `upgradeGroupToCommunity(groupId)`

Nâng cấp nhóm lên Community.

#### `rejectGroupCall(callId, groupId, null, callType)`

Từ chối cuộc gọi nhóm.

---

### Tài khoản & Cài đặt

#### `fetchAccountInfo()`

Lấy thông tin tài khoản hiện tại.

#### `getOwnId()`

Lấy UID của tài khoản đang đăng nhập.

#### `updateProfile(profileData)`

Cập nhật thông tin hồ sơ.

#### `updateProfileBio(bio)`

Cập nhật tiểu sử.

#### `changeAccountAvatar(imagePath)` / `deleteAvatar()` / `reuseAvatar(avatarId)`

Quản lý ảnh đại diện.

#### `getAvatarList()` / `getAvatarUrlProfile(userId)`

Xem danh sách / URL ảnh đại diện.

#### `getSettings()` / `updateSettings(settings)`

Lấy / cập nhật cài đặt tài khoản.

#### `updateLang(lang)`

Đổi ngôn ngữ (`"vi"`, `"en"`, ...).

#### `updateActiveStatus(status)`

Cập nhật trạng thái hoạt động.

#### `setMute(threadId, threadType, duration)` / `getMute()`

Tắt thông báo hội thoại.

#### `getContext()`

Lấy context hiện tại (uid, imei, secretKey, ...).

---

### Thăm dò ý kiến (Poll)

#### `createPoll(pollData, threadId)`

Tạo cuộc thăm dò.

```js
await api.createPoll(
    {
        question: "Màu yêu thích?",
        options: ["Đỏ", "Xanh", "Vàng"],
        isMultiChoices: false,
        isAnonymous: true,
    },
    groupId
);
```

#### `getPollDetail(pollId)` / `votePoll(pollId, optionIds)` / `lockPoll(pollId)` / `sharePoll(pollId, threadId, threadType)` / `addPollOptions(pollId, options)`

Quản lý poll đầy đủ.

---

### Ghi chú & Nhắc nhở

#### `createNote(content, groupId)` / `editNote(noteId, content, groupId)` / `getListBoard()` / `getFriendBoardList()`

Quản lý ghi chú nhóm / bảng.

#### `createReminder(data)` / `editReminder(reminderId, data)` / `removeReminder(reminderId)` / `getListReminder()` / `getReminder(reminderId)` / `getReminderResponses(reminderId)`

Quản lý nhắc nhở.

#### `sendToDo(content, threadId, threadType)`

Gửi todo item.

---

### Hội thoại & Nhãn

#### `getRecentMessage()`

Lấy danh sách hội thoại gần đây.

#### `setHiddenConversations(threadIds)` / `getHiddenConversations()`

Ẩn / lấy hội thoại ẩn.

#### `setPinnedConversations(threadIds)` / `getPinConversations()`

Ghim / lấy hội thoại ghim.

#### `deleteChat(threadId, threadType)` / `deleteGroupInviteBox(inviteId)`

Xoá hội thoại.

#### `setHiddenConversations` / `getHiddenConversations`

Quản lý hội thoại ẩn.

#### `updateLabels(labels)` / `getLabels()`

Quản lý nhãn hội thoại.

#### `addUnreadMark(msgId)` / `removeUnreadMark(msgId)` / `getUnreadMark()`

Đánh dấu chưa đọc.

#### `getAutoDeleteChat(threadId, threadType)` / `updateAutoDeleteChat(...)`

Cài đặt tự xoá tin nhắn.

#### `getArchivedChatList()` / `updateArchivedChatList(...)`

Quản lý hội thoại lưu trữ.

---

### Sticker

#### `getStickers(keyword)` / `getStickersDetail(stickerIds)` / `getStickerCategoryDetail(catId)` / `searchSticker(keyword)`

Tìm kiếm / lấy thông tin sticker.

#### `updatePersonalSticker(stickerIds)`

Cập nhật bộ sticker cá nhân.

---

### Tiện ích khác

#### `addQuickMessage(msg)` / `getQuickMessageList()` / `updateQuickMessage(id, msg)` / `removeQuickMessage(id)`

Quản lý tin nhắn nhanh.

#### `createAutoReply(data)` / `getAutoReplyList()` / `updateAutoReply(id, data)` / `deleteAutoReply(id)`

Quản lý tự động trả lời.

#### `getQR()` / `parseLink(link)` / `sendReport(userId, reason)`

Tiện ích khác.

#### `keepAlive()`

Giữ kết nối WebSocket luôn hoạt động.

#### `custom(name, handler)`

Đăng ký phương thức API tuỳ chỉnh.

```js
api.custom("myMethod", async ({ ctx, utils, props }) => {
    // props là tham số truyền vào khi gọi api.myMethod(props)
    return "result";
});

await api.myMethod({ foo: "bar" });
```

---

## Models / Kiểu dữ liệu

Tất cả model được export từ `zca-rmk`:

```js
import {
    Message,
    GroupEvent,
    FriendEvent,
    Reaction,
    Undo,
    Typing,
    SeenMessage,
    DeliveredMessage,
    Attachment,
    Group,
    User,
    Sticker,
    Reminder,
    AutoReply,
    QuickMessage,
    Label,
    // ...
} from "zca-js-rmk";
```

---

## Hằng số

```js
import { ThreadType, AvatarSize, BinBankCard } from "zca-js-rmk";

ThreadType.User   // 0 — hội thoại 1-1
ThreadType.Group  // 1 — nhóm

AvatarSize.Small  // 120
AvatarSize.Large  // 240

BinBankCard.Vietcombank  // 970436
BinBankCard.BIDV         // 970418
BinBankCard.Agribank     // 970405
// ...
```

---

## Alias tương thích ngược

Các tên cũ vẫn hoạt động đầy đủ:

| Tên cũ | Trỏ tới |
|--------|---------|
| `undoMessage` | `undo` |
| `changeGroupSetting` | `updateGroupSettings` |
| `getGroupMembers` | `getGroupMembersInfo` |
| `getGroupMembersJoinRequest` | `getPendingGroupMembers` |
| `handleGroupPendingMembers` | `reviewPendingMemberRequest` |
| `joinGroupByLink` / `joinGroup` | `joinGroupLink` |
| `blockUsers` | `blockUsersInGroup` |
| `unblockUsers` | `unblockUsersInGroup` |
| `sendVoiceUnified` | `sendVoice` |

---

## Ví dụ hoàn chỉnh

```js
import { ZCARMK, ThreadType } from "zca-js-rmk";

const zalo = new ZCARMK({ selfListen: false, logging: false });

const api = await zalo.login({
    imei: process.env.IMEI,
    cookie: process.env.COOKIE,
    userAgent: process.env.USER_AGENT,
});

const listener = api.listen();

listener.on("message", async (msg) => {
    if (msg.isSelf) return;

    const { content } = msg.data;
    const { threadId, type } = msg;

    if (content === "!id") {
        await api.sendMessage({ msg: `Thread ID: ${threadId}` }, threadId, type);
    }

    if (content === "!uid") {
        const uid = await api.getOwnId();
        await api.sendMessage({ msg: `UID của tôi: ${uid}` }, threadId, type);
    }
});

listener.on("error", console.error);
listener.start();
console.log("Bot đang chạy...");
```

---

## License

MIT © [zca-js-rmk contributors](https://github.com/VLJNH-VN/ZCA-JS-RMK.git)

---

> **Lưu ý:** Đây là thư viện không chính thức. Việc sử dụng phải tuân thủ [Điều khoản dịch vụ của Zalo](https://zalo.me/terms). Tác giả không chịu trách nhiệm về bất kỳ hậu quả nào phát sinh từ việc sử dụng thư viện này.
