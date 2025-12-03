// 全量引入 V2NIM 和 V2NIMConst
const { V2NIMConst, default: V2NIM } = require("./libs/NIM_MINIAPP_SDK.js");

// 从 ESM 引入 nim-web-sdk-ng 构建产物中引入 V2NIM 和 V2NIMConst
// const { NIM: V2NIM, V2NIMConst } = require("./libs/NIM_FROM_BUILD.js");

const { default: RootStore } = require("./libs/store.js");
import { autorun } from "./libs/store.js";

// 类型定义
interface V2NIMMessage {
  msg: any;
  conversationId: string;
  serverExtension?: Record<string, unknown>;
}

// 扩展IAppOption接口
interface IAppOptionExtended extends IAppOption {
  checkLoginStatus(): void;
  initIMLogin(imAccid: string, imToken: string): void;
  isTabBarPage(): boolean;
  syncTabBarRedDot(): void;
  setupStore(): void;
  populateInitialData(): void;
  resetIMCore(): void;
}

const APP_KEY = "replace_your_app_key";
const LOGIN_BY_PHONE_CODE = true;
const ACCID = "your_accid";
const TOKEN = "your_token";

// app.ts
App<IAppOptionExtended>({
  globalData: {
    nim: null,
    store: null,
  },
  isTabBarPage() {
    try {
      const pages = getCurrentPages()
      const cur = pages && pages.length ? pages[pages.length - 1] : null
      const route = cur && cur.route ? cur.route : ''
      return (
        route === 'pages/conversation/conversation-list/index' ||
        route === 'pages/contacts/index/index'
      )
    } catch (e) {
      return false
    }
  },
  syncTabBarRedDot() {
    try {
      if (!this.isTabBarPage()) return
      const store = this.globalData && this.globalData.store ? this.globalData.store : null
      const enableV2CloudConversation = (store && store.sdkOptions && store.sdkOptions.enableV2CloudConversation) || false
      let conversationUnreadCount = 0
      if (enableV2CloudConversation) {
        conversationUnreadCount = (store && store.conversationStore && typeof store.conversationStore.totalUnreadCount === 'number') ? store.conversationStore.totalUnreadCount : 0
        if (conversationUnreadCount === 0 && store && store.conversationStore && store.conversationStore.conversations) {
          try {
            const convs = store.conversationStore.conversations
            const values = convs && convs.values ? convs.values() : []
            let sum = 0
            const arr = [] as any[]
            for (const v of values) arr.push(v)
            for (let i = 0; i < arr.length; i++) {
              const c = arr[i]
              sum += c && typeof c.unreadCount === 'number' ? c.unreadCount : 0
            }
            conversationUnreadCount = sum
          } catch {}
        }
      } else {
        conversationUnreadCount = (store && store.localConversationStore && typeof store.localConversationStore.totalUnreadCount === 'number') ? store.localConversationStore.totalUnreadCount : 0
        if (conversationUnreadCount === 0 && store && store.localConversationStore && store.localConversationStore.conversations) {
          try {
            const convs = store.localConversationStore.conversations
            const values = convs && convs.values ? convs.values() : []
            let sum = 0
            const arr = [] as any[]
            for (const v of values) arr.push(v)
            for (let i = 0; i < arr.length; i++) {
              const c = arr[i]
              sum += c && typeof c.unreadCount === 'number' ? c.unreadCount : 0
            }
            conversationUnreadCount = sum
          } catch {}
        }
      }
      const contactsUnreadCount = (store && store.sysMsgStore && store.sysMsgStore.getTotalUnreadMsgsCount) ? store.sysMsgStore.getTotalUnreadMsgsCount() || 0 : 0
      if (conversationUnreadCount > 0) {
        try { wx.showTabBarRedDot({ index: 0 }) } catch {}
      } else {
        try { wx.hideTabBarRedDot({ index: 0 }) } catch {}
      }
      if (contactsUnreadCount > 0) {
        try { wx.showTabBarRedDot({ index: 1 }) } catch {}
      } else {
        try { wx.hideTabBarRedDot({ index: 1 }) } catch {}
      }
    } catch {}
  },
  onLaunch() {
    const nim = V2NIM.getInstance(
      {
        appkey: APP_KEY,
        needReconnect: true,
        debugLevel: "debug",
        apiVersion: "v2",
        enableV2CloudConversation: wx.getStorageSync('enableV2CloudConversation') === 'on' || false,
      },
      {
        V2NIMLoginServiceConfig: {
          lbsUrls: ["https://lbs.netease.im/lbs/wxwebconf.jsp"],
          linkUrl: "wlnimsc0.netease.im",
        },
        reporterConfig: {
          enableCompass: false,
          compassDataEndpoint: 'https://statistic.live.126.net',
          isDataReportEnable: false
        },
      }
    );

    // 将nim挂载到全局
    this.globalData.nim = nim;
    // 初始化 store 与红点监听器
    this.setupStore();

    // 红点监听器在 setupStore 中初始化

    if (!LOGIN_BY_PHONE_CODE) {
      // OPTION A: 直接登录
      this.initIMLogin(ACCID, TOKEN);
    }else{
      // OPTION B: 通过登录页进行登录
      this.checkLoginStatus();
    }

  },

  /**
   * 初始化并挂载 Store 与相关监听器
   */
  setupStore() {
    try {
      const nim = this.globalData.nim;
      if (!nim) return;
      const store = new RootStore(
        // @ts-ignore
        nim,
        {
          addFriendNeedVerify: false,
          p2pMsgReceiptVisible: true,
          teamMsgReceiptVisible: true,
          teamAgreeMode:
            V2NIMConst.V2NIMTeamAgreeMode.V2NIM_TEAM_AGREE_MODE_NO_AUTH,
          sendMsgBefore: async (options: {
            msg: V2NIMMessage;
            conversationId: string;
            serverExtension?: Record<string, unknown>;
          }) => {
            return { ...options };
          },
        },
        "MiniApp"
      );
      this.globalData.store = store;

      // 初始化红点监听器
      const messageTabRedDotDisposer = autorun(async() => {
        try {
          const store = (this.globalData && this.globalData.store) ? this.globalData.store : null
          const enableV2CloudConversation = (store && store.sdkOptions && store.sdkOptions.enableV2CloudConversation) || false

          let conversationUnreadCount = 0
          if (enableV2CloudConversation) {
            conversationUnreadCount = (store && store.conversationStore && typeof store.conversationStore.totalUnreadCount === 'number')
              ? store.conversationStore.totalUnreadCount
              : 0

            if (conversationUnreadCount === 0 && store && store.conversationStore && store.conversationStore.conversations) {
              try {
                const convs = store.conversationStore.conversations
                const values = convs && convs.values ? convs.values() : []
                let sum = 0
                const arr = [] as any[]
                // @ts-ignore
                for (const v of values) arr.push(v)
                for (let i = 0; i < arr.length; i++) {
                  const c = arr[i]
                  sum += (c && typeof c.unreadCount === 'number') ? c.unreadCount : 0
                }
                conversationUnreadCount = sum
              } catch {}
            }
          } else {
            conversationUnreadCount = (store && store.localConversationStore && typeof store.localConversationStore.totalUnreadCount === 'number')
              ? store.localConversationStore.totalUnreadCount
              : 0

            if (conversationUnreadCount === 0 && store && store.localConversationStore && store.localConversationStore.conversations) {
              try {
                const convs = store.localConversationStore.conversations
                const values = convs && convs.values ? convs.values() : []
                let sum = 0
                const arr = [] as any[]
                // @ts-ignore
                for (const v of values) arr.push(v)
                for (let i = 0; i < arr.length; i++) {
                  const c = arr[i]
                  sum += (c && typeof c.unreadCount === 'number') ? c.unreadCount : 0
                }
                conversationUnreadCount = sum
              } catch {}
            }
          }

          if (this.isTabBarPage()) {
            if (conversationUnreadCount > 0) {
              try { wx.showTabBarRedDot({ index: 0 }) } catch {}
            } else {
              try { wx.hideTabBarRedDot({ index: 0 }) } catch {}
            }
          }
        } catch (error) {
          console.error('更新消息tab红点失败', error)
        }
      })

      const contactsTabRedDotDisposer = autorun(async() => {
        try {
          const store = (this.globalData && this.globalData.store) ? this.globalData.store : null
          const contactsUnreadCount = (store && store.sysMsgStore && store.sysMsgStore.getTotalUnreadMsgsCount)
            ? (store.sysMsgStore.getTotalUnreadMsgsCount() || 0)
            : 0
          if (this.isTabBarPage()) {
            if (contactsUnreadCount > 0) {
              try { wx.showTabBarRedDot({ index: 1 }) } catch {}
            } else {
              try { wx.hideTabBarRedDot({ index: 1 }) } catch {}
            }
          }
        } catch {
          console.error('更新联系人tab红点失败')
        }
      })

      // @ts-ignore
      this.globalData.tabRedDotDisposerMessage = messageTabRedDotDisposer
      // @ts-ignore
      this.globalData.tabRedDotDisposerContacts = contactsTabRedDotDisposer
    } catch {}
  },

  /**
   * 重新创建 NIM 与 Store，并更新全局引用
   */
  resetIMCore() {
    try {
      // 创建新的 NIM 实例
      const nim = V2NIM.getInstance(
        {
          appkey: APP_KEY,
          needReconnect: true,
          debugLevel: "debug",
          apiVersion: "v2",
          enableV2CloudConversation:
            wx.getStorageSync('enableV2CloudConversation') === 'on' || false,
        },
        {
          V2NIMLoginServiceConfig: {
            lbsUrls: ["https://lbs.netease.im/lbs/wxwebconf.jsp"],
            linkUrl: "wlnimsc0.netease.im",
          },
          reporterConfig: {
            enableCompass: false,
            compassDataEndpoint: 'https://statistic.live.126.net',
            isDataReportEnable: false,
          },
        }
      );

      // 更新全局 nim
      this.globalData.nim = nim;
      // 重新初始化 Store 与红点监听器
      this.setupStore();
      // 主动拉取一次会话列表
      this.populateInitialData();
    } catch (error) {
      console.error('resetIMCore failed', error)
    }
  },

  /**
   * 登录成功后主动拉取会话列表，避免遗漏同步事件导致UI为空
   */
  populateInitialData() {
    try {
      // @ts-ignore
      const store = (this.globalData && this.globalData.store) ? this.globalData.store : null
      if (!store) return
      const limit = (store.localOptions && store.localOptions.conversationLimit) || 100

      const enableV2CloudConversation = (store.sdkOptions && store.sdkOptions.enableV2CloudConversation) || false
      if (enableV2CloudConversation) {
        if (store.conversationStore && store.conversationStore.getConversationListActive) {
          try { store.conversationStore.getConversationListActive(0, limit) } catch {}
        }
      } else {
        if (store.localConversationStore && store.localConversationStore.getConversationListActive) {
          try { store.localConversationStore.getConversationListActive(0, limit) } catch {}
        }
      }
    } catch {}
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus() {
    try {
      const imAccid = wx.getStorageSync('imAccid');
      const imToken = wx.getStorageSync('imToken');
      
      if (!imAccid || !imToken) {
        // 未登录，跳转到登录页
        wx.reLaunch({
          url: '/pages/login/index'
        });
        return;
      }

      // 有登录信息，尝试自动登录
      this.initIMLogin(imAccid, imToken);
    } catch (error) {
      console.error('检查登录状态失败:', error);
      // 出错时跳转到登录页
      wx.reLaunch({
        url: '/pages/login/index'
      });
    }
  },

  /**
   * 初始化IM登录
   */
  initIMLogin(imAccid: string, imToken: string) {
    const nim = this.globalData.nim;
    
    if (!nim) {
      console.error('NIM实例未初始化');
      wx.reLaunch({
        url: '/pages/login/index'
      });
      return;
    }

    nim.V2NIMLoginService.login(imAccid, imToken).then(() => {
      // 登录成功后，重建 Store 保证不会复用旧账号数据
      this.setupStore();
      // 主动拉取会话列表，避免 UI 空白
      this.populateInitialData();
      // 跳转到会话列表页面
      wx.reLaunch({
        url: '/pages/conversation/conversation-list/index'
      });
    }).catch((error: any) => {
      console.error('IM自动登录失败:', error);
      // 登录失败，清除本地存储并跳转到登录页
      wx.removeStorageSync('imAccid');
      wx.removeStorageSync('imToken');
      wx.removeStorageSync('accessToken');
      wx.reLaunch({
        url: '/pages/login/index'
      });
    });
  }
})
