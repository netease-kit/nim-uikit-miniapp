import { t } from "../../utils/i18n";
import { autorun } from "../../../libs/store"

Component({
  properties: {
    extClass: {
      type: String,
      value: ''
    }
  },

  data: {
    addDropdownVisible: false,
    currentMoveSessionId: '',
    conversationList: [] as any[],
    listSignature: '',
    statusBarHeight: 0, // 状态栏高度
    windowWidth: 0,
    buttonClass: 'button-box',
    dropdownTop: 0,
    dropdownRight: 0,
    loadingMore: false,
    noMore: false,
    limit: 50,
    
    // 添加nim和store实例
    nim: null as any,
    store: null as any,
    enableV2CloudConversation: false,
    disposer: null as any,
    
    // 国际化文本
    appText: t('appText'),
    addFriendText: t('addFriendText'),
    createTeamText: t('createTeamText'),
    securityTipText: t('securityTipText'),
    searchText: t('searchText'),
    conversationEmptyText: t('conversationEmptyText'),
    loadingText: t('loading'),
    noMoreText: t('noMoreText')
  },

  lifetimes: {
    attached() {
      // 获取系统信息，设置状态栏高度
      this.setStatusBarHeight();

      // 初始化nim和store实例
      const app = getApp<IAppOption>();
      const { nim, store } = app.globalData;

      // 将nim、store对象存储为不需要监听变化的实例属性
      (this as any).nimInstance = nim;
      (this as any).storeInstance = store;

      const enableV2CloudConversation = (store && store.sdkOptions && store.sdkOptions.enableV2CloudConversation) || false;

      const disposer = autorun(() => {
        const _conversationList = enableV2CloudConversation
          ? (store && store.uiStore && store.uiStore.conversations) || []
          : (store && store.uiStore && store.uiStore.localConversations) || [];

        const base = Array.isArray(_conversationList)
          ? _conversationList.slice()
          : []

        const sortedList = base.sort(
          (a: { sortOrder: number }, b: { sortOrder: number }) => b.sortOrder - a.sortOrder
        )

        const newSignature = sortedList
          .map((item: any) => [
            item.conversationId,
            item.sortOrder,
            item.unreadCount,
            item.stickTop,
            (item.lastMessage && item.lastMessage.messageRefer && item.lastMessage.messageRefer.createTime) ? item.lastMessage.messageRefer.createTime : 0,
            (typeof item.msgReceiptTime === 'number' ? item.msgReceiptTime : 0)
          ].join(':'))
          .join('|')

        if (newSignature === this.data.listSignature) {
          return
        }

        this.setData({
          conversationList: sortedList,
          listSignature: newSignature
        })
      })

      this.setData({
        enableV2CloudConversation,
        disposer
      });
      
      // 选择空会话
      if (store && store.uiStore && store.uiStore.selectConversation) {
        store.uiStore.selectConversation("");
      }
    },
    
    detached() {
      this.unbindEvents();
      // 清理监听器
      if (this.data.disposer) {
        this.data.disposer();
      }
    }
  },

  methods: {
    // 设置状态栏高度
    setStatusBarHeight() {
      try {
        const systemInfo = wx.getSystemInfoSync();
        const statusBarHeight = systemInfo.statusBarHeight || 44; // 默认44px
        const windowWidth = systemInfo.windowWidth || 0;
        
        this.setData({
          statusBarHeight: statusBarHeight,
          windowWidth
        });
      } catch (error) {
        console.error('获取系统信息失败:', error);
        // 设置默认值
        this.setData({
          statusBarHeight: 44,
          windowWidth: 0
        });
      }
    },

    showAddDropdown() {
      const query = (this as any).createSelectorQuery ? (this as any).createSelectorQuery() : wx.createSelectorQuery();
      query.in(this);
      query.select('.button-icon-add').boundingClientRect((rect: any) => {
        if (rect && rect.bottom != null) {
          const dropdownTop = rect.bottom;
          const windowWidth = this.data.windowWidth || (wx.getSystemInfoSync().windowWidth || 0);
          const dropdownRight = windowWidth > 0 && rect.right != null ? (windowWidth - rect.right) : 32; // 兜底右侧间距
          this.setData({
            dropdownTop,
            dropdownRight
          });
        }
        this.setData({
          addDropdownVisible: true,
          buttonClass: 'button-box button-box-active'
        });
      }).exec();
    },

    hideAddDropdown() {
      this.setData({
        addDropdownVisible: false,
        buttonClass: 'button-box'
      })
    },

    onAddFriend() {
      wx.navigateTo({
        url: '/pages/friend/add-friend/index',
        success: () => {
          this.hideAddDropdown();
        },
        fail: (err) => {
          console.error('跳转到添加好友页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        },
        complete: () => {
          this.hideAddDropdown();
        }
      });
    },

    onCreateGroup() {
      wx.navigateTo({
        url: '/pages/team/create-team/index',
        success: () => {
          this.hideAddDropdown();
        },
        fail: (err) => {
          console.error('跳转到创建群聊页面失败:', err);
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        },
        complete: () => {
          this.hideAddDropdown();
        }
      });
    },

    goToSearchPage() {
      wx.navigateTo({
        url: '/pages/conversation/conversation-search/index'
      })
    },

    handleSessionItemClick(e: any) {
      const { conversation } = e.detail;
      const { storeInstance } = this as any;
      
      if (!storeInstance) {
        console.warn('Store未初始化');
        return;
      }
      
      try {
        // 选择会话
        if (storeInstance && storeInstance.uiStore && storeInstance.uiStore.selectConversation) {
          storeInstance.uiStore.selectConversation(conversation.conversationId);
        }
        
        // 触发session-click事件，让父组件处理跳转
        this.triggerEvent('session-click', { conversation });
      } catch (error) {
        console.error('选择会话失败:', error);
        wx.showToast({
          title: t('selectSessionFailText'),
          icon: 'none'
        });
      }
    },

    handleSessionItemDeleteClick(e: any) {
      const { conversation } = e.detail;
      const { enableV2CloudConversation } = this.data;
      const { storeInstance } = this as any;
      
      wx.showModal({
        title: '提示',
        content: '确定要删除该会话吗？',
        success: async (res) => {
          if (res.confirm && storeInstance) {
            try {
              if (enableV2CloudConversation) {
                if (storeInstance && storeInstance.conversationStore && storeInstance.conversationStore.deleteConversationActive) {
                  await storeInstance.conversationStore.deleteConversationActive(conversation.conversationId);
                }
              } else {
                if (storeInstance && storeInstance.localConversationStore && storeInstance.localConversationStore.deleteConversationActive) {
                  await storeInstance.localConversationStore.deleteConversationActive(conversation.conversationId);
                }
              }
              
              this.setData({
                currentMoveSessionId: ''
              });
            } catch (error) {
              console.error('删除会话失败:', error);
              wx.showToast({
                title: t('deleteSessionFailText'),
                icon: 'none'
              });
            }
          }
        }
      });
    },

    handleSessionItemStickTopChange(e: any) {
      const { conversation } = e.detail;
      const { enableV2CloudConversation } = this.data;
      const { storeInstance } = this as any;
      
      if (!storeInstance) return;
      
      const stickTop = !conversation.stickTop;
      
      try {
        if (enableV2CloudConversation) {
          if (storeInstance && storeInstance.conversationStore && storeInstance.conversationStore.stickTopConversationActive) {
            storeInstance.conversationStore.stickTopConversationActive(conversation.conversationId, stickTop);
          }
        } else {
          if (storeInstance && storeInstance.localConversationStore && storeInstance.localConversationStore.stickTopConversationActive) {
            storeInstance.localConversationStore.stickTopConversationActive(conversation.conversationId, stickTop);
          }
        }
      } catch (error) {
        console.error('置顶操作失败:', error);
        const errorKey = stickTop ? 'addStickTopFailText' : 'deleteStickTopFailText';
        wx.showToast({
          title: t(errorKey),
          icon: 'none'
        });
      }
    },

    handleSessionItemLeftSlide(e: any) {
      const { conversationId } = e.detail
      this.setData({
        currentMoveSessionId: conversationId
      })
    },

    handleScroll() {
      // 滚动时隐藏操作菜单
      if (this.data.currentMoveSessionId) {
        this.setData({
          currentMoveSessionId: ''
        })
      }
    },

    handleScrollToLower() {
      if ((this.data.conversationList || []).length === 0) return
      this.handleLoadMore()
    },

    async handleLoadMore() {
      const { enableV2CloudConversation, loadingMore, noMore, limit } = this.data
      if (loadingMore || noMore) return
      const app = getApp<IAppOption>()
      const { store } = app.globalData
      if (!store) return
      const baseList = enableV2CloudConversation
        ? (store && store.uiStore && store.uiStore.conversations) || []
        : (store && store.uiStore && store.uiStore.localConversations) || []
      const lastItem = Array.isArray(baseList) && baseList.length > 0 ? baseList[baseList.length - 1] : null
      const offset = lastItem && typeof lastItem.sortOrder === 'number' ? lastItem.sortOrder : 0
      this.setData({ loadingMore: true })
      try {
        if (enableV2CloudConversation) {
          if (store.conversationStore && store.conversationStore.getConversationListActive) {
            const res = await store.conversationStore.getConversationListActive(offset, limit)
            const size = res && res.conversationList ? res.conversationList.length : 0
            if (size < limit) {
              this.setData({ noMore: true })
            }
          }
        } else {
          if (store.localConversationStore && store.localConversationStore.getConversationListActive) {
            const res = await store.localConversationStore.getConversationListActive(offset, limit)
            const size = res && res.conversationList ? res.conversationList.length : 0
            if (size < limit) {
              this.setData({ noMore: true })
            }
          }
        }
      } catch (e) {
      } finally {
        this.setData({ loadingMore: false })
      }
    },

    deleteConversation(conversationId: string) {
      // 删除会话逻辑
      const conversationList = this.data.conversationList.filter(
        (item: any) => item.conversationId !== conversationId
      )
      this.setData({ conversationList })
    },

    updateConversationStickTop(conversationId: string, stickTop: boolean) {
      // 更新置顶状态
      const conversationList = this.data.conversationList.map((item: any) => {
        if (item.conversationId === conversationId) {
          return { ...item, stickTop }
        }
        return item
      })
      this.setData({ conversationList })
    },

    bindEvents() {
      // 绑定全局事件
    },

    unbindEvents() {
      // 解绑全局事件
    }
  }
})
