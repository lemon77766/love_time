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
      <!-- 已删除悬停提示 -->
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
        @click="openStage(stage)"
      >
        <!-- 蓝色心形标记点 -->
        <view class="stage-marker">
          <text class="heart-icon">💙</text>
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
      <view class="modal detail-modal" @click.stop>
        <image class="detail-bg-image" src="/static/changhe/xinfeng.jpg" mode="aspectFill"></image>
        <view class="detail-content-wrapper">
          <text class="detail-title">{{ currentStage.title }}</text>
          <text class="detail-date">{{ currentStage.date }}</text>
          <view class="detail-content">
            <text class="detail-desc" v-if="currentStage.description">{{ currentStage.description }}</text>
            <text class="detail-empty" v-else>暂无详细描述</text>
          </view>
          <view class="modal-actions">
            <button class="btn" @click="closeDetail">关闭</button>
          </view>
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
            <text class="label">详细描述</text>
            <textarea class="textarea" v-model="form.description" placeholder="记录更详细的故事..."></textarea>
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
      stages: [],  // 清空默认阶段，由用户自己添加
      isRiverActive: false,
      hoveredIdx: -1,
      showDetail: false,
      currentStage: {},
      showAdd: false,
      form: {
        title: '',
        date: '',
        description: '',
        top: null,
        left: null,
      },
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
      // 移除 isRiverActive 限制，允许随时点击查看详情
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
      // 根据left位置自动判断侧边
      const side = (this.form.left != null && this.form.left > 50) ? 'right' : 'left';
      const top = this.form.top != null ? this.form.top : this.computeNextTop();
      const left = this.form.left != null ? this.form.left : 50;
      this.stages.push({
        title: this.form.title,
        date: this.form.date,
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
      this.form = { title: '', date: '', description: '', top: null, left: null };
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
/* 已删除 .hover-hint 样式 */
.select-hint {
  position: absolute; left: 50%; bottom: 24rpx; transform: translateX(-50%);
  background: rgba(43,173,129,0.95); color: #ffffff; border-radius: 999rpx;
  padding: 12rpx 24rpx; font-size: 24rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08);
}
.temp-dot { position: absolute; width: 18rpx; height: 18rpx; border-radius: 9rpx; background: #ff6b6b; box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.12); }
/* 已删除 .river-wrapper.active .hover-hint 样式 */
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
  width: 40rpx;
  height: 40rpx;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 添加可见的标记点 - 蓝色心形设计 */
.stage-marker {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  filter: drop-shadow(0 4rpx 12rpx rgba(52, 152, 219, 0.5));
  transition: all 0.3s ease;
}

/* 心形图标 */
.heart-icon {
  font-size: 32rpx;
  line-height: 1;
  animation: heartbeat 1.5s infinite;
}

/* 心跳动画 */
@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.2);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.2);
  }
  40% {
    transform: scale(1);
  }
}

/* 添加蓝色光晕效果 */
.stage-marker::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 152, 219, 0.4) 0%, rgba(41, 128, 185, 0.2) 50%, transparent 70%);
  animation: pulse-heart 2s infinite;
}

@keyframes pulse-heart {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.stage-card:active .stage-marker {
  transform: scale(1.3);
  filter: drop-shadow(0 6rpx 16rpx rgba(52, 152, 219, 0.7));
}

.stage-card:active .heart-icon {
  animation: none;
  transform: scale(1.2);
}

.stage-card.left { left: 4%; }
.stage-card.right { right: 4%; }
/* 已删除重复的 .stage-dot 样式 */
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
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}
.modal {
  width: 86%;
  max-width: 600rpx;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 12rpx 40rpx rgba(0,0,0,0.15);
}

/* 详情弹窗 - 使用默认样式 */
.detail-modal {
  position: relative;
  overflow: hidden;
  padding: 0;
  min-height: 600rpx; /* 设置最小高度，让背景图可以显示 */
}

/* 背景图片 */
.detail-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 1; /* 确保图片不透明 */
}

/* 内容容器 - 覆盖在背景图上 */
.detail-content-wrapper {
  position: relative;
  z-index: 1;
  padding: 40rpx 32rpx;
  background: rgba(255, 255, 255, 0.5); /* 降低到50%透明度，背景图更明显 */
  min-height: 600rpx; /* 与弹窗高度一致 */
}

.detail-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2b2b2b;
  display: block;
}

.detail-date {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7a7a7a;
  display: block;
}

.detail-content {
  margin-top: 16rpx;
}

.detail-desc {
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
  display: block;
}

.detail-empty {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  padding: 20rpx 0;
  display: block;
}

/* 原有样式 */
.modal-title { font-size: 34rpx; font-weight: 700; color: #2b2b2b; }
.modal-sub { margin-top: 8rpx; font-size: 26rpx; color: #7a7a7a; }
.modal-desc { margin-top: 16rpx; font-size: 26rpx; color: #555; line-height: 1.6; }
.modal-actions { margin-top: 60rpx; display: flex; justify-content: flex-end; gap: 16rpx; }
.btn { padding: 16rpx 26rpx; border-radius: 12rpx; font-size: 26rpx; border: none; }
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
