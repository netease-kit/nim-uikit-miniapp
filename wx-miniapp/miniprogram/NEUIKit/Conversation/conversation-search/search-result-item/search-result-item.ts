Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    isTeam: false,
    to: '',
    teamAvatar: '',
    teamName: ''
  },

  observers: {
    'item': function(item) {
      if (!item) return
      
      // 是否是群
      const isTeam = !!item.teamId
      
      // 对话方
      const to = item.teamId || item.accountId || ''
      
      // 群头像
      const teamAvatar = item.teamId ? item.avatar : ''
      
      // 群名
      const teamName = item.teamId ? item.name : ''
      
      this.setData({
        isTeam,
        to,
        teamAvatar,
        teamName
      })
    }
  },

  methods: {
    handleItemClick() {
      const { isTeam, to } = this.data
      const app = getApp() as any
      const { nim, store } = app && app.globalData ? app.globalData : { nim: null, store: null }

      if (!nim || !store) {
        console.error('NIM/Store 未初始化')
        wx.showToast({ title: '跳转失败', icon: 'none' })
        return
      }

      if (isTeam) {
        const team = store && store.teamStore && store.teamStore.teams ? store.teamStore.teams.get(to) : null
        if (!team || team.isValidTeam === false) {
          wx.showModal({
            title: '提示',
            content: '您已被移出群聊或群聊已解散',
            showCancel: false,
            success: () => {
              const pages = getCurrentPages()
              const idx = pages.findIndex((p: any) => (p && p.route) ? p.route.includes('pages/conversation/conversation-list/index') : false)
              if (idx !== -1) {
                const delta = pages.length - idx - 1
                wx.navigateBack({ delta })
              } else {
                wx.redirectTo({ url: '/pages/conversation/conversation-list/index' })
              }
            }
          })
          return
        }
      }

      try {
        const conversationId = isTeam
          ? (nim && nim.V2NIMConversationIdUtil && nim.V2NIMConversationIdUtil.teamConversationId) ? nim.V2NIMConversationIdUtil.teamConversationId(to) : ''
          : (nim && nim.V2NIMConversationIdUtil && nim.V2NIMConversationIdUtil.p2pConversationId) ? nim.V2NIMConversationIdUtil.p2pConversationId(to) : ''

        if (!conversationId) {
          wx.showToast({ title: '跳转失败', icon: 'none' })
          return
        }

        if (store && store.uiStore && store.uiStore.selectConversation) {
          store.uiStore.selectConversation(conversationId)
        }

        wx.navigateTo({
          url: `/pages/chat/index/index?conversationId=${conversationId}`,
          fail: (err) => {
            console.error('跳转聊天页面失败:', err)
            wx.showToast({ title: '跳转失败', icon: 'none' })
          }
        })
      } catch (e) {
        console.error('处理搜索结果点击失败:', e)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    }
  }
})
