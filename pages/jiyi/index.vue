<template>
  <view class="memory-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="greeting">恋爱长河</text>
      <text class="subtext">  沿着水墨长河，记录你们的每一个恋爱阶段</text>
    </view>

    <!-- 水墨河流背景与阶段容器 -->
    <view class="river-wrapper" :class="{ active: isRiverActive }" @mouseenter="setHover(true)" @mouseleave="setHover(false)" @click="onRiverClick" @touchstart="onRiverClick">
      <!-- 背景底图 -->
      <image class="river-bg" src="/static/changhe/ditu.jpg" mode="aspectFill" />
      <view v-if="!isRiverActive" class="hover-hint">将鼠标移动到长河上显示阶段（移动端请点击）</view>
      <!-- 选择位置提示与临时节点 -->
      <view v-if="showAdd && selectPosMode" class="select-hint">在长河图片上点击设置节点位置</view>
      <view v-if="tempPos" class="temp-dot" :style="{ top: tempPos.top + '%', left: tempPos.left + '%' }"></view>

      <!-- 阶段卡片：沿河分布 -->
      <view
        v-for="(stage, idx) in stages"
        :key="idx"
        class="stage-card"
        :class="stage.side"
        :style="{ top: stage.top + '%', left: (stage.left || 50) + '%' }"
        @mouseenter="setStageHover(idx, true)"
        @mouseleave="setStageHover(idx, false)"
        @click="openStage(stage)"
      >
        <view class="stage-dot"></view>
        <!-- 悬浮后按需渲染对应文本框（性能更优）-->
        <view v-if="isRiverActive && hoveredIdx === idx" class="stage-popup" :class="stage.side">
          <text class="stage-title">{{ stage.title }}</text>
          <text class="stage-date">{{ stage.date }}</text>
          <text class="stage-desc">{{ stage.summary }}</text>
        </view>
      </view>

      <!-- 添加阶段按钮 -->
      <view class="add-stage" @click="showAdd = true">
        <text class="add-icon">＋</text>
        <text class="add-text">新增阶段</text>
      </view>
    </view>

    <!-- 阶段详情弹窗 -->
    <view v-if="showDetail" class="modal-mask" @click="closeDetail">
      <view class="modal" @click.stop>
        <text class="modal-title">{{ currentStage.title }}</text>
        <text class="modal-sub">{{ currentStage.date }}</text>
        <text class="modal-desc">{{ currentStage.description || currentStage.summary }}</text>
        <view class="modal-actions">
          <button class="btn" @click="closeDetail">关闭</button>
        </view>
      </view>
    </view>

    <!-- 新增阶段弹窗 -->
    <view v-if="showAdd" class="modal-mask" @click="cancelAdd">
      <view class="modal" @click.stop>
        <text class="modal-title">新增恋爱阶段</text>
        <view class="form">
          <view class="form-item">
            <text class="label">标题</text>
            <input class="input" v-model="form.title" placeholder="如：初遇、表白、第一次旅行" />
          </view>
          <view class="form-item">
            <text class="label">日期</text>
            <input class="input" v-model="form.date" placeholder="如：2023-05-20" />
          </view>
          <view class="form-item">
            <text class="label">摘要</text>
            <input class="input" v-model="form.summary" placeholder="一句话描述该阶段" />
          </view>
          <view class="form-item">
            <text class="label">详细描述</text>
            <textarea class="textarea" v-model="form.description" placeholder="记录更详细的故事..."></textarea>
          </view>
          <view class="form-item">
            <text class="label">位置侧边</text>
            <picker :range="sideOptions" :value="form.sideIndex" @change="onSideChange">
              <view class="picker-value">{{ sideOptions[form.sideIndex] }}</view>
            </picker>
          </view>
          <view class="form-item">
            <button class="btn primary" @click="onStartSelectPosition">在长河上选择位置</button>
            <text v-if="form.top !== null">已选择：Top {{ (form.top||0).toFixed(1) }}%，Left {{ (form.left||0).toFixed(1) }}%</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="cancelAdd">取消</button>
          <button class="btn primary" @click="saveAdd">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stages: [
        { title: '初遇', date: '2022-03-12', summary: '第一次见面，怦然心动', description: '图书馆偶遇，笑容很温暖。', side: 'left', top: 6 },
        { title: '表白', date: '2022-05-20', summary: '确定关系的那一天', description: '晚风微醺，你说我们在一起吧。', side: 'right', top: 18 },
        { title: '第一次旅行', date: '2022-08-15', summary: '海边日落很美', description: '一起踏浪、看日出，拍了很多照片。', side: 'left', top: 32 },
        { title: '第一次共度新年', date: '2023-01-01', summary: '倒数的那一刻拥抱', description: '在家做了很多好吃的，烟花很绚烂。', side: 'right', top: 46 },
        { title: '见家长', date: '2023-03-18', summary: '紧张又期待', description: '叔叔阿姨都很亲切，准备了礼物。', side: 'left', top: 60 },
        { title: '同居', date: '2023-09-01', summary: '开启新的生活', description: '一起装修小家，买了绿植。', side: 'right', top: 74 },
        { title: '订婚', date: '2024-02-14', summary: '玫瑰与承诺', description: '在一起更坚定了彼此。', side: 'left', top: 88 }
      ],
      isRiverActive: false,
      hoveredIdx: -1,
      showDetail: false,
      currentStage: {},
      showAdd: false,
      form: {
        title: '',
        date: '',
        summary: '',
        description: '',
        sideIndex: 0,
        top: null,
        left: null,
      },
      sideOptions: ['左侧', '右侧'],
      selectPosMode: false,
      tempPos: null,
    };
  },
  methods: {
    onSideChange(e) {
      // 微信/uni picker change 事件：e.detail.value 为索引
      this.form.sideIndex = Number(e.detail.value || 0);
    },
    setHover(v) {
      // PC: mouseenter/mouseleave 控制；移动端点击触发
      this.isRiverActive = !!v;
      if (!v) this.hoveredIdx = -1;
    },
    onStartSelectPosition() {
      // 进入选点模式：关闭弹窗，激活河流交互
      this.selectPosMode = true;
      this.showAdd = false;
      this.isRiverActive = true;
      this.tempPos = null;
      uni.showToast({ title: '请在长河上点击选择位置', icon: 'none' });
    },
    onRiverClick(e) {
      // 仅在新增阶段选择位置模式下处理点击/触摸
      if (!(this.selectPosMode)) return;
      const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e.detail || {};
      const pageX = touch.pageX || touch.x || 0;
      const pageY = touch.pageY || touch.y || 0;
      uni.createSelectorQuery().in(this).select('.river-wrapper').boundingClientRect(rect => {
        if (!rect || !rect.width || !rect.height) return;
        const leftPct = Math.max(0, Math.min(100, ((pageX - rect.left) / rect.width) * 100));
        const topPct = Math.max(0, Math.min(100, ((pageY - rect.top) / rect.height) * 100));
        this.form.left = leftPct;
        this.form.top = topPct;
        this.tempPos = { left: leftPct, top: topPct };
        this.selectPosMode = false;
        this.showAdd = true; // 选点完成后回到弹窗显示坐标
        uni.showToast({ title: '位置已选择', icon: 'none' });
      }).exec();
    },
    setStageHover(idx, v) {
      if (!this.isRiverActive) return;
      this.hoveredIdx = v ? idx : -1;
    },
    openStage(stage) {
      if (!this.isRiverActive) return; // 仅在激活时可点击卡片
      this.currentStage = stage;
      this.showDetail = true;
    },
    closeDetail() {
      this.showDetail = false;
      this.currentStage = {};
    },
    cancelAdd() {
      this.showAdd = false;
      this.resetForm();
    },
    saveAdd() {
      if (!this.form.title || !this.form.date) {
        uni.showToast({ title: '请填写标题和日期', icon: 'none' });
        return;
      }
      const side = this.form.sideIndex === 0 ? 'left' : 'right';
      const top = this.form.top != null ? this.form.top : this.computeNextTop();
      const left = this.form.left != null ? this.form.left : 50;
      this.stages.push({
        title: this.form.title,
        date: this.form.date,
        summary: this.form.summary,
        description: this.form.description,
        side,
        top,
        left
      });
      this.showAdd = false;
      this.selectPosMode = false;
      this.tempPos = null;
      this.resetForm();
      uni.showToast({ title: '已新增阶段', icon: 'none' });
    },
    computeNextTop() {
      if (this.stages.length === 0) return 6;
      const last = this.stages[this.stages.length - 1];
      // 按照竖向百分比分布，每次向下递增 10-14
      return Math.min(94, last.top + 12);
    },
    resetForm() {
      this.form = { title: '', date: '', summary: '', description: '', sideIndex: 0 };
    }
  }
}
</script>

