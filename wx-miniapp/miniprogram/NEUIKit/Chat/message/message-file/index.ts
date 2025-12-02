Component({
  properties: {
    msg: {
      type: Object,
      value: {}
    }
  },

  data: {
    iconType: 'icon-weizhiwenjian',
    prefixName: '',
    suffixName: '',
    fileSize: '',
    fileOpening: false,
    fileClickCooldown: false,
    audioPlaying: false,
    isAudio: false,
    audioUrl: '',
    audioCurrent: 0,
    audioDuration: 0,
    audioPercent: 0
  },

  observers: {
    'msg': function(msg: any) {
      if (msg && msg.attachment) {
        const { name = '', ext = '', size = 0, fileSize = 0, url = '' } = msg.attachment;
        
        // 提取文件名与后缀
        const { baseName, extension } = this.extractFileNameAndExt(name, url, ext);
        
        // 文件类型图标映射
        const fileIconMap: { [key: string]: string } = {
          pdf: 'icon-PDF',
          word: 'icon-Word',
          excel: 'icon-Excel',
          ppt: 'icon-PPT',
          zip: 'icon-RAR1',
          txt: 'icon-qita',
          img: 'icon-tupian2',
          audio: 'icon-yinle',
          video: 'icon-shipin'
        };
        
        // 获取文件类型
        const fileType = this.getFileType(extension);
        const iconType = fileIconMap[fileType] || 'icon-weizhiwenjian';
        
        // 处理文件名显示（前缀为基础名，后缀为 .ext）
        const prefixName = baseName;
        const suffixName = extension ? `${extension}` : '';
        
        // 格式化文件大小（兼容 fileSize 字段）
        const displaySize = this.parseFileSize(size || fileSize || 0);
        
        const isAudio = fileType === 'audio'
        const audioUrl = isAudio ? url : ''
        this.setData({
          iconType,
          prefixName,
          suffixName,
          fileSize: displaySize,
          isAudio,
          audioUrl
        });
      }
    }
  },

  methods: {
    // 提取文件名与扩展名
    extractFileNameAndExt(rawName: string, url: string, rawExt: string): { baseName: string; extension: string } {
      let name = rawName || '';
      // 如果 name 不存在，尝试从 url 中解析文件名
      if (!name && url) {
        try {
          const decoded = decodeURIComponent(url);
          const pathEnd = decoded.split('?')[0];
          const segments = pathEnd.split('/');
          name = segments[segments.length - 1] || '';
        } catch {
          // 保底不抛错
          name = '';
        }
      }
      let ext = (rawExt || '').toLowerCase();
      // 如果 ext 为空，尝试从 name 中解析
      const dotIndex = name.lastIndexOf('.');
      if (!ext && dotIndex > -1 && dotIndex < name.length - 1) {
        ext = name.slice(dotIndex + 1).toLowerCase();
      }
      // 基础名为去掉扩展名的部分
      const baseName = dotIndex > -1 ? name.slice(0, dotIndex) : name;
      return { baseName, extension: ext };
    },
    // 获取文件类型
    getFileType(ext: string): string {
      const e = (ext || '').toLowerCase();
      const extension = e.startsWith('.') ? e.slice(1) : e;
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
        return 'img';
      }
      if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(extension)) {
        return 'audio';
      }
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
        return 'video';
      }
      if (['doc', 'docx'].includes(extension)) {
        return 'word';
      }
      if (['xls', 'xlsx'].includes(extension)) {
        return 'excel';
      }
      if (['ppt', 'pptx'].includes(extension)) {
        return 'ppt';
      }
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
        return 'zip';
      }
      if (extension === 'pdf') {
        return 'pdf';
      }
      if (extension === 'txt') {
        return 'txt';
      }
      return 'unknown';
    },
    
    // 格式化文件大小
    parseFileSize(size: number): string {
      if (size < 1024) {
        return size + 'B';
      }
      if (size < 1024 * 1024) {
        return (size / 1024).toFixed(1) + 'KB';
      }
      if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(1) + 'MB';
      }
      return (size / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    },
    
    // 点击文件处理
  onFileClick() {
      if (this.data.fileOpening) return;
      if (this.data.fileClickCooldown) return;
      this.setData({ fileClickCooldown: true });
      setTimeout(() => {
        try { this.setData({ fileClickCooldown: false }) } catch {}
      }, 1000);
      const { msg } = this.data;
      if (msg && msg.attachment) {
        const { url, name, ext = '' } = msg.attachment;
        const { extension } = this.extractFileNameAndExt(name, url, ext);
        const type = this.getFileType(extension);
        this.setData({ fileOpening: true });
        this.triggerEvent('fileClick', { url, name, msg });
        if (!url) {
          this.setData({ fileOpening: false });
          return;
        }
        if (type === 'img') {
          wx.previewImage({ 
            current: url, 
            urls: [url],
            complete: () => { this.setData({ fileOpening: false }) }
          });
          return;
        }
        if (type === 'video') {
          wx.previewMedia({ 
            sources: [{ url, type: 'video' }], 
            current: 0,
            complete: () => { this.setData({ fileOpening: false }) }
          });
          return;
        }
        if (type === 'audio') {
          const ctx = (this as any)._audioCtx || wx.createInnerAudioContext();
          (this as any)._audioCtx = ctx;
          try { ctx.stop() } catch {}
          ctx.autoplay = true;
          ctx.src = url;
          try { ctx.play() } catch {}
          this.setData({ audioPlaying: true, fileOpening: false });
          if (!(this as any)._audioBound) {
            (this as any)._audioBound = true;
            ctx.onEnded(() => { try { this.setData({ audioPlaying: false }) } catch {} });
            ctx.onStop(() => { try { this.setData({ audioPlaying: false }) } catch {} });
            ctx.onPause(() => { try { this.setData({ audioPlaying: false }) } catch {} });
            ctx.onCanplay(() => {
              try {
                const d = (ctx as any).duration || 0
                if (d && d > 0) this.setData({ audioDuration: d })
              } catch {}
            });
            ctx.onTimeUpdate(() => {
              try {
                const current = ctx.currentTime || 0
                const duration = (ctx as any).duration || this.data.audioDuration || 0
                const percent = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0
                this.setData({ audioCurrent: current, audioDuration: duration || this.data.audioDuration, audioPercent: percent })
              } catch {}
            });
            ctx.onError(() => { try { this.setData({ audioPlaying: false }) } catch {} });
          }
          return;
        }
        wx.downloadFile({
          url: url,
          success: (res) => {
            if (res.statusCode === 200) {
              wx.openDocument({
                filePath: res.tempFilePath,
                success: () => {},
                fail: () => {
                  wx.showToast({ title: '文件打开失败', icon: 'none' });
                },
                complete: () => { this.setData({ fileOpening: false }) }
              });
            } else {
              this.setData({ fileOpening: false })
            }
          },
          fail: () => {
            wx.showToast({ title: '文件下载失败', icon: 'none' });
          },
          complete: () => { this.setData({ fileOpening: false }) }
        });
      }
    },
    onToggleAudioPlay() {
      const ctx = (this as any)._audioCtx || wx.createInnerAudioContext();
      (this as any)._audioCtx = ctx;
      if (this.data.audioUrl && !ctx.src) {
        ctx.src = this.data.audioUrl
      }
      if (this.data.audioPlaying) {
        try { ctx.pause() } catch {}
        this.setData({ audioPlaying: false })
      } else {
        try { ctx.play() } catch {}
        this.setData({ audioPlaying: true })
      }
    }
  }
});
