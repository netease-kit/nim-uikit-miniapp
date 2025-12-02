Page({
  data: {
    team: null as any,
    teamId: '',
    loading: false,
    loadingText: '加载中...',
    statusBarHeight: 0,
    avatarColor: '#ccc',
    displayName: '群',
    showNameEdit: false,
    showIntroEdit: false,
    editNameValue: '',
    editIntroValue: '',
    canEditName: true,
    canEditIntro: true
  },

  onLoad(options: any) {    
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight || 0
    })

    // 获取团队ID
    const teamId = options.teamId
    if (!teamId) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }

    this.setData({ teamId })
    this.loadTeamInfo()
  },

  onShow() {
    // 页面显示时重新加载团队信息
    if (this.data.teamId) {
      this.loadTeamInfo()
    }
  },

  /**
   * 加载团队信息
   */
  async loadTeamInfo() {
    try {
      this.setData({ 
        loading: true,
        loadingText: '加载中...'
      })

      // 获取全局应用实例
      const app = getApp<IAppOption>()
      const { nim, store } = app.globalData

      if (!nim || !store) {
        throw new Error('NIM或Store实例未初始化')
      }

      // 获取团队信息 - 使用store获取以保持与群设置页面一致
      const teamInfo = store.teamStore.teams.get(this.data.teamId)
      if (teamInfo) {
        // 生成头像颜色和显示名称
        const avatarColor = this.generateAvatarColor(this.data.teamId)
        const displayName = this.getDisplayName(this.data.teamId)
        
        this.setData({ 
          team: teamInfo,
          avatarColor,
          displayName
        })
      } else {
        wx.showToast({
          title: '获取群信息失败',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('加载团队信息失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 返回上一页
   */
  handleBack() {
    wx.navigateBack()
  },

  /**
   * 点击头像
   */
  async handleAvatarClick() {
    const hasPermission = await this.checkEditPermission()
    if (!hasPermission) {
      return
    }
    wx.navigateTo({
      url: `/pages/team-avatar-edit/index?teamId=${this.data.teamId}`
    })
  },



  /**
   * 点击群名称
   */
  async handleNameClick() {
    const hasPermission = await this.checkEditPermission()
    this.setData({ canEditName: !!hasPermission })
    this.showNameEditModal((this.data.team && this.data.team.name) ? this.data.team.name : '')
  },

  /**
   * 更新群名称
   */
  async updateTeamName(name: string) {
    if (!name) {
      this.showError('群名称不能为空')
      return
    }

    if (name.length > 30) {
      this.showError('群名称不能超过30个字符')
      const truncated = name.slice(0, 30)
      this.showNameEditModal(truncated)
      return
    }

    try {
      // 检查网络状态
      const hasNetwork = await this.checkNetworkStatus()
      if (!hasNetwork) {
        return
      }

      this.setData({ 
        loading: true,
        loadingText: '更新中...'
      })

      const app = getApp<IAppOption>()
      const { store } = app.globalData

      if (!store) {
        throw new Error('Store实例未初始化')
      }

      // 使用store的updateTeamActive方法，参考Vue版本和头像编辑页面的实现
      await store.teamStore.updateTeamActive({
        teamId: this.data.teamId,
        info: {
          name: name
        }
      })
      
      this.setData({
        'team.name': name,
        loading: false
      })

      this.showSuccess('群名称更新成功')
    } catch (error) {
      console.error('更新群名称失败', error)
      this.setData({ loading: false })
      
      // 检查是否是权限错误
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 403 || error.code === 'NO_PERMISSION') {
          this.showError('没有权限修改群名称')
          return
        }
      }
      
      this.showError('更新失败，请重试')
    }
  },

  /**
   * 点击群介绍
   */
  async handleIntroClick() {
    const hasPermission = await this.checkEditPermission()
    this.setData({ canEditIntro: !!hasPermission })
    this.showIntroEditModal((this.data.team && this.data.team.intro) ? this.data.team.intro : '')
  },

  /**
   * 更新群介绍
   */
  async updateTeamIntro(intro: string) {
    if (intro.length > 100) {
      this.showError('群介绍不能超过100个字符')
      const truncated = intro.slice(0, 100)
      this.showIntroEditModal(truncated)
      return
    }

    try {
      // 检查网络状态
      const hasNetwork = await this.checkNetworkStatus()
      if (!hasNetwork) {
        return
      }

      this.setData({ 
        loading: true,
        loadingText: '更新中...'
      })

      const app = getApp<IAppOption>()
      const { store } = app.globalData

      if (!store) {
        throw new Error('Store实例未初始化')
      }

      // 使用store的updateTeamActive方法，参考Vue版本和头像编辑页面的实现
      await store.teamStore.updateTeamActive({
        teamId: this.data.teamId,
        info: {
          intro: intro
        }
      })
      
      // 更新本地数据
      this.setData({
        'team.intro': intro,
        loading: false
      })

      this.showSuccess('群介绍更新成功')
    } catch (error) {
      console.error('更新群介绍失败', error)
      this.setData({ loading: false })
      
      // 检查是否是权限错误
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 403 || error.code === 'NO_PERMISSION') {
          this.showError('没有权限修改群介绍')
          return
        }
      }
      
      this.showError('更新失败，请重试')
    }
  },

  showNameEditModal(content: string) {
    this.setData({
      showNameEdit: true,
      editNameValue: content || ''
    })
  },

  showIntroEditModal(content: string) {
    this.setData({
      showIntroEdit: true,
      editIntroValue: content || ''
    })
  },

  handleNameInput(e: any) {
    let value = (e && e.detail && e.detail.value) ? e.detail.value : ''
    if (value.length > 30) {
      value = value.slice(0, 30)
    }
    this.setData({ editNameValue: value })
  },

  handleIntroInput(e: any) {
    let value = (e && e.detail && e.detail.value) ? e.detail.value : ''
    if (value.length > 100) {
      value = value.slice(0, 100)
    }
    this.setData({ editIntroValue: value })
  },

  closeNameEdit() {
    this.setData({ showNameEdit: false })
  },

  closeIntroEdit() {
    this.setData({ showIntroEdit: false })
  },

  confirmNameEdit() {
    if (!this.data.canEditName) {
      return
    }
    const value = (this.data.editNameValue || '').trim()
    if (!value) {
      this.showError('群名称不能为空')
      return
    }
    this.updateTeamName(value)
    this.setData({ showNameEdit: false })
  },

  confirmIntroEdit() {
    if (!this.data.canEditIntro) {
      return
    }
    const value = (this.data.editIntroValue || '').trim()
    this.updateTeamIntro(value)
    this.setData({ showIntroEdit: false })
  },

  /**
   * 检查编辑权限
   */
  async checkEditPermission(): Promise<boolean> {
    const team = this.data.team
    if (!team) {
      wx.showToast({
        title: '群信息加载中',
        icon: 'error'
      })
      return false
    }

    try {
      // 获取当前用户信息
      const app = getApp<IAppOption>()
      const { nim, store } = app.globalData

      if (!nim || !store) {
        throw new Error('NIM或Store实例未初始化')
      }

      const currentUser = store.userStore.myUserInfo
      const currentUserId = (currentUser && currentUser.accountId) ? currentUser.accountId : null

      if (!currentUserId) {
        wx.showToast({
          title: '用户信息获取失败',
          icon: 'error'
        })
        return false
      }

      // 获取团队成员信息 - 修复API调用方式
      const teamMembers = store.teamMemberStore.getTeamMember(this.data.teamId) || []
      
      // 检查是否是群主或管理员 - 修复权限判断逻辑
      const isOwner = team.ownerAccountId === currentUserId
      const isManager = Array.isArray(teamMembers) && teamMembers.some((member: any) => 
        member.accountId === currentUserId && 
        member.memberRole === 'manager'
      )

      if (!isOwner && !isManager) {
        // wx.showToast({
        //   title: '您无权限修改',
        //   icon: 'error'
        // })
        return false
      }

      return true
    } catch (error) {
      console.error('检查编辑权限失败', error)
      wx.showToast({
        title: '权限检查失败',
        icon: 'error'
      })
      return false
    }
  },

  /**
   * 生成头像背景颜色
   */
  generateAvatarColor(teamId: string): string {
    if (!teamId) {
      return '#ccc';
    }

    // 参考avatar组件的颜色生成算法
    const colors = [
      '#60B2FF', '#6AC4DC', '#73E6A6', '#A6E663',
      '#F2C94C', '#F2994A', '#EB5757', '#BB6BD9',
      '#9B59B6', '#3498DB', '#1ABC9C', '#2ECC71'
    ];
    
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  },

  /**
   * 获取显示名称（teamId后两位）
   */
  getDisplayName(teamId: string): string {
    if (!teamId) {
      return '群';
    }
    // 取teamId的后两位数字/字符
    return teamId.slice(-2);
  },

  /**
   * 检查网络状态
   */
  async checkNetworkStatus(): Promise<boolean> {
    try {
      const networkType = await new Promise<string>((resolve) => {
        wx.getNetworkType({
          success: (res) => resolve(res.networkType),
          fail: () => resolve('none')
        })
      })

      if (networkType === 'none') {
        wx.showToast({
          title: '网络连接失败，请检查网络设置',
          icon: 'error',
          duration: 2000
        })
        return false
      }

      return true
    } catch (error) {
      console.error('检查网络状态失败:', error)
      wx.showToast({
        title: '网络检查失败',
        icon: 'error'
      })
      return false
    }
  },

  /**
   * 显示成功提示
   */
  showSuccess(message: string) {
    wx.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  },

  /**
   * 显示错误提示
   */
  showError(message: string) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    })
  }
})