<style>
.memory-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding-bottom: 40rpx;
}

.header {
  padding: 40rpx 30rpx 10rpx 30rpx;
}
.greeting {
  font-size: 44rpx;
  color: #2b2b2b;
  font-weight: 700;
}
.subtext {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #7a7a7a;
}

/* 水墨河流区域 */
.river-wrapper {
  position: relative;
  margin: 20rpx;
  height: 1200rpx; /* 可根据内容增减 */
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}
.river-wrapper .hover-hint {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background: rgba(255,255,255,0.9); color: #2b2b2b; border-radius: 16rpx;
  padding: 20rpx 24rpx; font-size: 26rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.select-hint {
  position: absolute; left: 50%; bottom: 24rpx; transform: translateX(-50%);
  background: rgba(43,173,129,0.95); color: #ffffff; border-radius: 999rpx;
  padding: 12rpx 24rpx; font-size: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.temp-dot { position: absolute; width: 18rpx; height: 18rpx; border-radius: 9rpx; background: #ff6b6b; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.12); }
.river-wrapper.active .hover-hint { display: none; }
.river-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.9) contrast(1.05);
}

/* 阶段卡片沿河分布 */
.stage-card {
  position: absolute;
  width: auto;
  min-height: 32rpx; /* 仅节点尺寸 */
  background: transparent;
  border-radius: 20rpx;
  padding: 0;
}
.stage-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 9rpx;
  background: #2ecc71;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.12);
}
/* 悬浮后显示的文本框 */
.stage-popup {
  position: absolute;
  top: -8rpx;
  /* 默认靠近节点的相反侧以避免遮挡 */
  max-width: 62%;
  background: rgba(255,255,255,0.95);
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
}
.stage-popup.left { left: 28rpx; }
.stage-popup.right { right: 28rpx; }
.stage-title { font-size: 30rpx; font-weight: 700; color: #2b2b2b; }
.stage-date { margin-top: 6rpx; font-size: 24rpx; color: #7a7a7a; }
.stage-desc { margin-top: 8rpx; font-size: 24rpx; color: #555; }
.stage-card.left { left: 4%; }
.stage-card.right { right: 4%; }
.stage-dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 9rpx;
  background: #2ecc71;
  margin-top: 10rpx;
}
.stage-content { flex: 1; }
.stage-title { font-size: 30rpx; font-weight: 700; color: #2b2b2b; }
.stage-date { margin-top: 6rpx; font-size: 24rpx; color: #7a7a7a; }
.stage-desc { margin-top: 8rpx; font-size: 24rpx; color: #555; }

/* 新增阶段按钮 */
.add-stage {
  position: absolute;
  bottom: 20rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #ffffff;
  border-radius: 999rpx;
  padding: 16rpx 28rpx;
  box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.add-icon { font-size: 32rpx; color: #2ecc71; font-weight: 700; }
.add-text { font-size: 26rpx; color: #2b2b2b; }

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.modal {
  width: 86%;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx 26rpx;
}
.modal-title { font-size: 34rpx; font-weight: 700; color: #2b2b2b; }
.modal-sub { margin-top: 8rpx; font-size: 26rpx; color: #7a7a7a; }
.modal-desc { margin-top: 16rpx; font-size: 26rpx; color: #555; line-height: 1.6; }
.modal-actions { margin-top: 20rpx; display: flex; justify-content: flex-end; gap: 16rpx; }
.btn { padding: 16rpx 26rpx; border-radius: 12rpx; font-size: 26rpx; }
.btn.primary { background: #2ecc71; color: #ffffff; }
.btn.secondary { background: #f0f0f0; color: #333; }

/* 表单样式 */
.form { margin-top: 14rpx; }
.form-item { margin-top: 16rpx; }
.label { font-size: 26rpx; color: #4a4a4a; }
.input { margin-top: 8rpx; border: 1rpx solid #e6e6e6; border-radius: 12rpx; padding: 14rpx; font-size: 26rpx; }
.textarea { margin-top: 8rpx; border: 1rpx solid #e6e6e6; border-radius: 12rpx; padding: 14rpx; font-size: 26rpx; min-height: 160rpx; }
.picker-value { margin-top: 8rpx; font-size: 26rpx; color: #2b2b2b; padding: 14rpx; border: 1rpx solid #e6e6e6; border-radius: 12rpx; }
</style>
