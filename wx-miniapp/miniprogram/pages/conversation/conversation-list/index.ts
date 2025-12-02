Page({
  data: {},

  onLoad() {},

  onShow() {
    const app = getApp() as any
    if (app && typeof app.syncTabBarRedDot === 'function') {
      try { app.syncTabBarRedDot() } catch {}
    }
  },

  onHide() {},

  onUnload() {},

  async onSessionClick(e: any) {
    const { conversation } = e.detail
    if (!conversation || !conversation.conversationId) {
      try {
        wx.showToast({ title: '会话信息不完整', icon: 'none' })
      } catch {}
      return
    }

    try {
      const app = getApp() as any
      const nim = app && app.globalData ? app.globalData.nim : null
      const store = app && app.globalData ? app.globalData.store : null
      const convType = nim && nim.V2NIMConversationIdUtil && nim.V2NIMConversationIdUtil.parseConversationType
        ? nim.V2NIMConversationIdUtil.parseConversationType(conversation.conversationId)
        : null

      if (store && store.msgStore && typeof conversation.unreadCount === 'number' && conversation.unreadCount > 0) {
        try {
          const historyMsgs = store.msgStore.getHistoryMsgActive
            ? await store.msgStore.getHistoryMsgActive({
                conversationId: conversation.conversationId,
                endTime: Date.now(),
                limit: 50
              })
            : []
          if (Array.isArray(historyMsgs) && historyMsgs.length) {
            const myUserAccountId = nim && nim.V2NIMLoginService && nim.V2NIMLoginService.getLoginUser
              ? nim.V2NIMLoginService.getLoginUser()
              : ''
            const othersMsgs = historyMsgs
              .filter((item: any) => !['beReCallMsg', 'reCallMsg'].includes((item as any).recallType || ''))
              .filter((item: any) => item && item.senderId !== myUserAccountId)
            if (convType === 1 && store.msgStore.sendMsgReceiptActive && othersMsgs.length > 0) {
              await store.msgStore.sendMsgReceiptActive(othersMsgs[0])
            } else if ((convType === 2 || convType === 3) && store.msgStore.sendTeamMsgReceiptActive && othersMsgs.length > 0) {
              await store.msgStore.sendTeamMsgReceiptActive(othersMsgs.slice(0, 50))
            }
          }
        } catch {}
      }

      if (convType === 2 || convType === 3) {
        const teamId = nim && nim.V2NIMConversationIdUtil && nim.V2NIMConversationIdUtil.parseConversationTargetId
          ? nim.V2NIMConversationIdUtil.parseConversationTargetId(conversation.conversationId)
          : ''
        const team = store && store.teamStore && store.teamStore.teams ? store.teamStore.teams.get(teamId) : null

        if (!team || !team.isValidTeam) {
          wx.showModal({
            title: '提示',
            content: '您已被移出群聊或群聊已解散',
            success: async (res) => {
              if (res.confirm && store) {
                try {
                  const enableV2CloudConversation = (store.sdkOptions && store.sdkOptions.enableV2CloudConversation) || false
                  if (enableV2CloudConversation) {
                    if (store.conversationStore && store.conversationStore.deleteConversationActive) {
                      await store.conversationStore.deleteConversationActive(conversation.conversationId)
                    }
                  } else {
                    if (store.localConversationStore && store.localConversationStore.deleteConversationActive) {
                      await store.localConversationStore.deleteConversationActive(conversation.conversationId)
                    }
                  }
                } catch {}
              }
            }
          })
          return
        }

        const limit = Math.max((team && team.memberLimit) || 0, 200)
        const p = store && store.teamMemberStore && store.teamMemberStore.getTeamMemberActive
          ? store.teamMemberStore.getTeamMemberActive({ teamId, queryOption: { limit, roleQueryType: 0 } })
          : null
        if (p && typeof (p as any).then === 'function') {
          ;(p as Promise<any>).then(() => {
            wx.navigateTo({
              url: `/pages/chat/index/index?conversationId=${conversation.conversationId}&to=${conversation.to || ''}`
            })
          }).catch(() => {
            wx.navigateTo({
              url: `/pages/chat/index/index?conversationId=${conversation.conversationId}&to=${conversation.to || ''}`
            })
          })
        } else {
          wx.navigateTo({
            url: `/pages/chat/index/index?conversationId=${conversation.conversationId}&to=${conversation.to || ''}`
          })
        }
        return
      }
    } catch {}

    wx.navigateTo({
      url: `/pages/chat/index/index?conversationId=${conversation.conversationId}&to=${conversation.to || ''}`
    }).catch(() => {
      try { wx.showToast({ title: '跳转失败', icon: 'none' }) } catch {}
    })
  }
});
