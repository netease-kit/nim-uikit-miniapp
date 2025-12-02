Component({
  properties: {
    conversation: {
      type: Object,
      value: {}
    }
  },

  data: {
    showReadStatus: false,
    p2pMsgRotateDeg: 0
  },

  observers: {
    'conversation': function(conversation) {
      this.updateReadStatus(conversation)
    }
  },

  methods: {
    updateReadStatus(conversation: any) {
      if (!conversation || !conversation.lastMessage) {
        this.setData({
          showReadStatus: false,
          p2pMsgRotateDeg: 0
        })
        return
      }

      try {
        const app = getApp() as any
        const nim = app && app.globalData ? app.globalData.nim : null
        const store = app && app.globalData ? app.globalData.store : null

        const p2pMsgReceiptVisible = !!(store && store.localOptions && store.localOptions.p2pMsgReceiptVisible)
        const convType = nim && nim.V2NIMConversationIdUtil ? nim.V2NIMConversationIdUtil.parseConversationType(conversation.conversationId) : null

        if (!p2pMsgReceiptVisible || convType !== 1) {
          this.setData({ showReadStatus: false, p2pMsgRotateDeg: 0 })
          return
        }

        const lastMsgTime = (conversation.lastMessage && conversation.lastMessage.messageRefer && conversation.lastMessage.messageRefer.createTime) ? conversation.lastMessage.messageRefer.createTime : 0
        const receiptTime = typeof conversation.msgReceiptTime === 'number' ? conversation.msgReceiptTime : 0
        const deg = receiptTime >= lastMsgTime ? 360 : 0

        this.setData({
          showReadStatus: true,
          p2pMsgRotateDeg: deg
        })
      } catch (e) {
        this.setData({ showReadStatus: false, p2pMsgRotateDeg: 0 })
      }
    }
  }
})
