Component({
  properties: {
    // 外部样式类
    extClass: {
      type: String,
      value: ''
    },
    // 用户账号
    account: {
      type: String,
      value: ''
    },
    // 用户昵称
    nick: {
      type: String,
      value: ''
    },
    // 用户头像
    avatar: {
      type: String,
      value: ''
    },
    alias: {
      type: String,
      value: ''
    },
    // 自定义样式
    customStyle: {
      type: Object,
      value: {}
    },
    // 自定义样式类
    customClass: {
      type: String,
      value: ''
    },
    // 国际化文本
    nameText: {
      type: String,
      value: '姓名'
    },
    accountText: {
      type: String,
      value: '账号'
    },
    copySuccessText: {
      type: String,
      value: '复制成功'
    },
    copyFailText: {
      type: String,
      value: '复制失败'
    },
    // 昵称文本
    nickText: {
      type: String,
      value: '昵称'
    },
  },

  data: {
    customStyleStr: ''
  },

  observers: {
    'customStyle': function(customStyle: Record<string, string | number>) {
      this._updateCustomStyle(customStyle);
    }
  },

  lifetimes: {
    attached() {
      this._updateCustomStyle(this.data.customStyle);
    },
    detached() {
      // 清理工作
    }
  },

  methods: {
    /**
     * 更新自定义样式
     */
    _updateCustomStyle(customStyle: Record<string, string | number>) {
      if (customStyle && typeof customStyle === 'object') {
        const styleStr = Object.keys(customStyle)
          .map(key => `${key}: ${customStyle[key]}`)
          .join('; ');
        this.setData({
          customStyleStr: styleStr
        });
      }
    },

    /**
     * 复制账号
     */
    copyAccount() {      
      try {
        // 微信小程序复制到剪贴板
        wx.setClipboardData({
          data: this.data.account,
          success: () => {
            this._showToast(this.data.copySuccessText, 'success');
            this.triggerEvent('copySuccess', { account: this.data.account });
          },
          fail: () => {
            this._showToast(this.data.copyFailText, 'error');
            this.triggerEvent('copyFail', { account: this.data.account });
          }
        });
      } catch (error) {
        this._showToast(this.data.copyFailText, 'error');
        this.triggerEvent('copyFail', { account: this.data.account });
      }
    },

    /**
     * 显示提示信息
     */
    _showToast(message: string, type: string = 'info') {
      // 可以使用微信小程序原生的提示
      wx.showToast({
        title: message,
        icon: type === 'success' ? 'success' : 'none',
        duration: 2000
      });
      
      // 或者触发事件让父组件处理
      this.triggerEvent('showToast', {
        message,
        type,
        duration: 2000
      });
    },

    /**
     * 获取用户信息（供外部调用）
     */
    getUserInfo() {
      return {
        account: this.data.account,
        nick: this.data.nick,
        alias: this.data.alias
      };
    },
  }
});