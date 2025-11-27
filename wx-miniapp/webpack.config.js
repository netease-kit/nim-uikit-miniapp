/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const fs = require('fs')

/**
 * 清空 dist 文件夹
 */
if (fs.existsSync(path.resolve(__dirname, 'dist'))) {
  fs.rmdirSync(path.resolve(__dirname, 'dist'), { recursive: true })
}

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'entry', 'nim_esm.js')
  },
  output: {
    filename: 'NIM_FROM_BUILD.js',
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
    // 每次构建新产物前, 能删除旧产物
    clean: true
  },
  mode: 'production',
  devtool: false,
  optimization: {
    usedExports: true
  }
}

/**
 * 将 nim-web-sdk-ng 的 esm 声明文件拷贝到 demo/esm/wxMiniApp/dist 目录下
 */
fs.cpSync(path.resolve(__dirname, 'node_modules', 'nim-web-sdk-ng', 'dist', 'esm'), path.resolve(__dirname, 'dist'), {
  recursive: true,
  filter: function (src) {
    if (src.indexOf('.js') === src.length - 3) {
      return false
    } else {
      return true
    }
  }
})
