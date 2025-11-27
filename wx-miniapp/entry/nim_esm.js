// import { NIM, setAdapters, uniAppAdapters, V2NIMMessageService, V2NIMMessageLogUtil, V2NIMConversationService, V2NIMConst } from '../../../../dist/esm/nim'
import {
  NIM,
  setAdapters,
  wxAdapters,
  V2NIMMessageService,
  V2NIMMessageLogUtil,
  V2NIMLocalConversationService,
  V2NIMStorageService,
  V2NIMTeamService,
  V2NIMUserService,
  V2NIMFriendService,
  V2NIMSettingService,
  V2NIMAIService,
  V2NIMSubscriptionService,
  V2NIMConst
} from 'nim-web-sdk-ng/dist/esm/nim'


// 设置 wx 环境
setAdapters(wxAdapters)


/**
 * 注册了消息服务和会话服务
 *
 * 具体有哪些模块可以注入, 请参照 SDK 使用说明: https://doc.yunxin.163.com/messaging2/guide/DcyMjA1Njk?platform=client#%E6%96%B9%E5%BC%8F%E4%BA%8Cesm-%E5%BC%95%E5%85%A5
 */


/**
 * 消息模块.
 *
 * 影响 API 包含 V2NIMMessageService 下全部接口.
 */
NIM.registerService(V2NIMMessageService, 'V2NIMMessageService')


/**
 * 消息模块-消息记录相关工具类. 包含查询消息历史等功能.
 *
 * 影响 API 包含 V2NIMMessageService 的部分接口, 举例:
 *   getMessageList, getMessageListEx,
 *   getMessageListByRefers, clearHistoryMessage
 */
NIM.registerService(V2NIMMessageLogUtil, 'V2NIMMessageLogUtil')


/**
 * 消息模块-扩展功能. 包含 pin 消息, 收藏消息等功能
 *
 * 影响 API 包含 V2NIMMessageService 的部分接口, 举例:
 *   pinMessage, unpinMessage, updatePinMessage, voiceToText,
 *   getPinnedMessageList, addQuickComment, removeQuickComment, getQuickCommentList, addCollection,
 *   removeCollections, updateCollectionExtension, getCollectionListByOption,
 *   getCollectionListExByOption, searchCloudMessages, searchCloudMessagesEx
 */
// NIM.registerService(V2NIMMessageExtendUtil, 'V2NIMMessageExtendUtil')


/**
 * 消息序列化与反序列化工具
 *
 * 影响 API 包含 V2NIMMessageConverter 的全部接口.
 */
// NIM.registerService(V2NIMMessageConverter, 'V2NIMMessageConverter')


/**
 * 云端存储模块, 包含上传文件能力
 *
 * 影响 API 包含 V2NIMMessageService 的部分接口, 举例:
 *   V2NIMMessageService.sendMessage (发图片/文件类型的消息时)
 *   V2NIMMessageService.cancelMessageAttachmentUpload (取消文件消息的上传)
 *
 * 影响 API 包含 V2NIMStorageService 的全部接口.
 */
NIM.registerService(V2NIMStorageService, 'V2NIMStorageService')


/**
 * 云端会话模块.
 *
 * 影响 API 包含 V2NIMConversationService 的全部接口.
 */
// NIM.registerService(V2NIMConversationService, 'V2NIMConversationService')


/**
 * 云端会话分组模块.
 *
 * 影响 API 包含 V2NIMConversationGroupService 的全部接口.
 */
// NIM.registerService(V2NIMConversationGroupService, 'V2NIMConversationGroupService')


/**
 * 本地会话模块.
 *
 * 影响 API 包含 V2NIMLocalConversationService 的全部接口.
 */
NIM.registerService(V2NIMLocalConversationService, 'V2NIMLocalConversationService')


/**
 * 群组模块.
 *
 * 影响 API 包含 V2NIMSettingService 的部分接口, 举例:
 *   setTeamMessageMuteMode, getTeamMessageMuteMode, getAllTeamMessageMuteMode
 *
 * 影响 API 包含 V2NIMTeamService 的全部接口.
 */
NIM.registerService(V2NIMTeamService, 'V2NIMTeamService')


/**
 * 用户模块.
 *
 * 影响 API 包含 V2NIMSettingService 的部分接口, 举例:
 *   getConversationMuteStatus, setP2PMessageMuteMode
 *
 * 影响 API 包含 V2NIMUserService 的全部接口.
 */
NIM.registerService(V2NIMUserService, 'V2NIMUserService') // 用户模块


/**
 * 好友模块.
 *
 * 影响 API 包含 V2NIMFriendService 的全部接口.
 */
NIM.registerService(V2NIMFriendService, 'V2NIMFriendService')


/**
 * 通知模块.
 *
 * 影响 API 包含 V2NIMNotificationService 的全部接口.
 */
// NIM.registerService(V2NIMNotificationService, 'V2NIMNotificationService')


/**
 * 设置模块.
 *
 * 影响 API 包含 V2NIMSettingService 的全部接口.
 * - 包含推送配置, 会话免打扰设置.
 * - 与会话免打扰有关的设置需要引入群, 用户模块
 */
NIM.registerService(V2NIMSettingService, 'V2NIMSettingService')


/**
 * AI 数字人模块.
 *
 * 影响 API 包含 V2NIMMessageService 的部分接口与事件:
 *   sendMessage (发送参数 aiConfig, 配置 AI 相关)
 *   onReceiveMessages (收消息事件, 回调的 V2NIMMessage 消息体参见属性 aiConfig 与 streamConfig 流式输出)
 *   onReceiveMessagesModified (消息更新事件, 回调的 V2NIMMessage 消息体参见属性 aiConfig 与 streamConfig 流式输出)
 *
 * 影响 API 包含 V2NIMAIService 的全部接口.
 */
NIM.registerService(V2NIMAIService, 'V2NIMAIService')


/**
 * 订阅模块, 如上下线状态通知订阅.
 *
 * 影响 API 包含 V2NIMSubscriptionService 的全部接口.
 */
NIM.registerService(V2NIMSubscriptionService, 'V2NIMSubscriptionService')


/**
 * 信令模块
 *
 * 影响 API 包含 V2NIMSignallingService 的全部接口.
 */
// NIM.registerService(V2NIMSignallingService, 'V2NIMSignallingService')


/**
 * 服务代理相关
 *
 * 影响 API 包含 V2NIMPassthroughService 的全部接口.
 */
// NIM.registerService(V2NIMPassthroughService, 'V2NIMPassthroughService')


/**
 * 此外某些模块包含工具类, 只需要引入对应模块服务, 就能直接使用该工具类, 关系如下
 *
 * V2NIMConversationIdUtil(会话 id 工具类) => V2NIMMessageService, V2NIMConversationService
 * V2NIMClientAntispamUtil(客户端反垃圾工具类) => V2NIMMessageService
 * V2NIMMessageCreator(消息构造工具类) => V2NIMMessageService
 */


export { NIM, V2NIMConst }