// pages/chat/message-read-info/index.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    theme: 'light',
    messageClientId: '',
    conversationId: '',
    statusBarHeight: 0,
    selectedType: 'read',
    readCount: 0,
    unReadCount: 0,
    readList: [],
    unReadList: [],
    readUsers: [],
    unReadUsers: [],
    loading: false,
    errorMessage: '',
    teamId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options: any) {    
    // 从页面参数获取消息ID和会话ID
    if (options.messageClientId) {
      this.setData({
        messageClientId: options.messageClientId
      });
    }
    
    if (options.conversationId) {
      this.setData({
        conversationId: options.conversationId
      });
    }
    
    // 获取系统主题
    this.getSystemTheme();
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({ statusBarHeight: systemInfo.statusBarHeight || 0 });
    } catch {}
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadMessageReadInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.onRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '消息已读详情',
      path: `/pages/chat/message-read-info/index?messageClientId=${this.data.messageClientId}&conversationId=${this.data.conversationId}`
    };
  },

  /**
   * 返回上一页
   */
  handleBack() {
    try {
      wx.navigateBack({ delta: 1 })
    } catch {}
  },

  /**
   * 获取系统主题
   */
  getSystemTheme() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      if (systemInfo.theme) {
        this.setData({
          theme: systemInfo.theme
        });
      }
    } catch (error) {
      console.error('获取系统主题失败:', error);
    }
  },

  /**
   * 处理刷新事件
   */
  onRefresh() {
    this.loadMessageReadInfo()
    wx.stopPullDownRefresh()
  },

  /**
   * 处理导出事件
   */
  onExport(event: any) {
    const { readList = [], unReadList = [] } = event.detail || {};
    
    // 显示导出选项
    wx.showActionSheet({
      itemList: ['导出已读用户列表', '导出未读用户列表', '导出全部用户列表'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.exportUserList(readList, '已读用户列表');
        } else if (res.tapIndex === 1) {
          this.exportUserList(unReadList, '未读用户列表');
        } else if (res.tapIndex === 2) {
          this.exportUserList([...readList, ...unReadList], '全部用户列表');
        }
      },
      fail: (err) => {}
    });
  },

  /**
   * 导出用户列表
   */
  exportUserList(users: any[], title: string) {
    if (!users || users.length === 0) {
      wx.showToast({
        title: '暂无数据可导出',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 生成导出内容
    let content = `${title}\n\n`;
    users.forEach((user, index) => {
      content += `${index + 1}. ${user.nick || user.account}\n`;
    });
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (err) => {
        console.error('复制失败:', err);
        wx.showToast({
          title: '复制失败',
          icon: 'error',
          duration: 2000
        });
      }
    });
  },

  /**
   * 处理用户点击事件
   */
  onUserClick(event: any) {
    const { account } = event.detail || {};
    
    // 显示用户操作选项
    wx.showActionSheet({
      itemList: ['查看用户信息', '发送消息'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({
            title: '查看用户信息功能待实现',
            icon: 'none',
            duration: 2000
          });
        } else if (res.tapIndex === 1) {
          if (account) {
            const app = getApp() as any
            const nim = app && app.globalData ? app.globalData.nim : null
            const convId = nim && nim.V2NIMConversationIdUtil && nim.V2NIMConversationIdUtil.p2pConversationId
              ? nim.V2NIMConversationIdUtil.p2pConversationId(account)
              : account
            wx.navigateTo({
              url: `/pages/chat/index/index?conversationId=${convId}`
            });
          }
        }
      },
      fail: (err) => {}
    });
  },
  // 加载消息已读信息
  loadMessageReadInfo() {
    const { messageClientId, conversationId } = this.data as any;
    if (!messageClientId || !conversationId) return;
    this.setData({ loading: true, errorMessage: '' });
    try {
      const teamId = this.parseTeamId(conversationId);
      this.setData({ teamId });
      const msg = this.getMessage(conversationId, messageClientId);
      if (!msg) {
        this.setData({ loading: false, errorMessage: '消息不存在' });
        return;
      }
      this.getMessageReceiptDetails(msg);
    } catch (error) {
      console.error('加载消息已读信息失败:', error);
      this.setData({ loading: false, errorMessage: '加载失败，请重试' });
    }
  },

  // 解析群组ID
  parseTeamId(conversationId: string): string {
    try {
      const app = getApp() as any
      const nim = app && app.globalData ? app.globalData.nim : null
      if (nim && nim.V2NIMConversationIdUtil) {
        return nim.V2NIMConversationIdUtil.parseConversationTargetId(conversationId) || ''
      }
    } catch {}
    return ''
  },

  // 获取消息
  getMessage(conversationId: string, messageClientId: string) {
    const app = getApp();
    const store = (app.globalData && app.globalData.store) ? app.globalData.store : null;
    if (store && store.msgStore) {
      const messages = store.msgStore.getMsg(conversationId, [messageClientId]);
      return messages && messages.length > 0 ? messages[0] : null;
    }
    return null;
  },

  // 获取消息已读详情
  async getMessageReceiptDetails(message: any) {
    try {
      const app = getApp();
      const store = (app.globalData && app.globalData.store) ? app.globalData.store : null;
      if (store && store.msgStore) {
        const result = await store.msgStore.getTeamMessageReceiptDetailsActive(message);
        if (result) {
          const teamId = this.parseTeamId(this.data.conversationId)
          const readList = result.readAccountList || []
          const unReadList = result.unreadAccountList || []
          const accounts = Array.from(new Set([...(readList || []), ...(unReadList || [])]))

          try {
            const team = (store && store.teamStore && store.teamStore.teams) ? store.teamStore.teams.get(teamId) : null
            const memberLimit = (team && typeof team.memberLimit === 'number') ? team.memberLimit : 0
            const memberCount = (team && typeof team.memberCount === 'number') ? team.memberCount : 0
            const limit = Math.max(memberLimit, memberCount, accounts.length, 200)
            if (store && store.teamMemberStore && store.teamMemberStore.getTeamMemberActive) {
              await store.teamMemberStore.getTeamMemberActive({ teamId, queryOption: { limit, roleQueryType: 0 } })
            }
            if (store && store.userStore && store.userStore.getUserListFromCloudActive && accounts.length > 0) {
              try { await store.userStore.getUserListFromCloudActive(accounts) } catch {}
            }
          } catch {}

          const readUsers = (readList || []).map((account: string) => ({
            account,
            nick: (store.uiStore && store.uiStore.getAppellation)
              ? (store.uiStore.getAppellation({ account, teamId }) || account)
              : account
          }))
          const unReadUsers = (unReadList || []).map((account: string) => ({
            account,
            nick: (store.uiStore && store.uiStore.getAppellation)
              ? (store.uiStore.getAppellation({ account, teamId }) || account)
              : account
          }))
          this.setData({
            readCount: (result.readReceipt && result.readReceipt.readCount) ? result.readReceipt.readCount : 0,
            unReadCount: (result.readReceipt && result.readReceipt.unreadCount) ? result.readReceipt.unreadCount : 0,
            readList,
            unReadList,
            readUsers,
            unReadUsers,
            loading: false
          });
        } else {
          this.setData({ loading: false, errorMessage: '获取已读详情失败' });
        }
      }
    } catch (error) {
      console.error('获取消息已读详情失败:', error);
      this.setData({ loading: false, errorMessage: '获取已读详情失败' });
    }
  },

  // 切换选中类型
  handleTypeChange(event: any) {
    const type = event.currentTarget.dataset.type;
    this.setData({ selectedType: type });
  },

  
});
