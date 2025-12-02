import { autorun } from '../../../../libs/store'

Component({
  properties: {
    msg: {
      type: Object,
      value: {}
    },
    teamId: {
      type: String,
      value: ''
    },
    replyMsgsMap: {
      type: Object,
      value: {}
    }
  },

  data: {
    senderName: '',
    computedTeamId: '',
    replyMsg: null,
    replyMsgType: '',
    replyPreviewText: '',
    imageUrl: '',
    readStatus: '',
    readInfo: null as any,
    showReadStatus: false,
    // 话单消息相关数据
    callIconType: '',
    callStatusText: '',
    callDuration: '',
    // 回复文本预览弹窗
    replyTextPreviewVisible: false,
    replyTextContent: '',
    replyTextContentMsg: null as any,
    appellationDisposer: null as any,
    receiptFetchMap: {} as Record<string, number>
  },

  observers: {
    'msg': function(msg: any) {
      if (msg) {
        this.updateMessageData(msg);
      }
    },
    
    'replyMsgsMap, msg.messageClientId': function(replyMsgsMap: any, messageClientId: string) {
      if (messageClientId && replyMsgsMap) {
        const replyMsg = replyMsgsMap[messageClientId];
        if (replyMsg && replyMsg.messageClientId !== 'noFind') {
          const msgTypeMap: { [key: string]: string } = {
            'text': '文本',
            'image': '图片',
            'audio': '语音',
            'video': '视频',
            'location': '位置',
            'notification': '通知',
            'file': '文件',
            'avchat': '音视频通话',
            'tips': '提示',
            'robot': '机器人消息',
            'call': '话单',
            'custom': '自定义消息',
            'unknown': '未知消息'
          };
          const normalizeType = (messageType: any): string => {
            if (typeof messageType === 'string') return messageType
            switch (messageType) {
              case 0: return 'text'
              case 1: return 'image'
              case 2: return 'audio'
              case 3: return 'video'
              case 4: return 'location'
              case 5: return 'notification'
              case 6: return 'file'
              case 7: return 'avchat'
              case 10: return 'tips'
              case 11: return 'robot'
              case 12: return 'call'
              case 100: return 'custom'
              default: return 'unknown'
            }
          }

          // 同步回复消息的发送者名称为群内展示的称谓（备注>群昵称>个人昵称>accid）
          if (replyMsg.senderId) {
            const store = getApp().globalData.store;
            if (store && store.uiStore) {
              const currMsg = (this as any).properties.msg || (this as any).data.msg || {}
              const teamId = this.computeTeamId(currMsg)
              replyMsg.senderName = store.uiStore.getAppellation({ account: replyMsg.senderId, teamId }) || replyMsg.senderId;
            }
          }
          const typeStr = normalizeType(replyMsg.messageType)
          let preview = ''
          const recallType = (replyMsg as any).recallType
          if (recallType === 'reCallMsg' || recallType === 'beReCallMsg') {
            preview = '该消息已撤回或删除'
          } else {
          if (typeStr === 'text') {
            preview = replyMsg.text || ''
          } else if (typeStr === 'image') {
            preview = '[图片消息]'
          } else if (typeStr === 'audio') {
            preview = '[语音消息]'
          } else if (typeStr === 'video') {
            preview = '[视频消息]'
          } else if (typeStr === 'file') {
            preview = `[文件消息]`
          } else if (typeStr === 'location') {
            preview = '[位置消息]'
          } else if (typeStr === 'custom') {
            preview = '[自定义消息]'
          } else if (typeStr === 'notification') {
            preview = '[通知消息]'
          } else {
            preview = '[未知类型消息]'
          }
          }

          this.setData({
            replyMsg,
            replyMsgType: msgTypeMap[typeStr] || '未知类型',
            replyPreviewText: preview
          });
        } else {
          const currMsg = (this as any).properties.msg || (this as any).data.msg || {}
          let yxReplyMsg: any = null
          try {
            if (currMsg && currMsg.serverExtension) {
              const ext = JSON.parse(currMsg.serverExtension)
              yxReplyMsg = ext && ext.yxReplyMsg ? ext.yxReplyMsg : null
            }
          } catch (_) {}

          if (yxReplyMsg) {
          const fromAccount = yxReplyMsg.from || ''
          const store = getApp().globalData.store
          let senderName = fromAccount || ''
          if (store && store.uiStore && fromAccount) {
              const currMsg = (this as any).properties.msg || (this as any).data.msg || {}
              const teamId = this.computeTeamId(currMsg)
              senderName = store.uiStore.getAppellation({ account: fromAccount, teamId }) || fromAccount
          }
            this.setData({
              replyMsg: { senderId: fromAccount, senderName } as any,
              replyMsgType: '未知类型',
              replyPreviewText: '该消息已撤回或删除'
            })
          } else {
            this.setData({
              replyMsg: null,
              replyMsgType: '',
              replyPreviewText: ''
            })
          }
        }
      }
    }
  },

  lifetimes: {
    attached() {
      const app = getApp() as any
      const store = app && app.globalData ? app.globalData.store : null
      const disposer = autorun(() => {
        const msg = (this as any).properties.msg || (this as any).data.msg || {}
        const nim = app && app.globalData ? app.globalData.nim : null
        let teamId = ''
        try {
          if (nim && msg && msg.conversationId && nim.V2NIMConversationIdUtil) {
            const convType = nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId)
            if (convType === 2 || convType === 3) {
              teamId = nim.V2NIMConversationIdUtil.parseConversationTargetId(msg.conversationId) || ''
            }
          }
        } catch {}
        const account = msg && msg.senderId ? msg.senderId : ''
        let name = ''
        if (store && store.uiStore && account) {
          name = store.uiStore.getAppellation({ account, teamId }) || account
        } else {
          name = msg.senderName || account || '未知用户'
        }
        this.setData({ senderName: name, computedTeamId: teamId })

        const rm = (this as any).data.replyMsg
        const rid = rm && rm.senderId ? rm.senderId : ''
        if (rid) {
          const rname = (store && store.uiStore) ? (store.uiStore.getAppellation({ account: rid, teamId }) || rid) : rid
          if (rm.senderName !== rname) {
            this.setData({ 'replyMsg.senderName': rname })
          }
        }

        const clientId = msg && msg.messageClientId ? msg.messageClientId : ''
        const convId = msg && msg.conversationId ? msg.conversationId : ''
        let latestMsg = msg
        try {
          if (store && store.msgStore && store.msgStore.getMsg && convId && clientId) {
            const arr = store.msgStore.getMsg(convId, [clientId])
            latestMsg = (arr && arr.length > 0) ? arr[0] : msg
          }
        } catch {}
        const readInfo = this.computeReadInfo(latestMsg)
        const showReadStatus = !!readInfo
        const readStatus = this.getReadStatus(latestMsg)
        const di = (this as any).data || {}
        const prevInfo = di.readInfo
        const prevShow = di.showReadStatus
        const prevStatus = di.readStatus
        const changed = JSON.stringify(prevInfo) !== JSON.stringify(readInfo) || prevShow !== showReadStatus || prevStatus !== readStatus
        if (changed) {
          this.setData({ readInfo, showReadStatus, readStatus })
        }

        // 若为群聊且自己发送的消息，且尚无回执统计，则补充一次拉取
        try {
          if (nim && latestMsg && latestMsg.conversationId && store && store.msgStore) {
            const convType = nim.V2NIMConversationIdUtil.parseConversationType(latestMsg.conversationId)
            const isSelf = !!latestMsg.isSelf
            const isNotificationOrTips = latestMsg.messageType === 5 || latestMsg.messageType === 10 || latestMsg.messageType === 'notification' || latestMsg.messageType === 'tips'
            const hasReceiptFields = typeof (latestMsg as any).yxRead === 'number' || typeof (latestMsg as any).yxUnread === 'number'
            const idc = latestMsg.messageClientId
            const now = Date.now()
            const lastTs = (this.data.receiptFetchMap && idc) ? (this.data.receiptFetchMap[idc] || 0) : 0
            if (convType === 2 && isSelf && !isNotificationOrTips && !hasReceiptFields && idc && now - lastTs > 15000) {
              this.setData({ receiptFetchMap: { ...(this.data.receiptFetchMap || {}), [idc]: now } })
              try { store.msgStore.getTeamMsgReadsActive && store.msgStore.getTeamMsgReadsActive([latestMsg], latestMsg.conversationId) } catch {}
            }
          }
        } catch {}
      })
      this.setData({ appellationDisposer: disposer })
    },
    detached() {
      if (this.data.appellationDisposer) {
        this.data.appellationDisposer()
      }
    }
  },

  methods: {
    // 更新消息数据
    updateMessageData(msg: any) {
      // 设置发送者名称
      const senderName = this.getSenderName(msg);
      const computedTeamId = this.computeTeamId(msg)
      
      // 设置图片URL
      let imageUrl = '';
      if (msg.messageType === 'image' && msg.attachment) {
        const att = msg.attachment || {}
        const candidate = att.url || att.path || msg.previewImg || ''
        const isGif = (/\.gif(\?.*)?$/i.test(candidate))
          || (/\.gif(\?.*)?$/i.test(att.thumbUrl || ''))
          || (((att.mimeType || att.mime || att.type || '').toLowerCase()) === 'image/gif')
          || (((att.format || '').toLowerCase()) === 'gif')
        imageUrl = isGif ? candidate : (att.thumbUrl || candidate)
      }
      
      const readStatus = this.getReadStatus(msg);
      const readInfo = this.computeReadInfo(msg);
      const showReadStatus = this.shouldShowReadStatus(msg);
      
      // 处理话单消息
      let callIconType = '';
      let callStatusText = '';
      let callDuration = '';
      
      if (msg.messageType === 'call') {
        const callData = this.updateCallData(msg);
        callIconType = callData.iconType;
        callStatusText = callData.statusText;
        callDuration = callData.duration;
      }
      
      this.setData({
        senderName,
        computedTeamId,
        imageUrl,
        readStatus,
        readInfo,
        showReadStatus,
        callIconType,
        callStatusText,
        callDuration
      });
    },
    
    // 获取发送者名称
    getSenderName(msg: any): string {
      // 优先使用消息中的发送者名称
      if (msg.senderName) {
        return msg.senderName;
      }
      
      // 从store中获取用户昵称
      try {
        const app = getApp();
        const store = (app.globalData && app.globalData.store) ? app.globalData.store : null;
        const teamId = this.computeTeamId(msg)
        
        if (store && store.uiStore && msg.senderId) {
          const nickname = store.uiStore.getAppellation({ account: msg.senderId, teamId });
          if (nickname && nickname !== msg.senderId) {
            return nickname;
          }
        }
      } catch (error) {
        console.error('获取用户昵称失败:', error);
      }
      
      // 最后使用发送者ID
      return msg.senderId || '未知用户';
    },

    computeTeamId(msg: any): string {
      try {
        const app = getApp() as any
        const nim = app && app.globalData ? app.globalData.nim : null
        if (nim && msg && msg.conversationId && nim.V2NIMConversationIdUtil) {
          const convType = nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId)
          if (convType === 2 || convType === 3) {
            return nim.V2NIMConversationIdUtil.parseConversationTargetId(msg.conversationId) || ''
          }
        }
      } catch {}
      return ''
    },
    
    // 获取消息已读状态
    getReadStatus(msg: any): string {
      if (!msg || !msg.isSelf) return ''
      if (msg.sendingState === 2) return '发送失败'
      if (msg.sendingState === 3 || msg.sendingState === 'sending') return ''

      try {
        const app = getApp() as any
        const nim = app && app.globalData ? app.globalData.nim : null
        const store = app && app.globalData ? app.globalData.store : null
        const convType = nim && nim.V2NIMConversationIdUtil ? nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId) : null

        if (convType === 1) {
          const conv = (store && store.conversationStore && store.conversationStore.conversations && store.conversationStore.conversations.get)
            ? store.conversationStore.conversations.get(msg.conversationId)
            : ((store && store.localConversationStore && store.localConversationStore.conversations && store.localConversationStore.conversations.get)
              ? store.localConversationStore.conversations.get(msg.conversationId)
              : null)
          const receiptTime = (conv && typeof conv.msgReceiptTime === 'number') ? conv.msgReceiptTime : 0
          return receiptTime && msg.createTime <= receiptTime ? '已读' : '未读'
        }

        if (convType === 2) {
          const unread = (msg as any).yxUnread
          const read = (msg as any).yxRead
          if (typeof unread === 'number' && typeof read === 'number') {
            return unread === 0 ? '已读' : '未读'
          }
          const rc = (msg as any).readCount
          if (typeof rc === 'number') {
            return rc > 0 ? '已读' : '未读'
          }
          return '未读'
        }
      } catch {}
      return ''
    },

    computeReadInfo(msg: any) {
      try {
        const app = getApp() as any
        const nim = app && app.globalData ? app.globalData.nim : null
        const store = app && app.globalData ? app.globalData.store : null
        const convType = nim && nim.V2NIMConversationIdUtil ? nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId) : null

        if (!msg || !msg.isSelf) return null
        if (msg.sendingState === 2) return null
        if (msg.sendingState === 3 || msg.sendingState === 'sending') return null

        if (convType === 1) {
          const conv = (store && store.conversationStore && store.conversationStore.conversations && store.conversationStore.conversations.get)
            ? store.conversationStore.conversations.get(msg.conversationId)
            : ((store && store.localConversationStore && store.localConversationStore.conversations && store.localConversationStore.conversations.get)
              ? store.localConversationStore.conversations.get(msg.conversationId)
              : null)
          const receiptTime = (conv && typeof conv.msgReceiptTime === 'number') ? conv.msgReceiptTime : 0
          const read = receiptTime && msg.createTime <= receiptTime ? 1 : 0
          return {
            readCount: read,
            unreadCount: 1 - read,
            totalCount: 1,
            time: read ? receiptTime : undefined
          }
        }

        if (convType === 2) {
          const readCount = Number((msg as any).yxRead || (msg as any).readCount || 0)
          const unreadCount = Number((msg as any).yxUnread || 0)
          const totalCount = readCount + unreadCount
          return {
            readCount,
            unreadCount,
            totalCount
          }
        }
      } catch {}
      return null
    },

    shouldShowReadStatus(msg: any): boolean {
      if (!msg || !msg.isSelf) return false
      if (msg.messageType === 'custom') return false
      if (msg.recallType === 'reCallMsg') return false
      if (msg.sendingState === 2) return false
      if (msg.sendingState === 3 || msg.sendingState === 'sending') return false
      const info = this.computeReadInfo(msg)
      return !!info
    },

    handleReadDetailClick() {
      const { msg, readInfo } = this.data as any
      if (!msg || !readInfo) return

      try {
        const app = getApp() as any
        const nim = app && app.globalData ? app.globalData.nim : null
        const convType = nim && nim.V2NIMConversationIdUtil ? nim.V2NIMConversationIdUtil.parseConversationType(msg.conversationId) : null
        if (convType === 2) {
          const readCount = typeof readInfo.readCount === 'number' ? readInfo.readCount : 0
          const totalCount = typeof readInfo.totalCount === 'number' ? readInfo.totalCount : 0

          if (readCount === totalCount && totalCount > 0) return

          wx.navigateTo({
            url: `/pages/chat/message-read-info/index?messageClientId=${msg.messageClientId}&conversationId=${msg.conversationId}`
          })
        }
      } catch {}
    },
    
    // 处理重新编辑消息
    handleReeditMsg() {
      const { msg } = this.data;
      this.triggerEvent('reeditMsg', {
        msg
      });
    },
    
    // 处理图片点击
    handleImageClick() {
      const { msg, imageUrl } = this.data;
      const isFailed = !!(msg && (msg.sendingState === 2 || msg.sendingState === 'failed' || (msg.messageStatus && msg.messageStatus.errorCode !== 200)));
      if (isFailed) {
        wx.showToast({ title: '上传失败', icon: 'none' });
        return;
      }
      if (imageUrl) {
        // 预览图片
        wx.previewImage({
          current: imageUrl,
          urls: [imageUrl],
          fail: (err) => {
            console.error('预览图片失败:', err);
          }
        });
        
        // 触发图片点击事件
        this.triggerEvent('imageClick', {
          msg,
          imageUrl
        });
      }
    },
    
    // 处理文件点击
    handleFileClick(e: any) {
      const { detail } = e;
      this.triggerEvent('fileClick', detail);
    },
    
    // 处理视频点击
    handleVideoClick(e: any) {
      const { detail } = e;
      const { msg, videoUrl } = detail;
      
      if (videoUrl) {
        // 使用微信小程序原生视频播放
        wx.previewMedia({
          sources: [{
            url: videoUrl,
            type: 'video',
            poster: (msg.attachment && msg.attachment.thumbUrl) ? msg.attachment.thumbUrl : ((msg.attachment && msg.attachment.coverUrl) ? msg.attachment.coverUrl : '')
          }],
          current: 0,
          success: () => {},
          fail: (error) => {
            // 降级方案：显示提示
            wx.showModal({
              title: '播放失败',
              content: '无法播放该视频，请检查网络连接或视频格式',
              showCancel: false
            });
          }
        });
        
        // 触发视频点击事件
        this.triggerEvent('videoClick', detail);
      } else {
        wx.showToast({
          title: '视频地址无效',
          icon: 'none'
        });
      }
    },
    
    // 处理删除消息
    handleDeleteMsg(e: any) {
      const { detail } = e;
      this.triggerEvent('deleteMsg', detail);
    },

    // 处理重发消息
    handleResendMsg(e: any) {
      const { detail } = e;
      this.triggerEvent('resendMsg', detail);
    },
    
    // 处理回复消息
    handleReplyMsg(e: any) {
      const { detail } = e;
      const msg = (detail && detail.msg) || this.data.msg
      const failed = !!(msg && (msg.sendingState === 2 || (msg.messageStatus && msg.messageStatus.errorCode !== 200)))
      if (failed) return
      this.triggerEvent('replyMsg', detail);
    },
    
    // 处理转发消息
    handleForwardMsg(e: any) {
      const { detail } = e;
      const msg = (detail && detail.msg) || this.data.msg
      const failed = !!(msg && (msg.sendingState === 2 || (msg.messageStatus && msg.messageStatus.errorCode !== 200)))
      if (failed) return
      this.triggerEvent('forwardMsg', detail);
    },

    // 处理头像点击事件
    handleAvatarClick(e: any) {
      this.triggerEvent('avatarClick', e.detail);
    },

    // 点击回复消息，文本类型时打开全屏预览
    handleReplyMessageClick() {
      const { replyMsg } = this.data as any
      if (!replyMsg) return
      const type = typeof replyMsg.messageType === 'string' ? replyMsg.messageType : (replyMsg.messageType === 0 ? 'text' : '')
      if (type !== 'text') return
      const text = replyMsg.text || ''
      if (!text) return
      this.setData({
        replyTextPreviewVisible: true,
        replyTextContent: text,
        replyTextContentMsg: { text }
      })
    },

    // 关闭预览弹窗
    closeReplyTextPreview() {
      this.setData({ replyTextPreviewVisible: false })
    },

    // 阻止事件冒泡
    stopPropagation() {},

    // 复制回复文本
    copyReplyText() {
      const { replyTextContent } = this.data as any
      if (!replyTextContent) return
      wx.setClipboardData({
        data: replyTextContent,
        success: () => {
          wx.showToast({ title: '复制成功', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '复制失败', icon: 'none' })
        }
      })
    },
    
    // 格式化时间
    formatTime(timestamp: number): string {
      // 使用统一的时间格式化函数，避免toLocaleTimeString等可能导致英文显示的API
      const { formatMessageTime } = require('../../../utils/date');
      return formatMessageTime(timestamp);
    },
    
    // 检查是否需要显示时间
    shouldShowTime(currentMsg: any, previousMsg: any): boolean {
      if (!previousMsg) {
        return true;
      }
      
      const timeDiff = currentMsg.createTime - previousMsg.createTime;
      // 超过5分钟显示时间
      return timeDiff > 5 * 60 * 1000;
    },
    
    // 获取消息状态图标
    getMessageStatusIcon(msg: any): string {
      if (!msg.isSelf) {
        return '';
      }
      
      switch (msg.sendingState) {
        case 1:
          return 'icon-loading';
        case 3:
          return 'icon-failed';
        case 2:
          return '';
        default:
          return '';
      }
    },
    
    // 处理话单消息数据
    updateCallData(msg: any) {
      const attachment = msg.attachment || {};
      const type = attachment.type || 1; // 1: 音频通话, 2: 视频通话
      const status = attachment.status || 0;
      const duration = attachment.duration || 0;
      
      // 获取图标类型
      const iconType = type === 2 ? 'video' : 'audio';
      
      // 获取状态文本
      const statusText = this.getCallStatusText(status, duration);
      
      // 格式化通话时长
      const formattedDuration = duration > 0 ? this.convertSecondsToTime(duration) : '';
      
      return {
        iconType,
        statusText,
        duration: formattedDuration
      };
    },
    
    // 获取话单状态文本
    getCallStatusText(status: number, duration: number): string {
      if (duration > 0) {
        return '通话时长';
      }
      
      const statusMap: { [key: number]: string } = {
        1: '已取消',
        2: '已拒绝', 
        3: '未接听',
        4: '忙线中'
      };
      
      return statusMap[status] || '未知状态';
    },
    
    // 转换秒数为时间格式
    convertSecondsToTime(seconds: number): string {
      if (seconds <= 0) return '00:00';
      
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    }
  }
});
