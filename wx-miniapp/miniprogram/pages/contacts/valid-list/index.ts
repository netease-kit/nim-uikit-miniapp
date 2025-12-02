import { autorun } from '../../../libs/store'

let disposer: any = null

Page({
  data: {},

  onLoad() {},

  onShow() {
    const app = getApp() as any
    const store = app.globalData && app.globalData.store ? app.globalData.store : null

    if (store && store.sysMsgStore && store.sysMsgStore.setAllApplyMsgRead) {
      store.sysMsgStore.setAllApplyMsgRead()
    }

    if (!disposer && store) {
      disposer = autorun(() => {
        const unreadCount = store.sysMsgStore && store.sysMsgStore.getTotalUnreadMsgsCount ? store.sysMsgStore.getTotalUnreadMsgsCount() : 0
        if (unreadCount > 0) {
          store.sysMsgStore.setAllApplyMsgRead()
        }
      })
    }
  },

  onHide() {
    if (disposer) {
      disposer()
      disposer = null
    }
  },

  onUnload() {
    if (disposer) {
      disposer()
      disposer = null
    }
  }
})
