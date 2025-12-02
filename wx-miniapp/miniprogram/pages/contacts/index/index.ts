Page({
  data: {
    
  },

  onLoad() {
    
  },

  onShow() {
    const app = getApp() as any
    if (app && typeof app.syncTabBarRedDot === 'function') {
      try { app.syncTabBarRedDot() } catch {}
    }
  },

  onHide() {
    
  },

  onUnload() {
    
  }
});
