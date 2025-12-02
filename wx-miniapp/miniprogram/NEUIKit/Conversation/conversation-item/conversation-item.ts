Component({
  properties: {
    conversation: {
      type: Object,
      value: {}
    },
    showMoreActions: {
      type: Boolean,
      value: false
    }
  },

  data: {
    to: '',
    teamAvatar: '',
    sessionName: '',
    date: '',
    unread: 0,
    isMute: false,
    beMentioned: false,
    showSessionUnread: false,
    isP2P: false,
    teamFetchTs: {} as any,
    moreActions: [
      {
        type: 'stickyToTop',
        name: '置顶',
        class: 'stick-top'
      },
      {
        type: 'delete',
        name: '删除',
        class: 'delete'
      }
    ],
    touchStartX: 0,
    touchStartY: 0
  },

  observers: {
    'conversation': function(conversation) {
      this.processConversation(conversation)
    },
  },

  lifetimes: {
    attached() {
      this.processConversation(this.data.conversation)
    }
  },

  methods: {
    processConversation(conversation: any) {
      if (!conversation) return
      
      const to = this.parseConversationTargetId(conversation.conversationId)
      const sessionName = this.getSessionName(conversation)
      const date = this.formatDate((conversation.lastMessage && conversation.lastMessage.messageRefer && conversation.lastMessage.messageRefer.createTime) ? conversation.lastMessage.messageRefer.createTime : 0)
      const _unread = conversation.unreadCount || 0
      const unread = _unread > 99 ? '99+' : _unread
      const isMute = this.computeMute(conversation, to)
      const beMentioned = conversation.beMentioned || false
      const isP2P = conversation.type === 'P2P' || conversation.type === 1 || conversation.type === 'p2p'
      const teamAvatar = isP2P ? '' : (conversation.avatar || this.pickDefaultTeamAvatar(to))
      const finalSessionName = isP2P ? (sessionName || conversation.conversationId) : this.resolveTeamName(sessionName, to)
            
      // 更新置顶按钮文本
      const moreActions = this.data.moreActions.map(action => {
        if (action.type === 'stickyToTop') {
          return {
            ...action,
            name: conversation.stickTop ? '取消\n置顶' : '置顶'
          }
        }
        return action
      })
      
      this.setData({
        to,
        teamAvatar,
        sessionName: finalSessionName,
        date,
        unread,
        isMute,
        beMentioned,
        moreActions,
        showSessionUnread: this.shouldShowSessionUnread(conversation),
        isP2P
      })

      if (!isP2P) {
        try {
          const app = getApp() as any
          const store = app && app.globalData ? app.globalData.store : null
          const hasTeam = !!(store && store.teamStore && store.teamStore.teams && store.teamStore.teams.get(to))
          const lastTs = (this.data.teamFetchTs && this.data.teamFetchTs[to]) ? this.data.teamFetchTs[to] : 0
          const now = Date.now()
          if (!hasTeam && now - lastTs > 60000) {
            this.setData({ teamFetchTs: { ...this.data.teamFetchTs, [to]: now } })
            this.tryUpdateTeamInfo(to)
          }
        } catch {}
      }
    },

    pickDefaultTeamAvatar(seed: string) {
      const arr = [
        'https://yx-web-nosdn.netease.im/common/2425b4cc058e5788867d63c322feb7ac/groupAvatar1.png',
        'https://yx-web-nosdn.netease.im/common/62c45692c9771ab388d43fea1c9d2758/groupAvatar2.png',
        'https://yx-web-nosdn.netease.im/common/d1ed3c21d3f87a41568d17197760e663/groupAvatar3.png',
        'https://yx-web-nosdn.netease.im/common/e677d8551deb96723af2b40b821c766a/groupAvatar4.png',
        'https://yx-web-nosdn.netease.im/common/fd6c75bb6abca9c810d1292e66d5d87e/groupAvatar5.png'
      ]
      if (!seed) return arr[0]
      let hash = 0
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0
      }
      const idx = Math.abs(hash) % arr.length
      return arr[idx]
    },

    isInvalidTeamName(name: string, teamId: string) {
      if (!name) return true
      if (!teamId) return false
      return name === teamId
    },

    resolveTeamName(currentName: string, teamId: string) {
      if (!this.isInvalidTeamName(currentName, teamId)) return currentName
      try {
        const app = getApp() as any
        const store = app && app.globalData ? app.globalData.store : null
        const team = store && store.teamStore && store.teamStore.teams ? store.teamStore.teams.get(teamId) : null
        return (team && team.name) ? team.name : '群聊'
      } catch {
        return '群聊'
      }
    },

    async tryUpdateTeamInfo(teamId: string) {
      try {
        const app = getApp() as any
        const store = app && app.globalData ? app.globalData.store : null
        if (!store || !teamId) return
        if (store.teamStore && store.teamStore.getTeamActive) {
          await store.teamStore.getTeamActive(teamId).catch(() => {})
          const team = store.teamStore && store.teamStore.teams ? store.teamStore.teams.get(teamId) : null
          if (team) {
            const avatar = team.avatar || this.pickDefaultTeamAvatar(teamId)
            const name = team.name || '群聊'
            this.setData({ teamAvatar: avatar, sessionName: name })
          }
        }
      } catch {}
    },

    computeMute(conversation: any, to: string) {
      if (typeof conversation.mute !== 'undefined') {
        return !!conversation.mute
      }
      const app = getApp() as any
      const store = app && app.globalData ? app.globalData.store : null
      if (!store) return false
      if (conversation.type === 'P2P') {
        const mutes = store && store.relationStore && store.relationStore.mutes
          ? store.relationStore.mutes
          : null
        return Array.isArray(mutes) && mutes.includes(to)
      }
      return false
    },

    parseConversationTargetId(conversationId: string) {
      // 解析会话目标ID
      return conversationId.split('|')[2] || ''
    },

    getSessionName(conversation: any) {
      const isP2P = conversation.type === 'P2P' || conversation.type === 1 || conversation.type === 'p2p'
      if (isP2P) {
        return conversation.name || conversation.conversationId
      } else {
        return conversation.name || '群聊'
      }
    },

    formatDate(timestamp: number) {
      // 使用统一的时间格式化函数，避免toLocaleTimeString等可能导致英文显示的API
      const { formatConversationTime } = require('../../utils/date');
      return formatConversationTime(timestamp);
    },

    formatTime(date: Date) {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    },

    formatDateShort(date: Date) {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day}`
    },

    shouldShowSessionUnread(conversation: any) {
      const lastMessage = conversation && conversation.lastMessage
      if (!lastMessage) return false
      if (conversation.type !== 1) return false
      if (lastMessage.messageRefer.senderId !== conversation.conversationId.split('|')[0]) return false
      const sendingState = lastMessage.sendingState
      if (sendingState === 2 || sendingState === 3) return false
      const lastMessageState = lastMessage.lastMessageState
      if (lastMessageState === 1) return false
      const messageType = lastMessage.messageType
      if (messageType === 12 || messageType === 5) return false
      return true
    },

    handleTouchStart(e: any) {
      const touch = e.touches[0]
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY
      })
    },

    handleTouchMove(e: any) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      
      // 判断是否为水平滑动手势（左滑或右滑）
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX < -50) {
          // 左滑手势
          this.triggerEvent('leftSlide', {
            conversationId: this.data.conversation.conversationId
          })
        } else if (deltaX > 50) {
          // 右滑手势
          this.triggerEvent('leftSlide', {
            conversationId: ''
          })
        }
      }
    },

    handleConversationItemClick() {
      if (this.data.showMoreActions) {
        // 如果显示操作菜单，点击隐藏
        this.triggerEvent('leftSlide', {
          conversationId: ''
        })
      } else {
        // 正常点击进入聊天
        this.triggerEvent('click', {
          conversation: this.data.conversation
        })
      }
    },

    handleActionClick(e: any) {
      const { type } = e.currentTarget.dataset
      
      switch (type) {
        case 'stickyToTop':
          this.triggerEvent('stickyToTop', {
            conversation: this.data.conversation,
            stickTop: !this.data.conversation.stickTop
          })
          break
        case 'delete':
          this.triggerEvent('delete', {
            conversation: this.data.conversation
          })
          break
      }
    }
  }
})
