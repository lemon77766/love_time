// Pixi.js 7.x 小程序适配器（适配 Canvas 2D）
const systemInfo = wx.getSystemInfoSync();
const pixelRatio = systemInfo.pixelRatio;

// 适配全局对象（小程序无window/document）
if (!global.window) {
  global.window = {
    devicePixelRatio: pixelRatio,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}
if (!global.document) {
  global.document = {
    createElement: (tag) => {
      if (tag === 'canvas') return wx.createCanvasContext('live2dCanvas');
      return {};
    },
    body: {}
  };
}

// 强制使用Canvas渲染（小程序不支持WebGL）
const PIXI = require('pixi.js');
PIXI.utils.isWebGLSupported = () => false;
PIXI.Renderer = PIXI.CanvasRenderer;
PIXI.settings.RESOLUTION = pixelRatio;

module.exports = PIXI;