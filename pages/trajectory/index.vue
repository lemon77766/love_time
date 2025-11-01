<template>
  <view class="trajectory-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">恋爱轨迹</text>
      <text class="subtitle">记录你们一起走过的点点滴滴</text>
    </view>

    <!-- 轨迹地图容器 -->
    <view class="map-container">
      <image class="map-bg" src="/static/trajectory/map-bg.jpg" mode="aspectFill" />
      
      <!-- 轨迹点 -->
      <view 
        v-for="(point, index) in trajectoryPoints" 
        :key="index"
        class="trajectory-point"
        :style="{ top: point.top + '%', left: point.left + '%' }"
        @click="showPointDetail(point)"
      >
        <view class="point-marker">
          <text class="point-icon">📍</text>
        </view>
        <view class="point-label">{{ point.title }}</view>
      </view>

      <!-- 轨迹连线 -->
      <view class="trajectory-line" v-if="trajectoryPoints.length > 1"></view>
    </view>

    <!-- 添加轨迹按钮 -->
    <view class="add-button" @click="showAddModal">
      <text class="add-icon">+</text>
      <text class="add-text">添加轨迹点</text>
    </view>

    <!-- 轨迹点详情弹窗 -->
    <view v-if="showDetail" class="modal-mask" @click="hidePointDetail">
      <view class="modal" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ currentPoint.title }}</text>
          <text class="modal-date">{{ currentPoint.date }}</text>
        </view>
        <view class="modal-content">
          <image v-if="currentPoint.image" :src="currentPoint.image" class="point-image" mode="aspectFill" />
          <text class="point-description">{{ currentPoint.description || '暂无描述' }}</text>
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="hidePointDetail">关闭</button>
        </view>
      </view>
    </view>

    <!-- 添加轨迹点弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="hideAddModal">
      <view class="modal" @click.stop>
        <text class="modal-title">添加轨迹点</text>
        <view class="form">
          <view class="form-item">
            <text class="label">地点名称</text>
            <input class="input" v-model="newPoint.title" placeholder="如：第一次约会的地方" />
          </view>
          <view class="form-item">
            <text class="label">日期</text>
            <input class="input" v-model="newPoint.date" placeholder="如：2023-05-20" />
          </view>
          <view class="form-item">
            <text class="label">描述</text>
            <textarea class="textarea" v-model="newPoint.description" placeholder="记录这个地点的特别回忆..."></textarea>
          </view>
          <view class="form-item">
            <text class="label">在地图上选择位置</text>
            <button class="btn primary" @click="selectPosition">选择位置</button>
            <text v-if="newPoint.top !== null" class="position-info">已选择位置</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn secondary" @click="hideAddModal">取消</button>
          <button class="btn primary" @click="addTrajectoryPoint">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      trajectoryPoints: [
        {
          title: "初遇",
          date: "2023-03-15",
          description: "第一次见面的咖啡厅",
          top: 30,
          left: 40,
          image: "/static/trajectory/meet.jpg"
        },
        {
          title: "表白",
          date: "2023-05-20",
          description: "在公园的樱花树下表白",
          top: 50,
          left: 60,
          image: "/static/trajectory/confess.jpg"
        },
        {
          title: "旅行",
          date: "2023-08-10",
          description: "第一次一起旅行",
          top: 70,
          left: 30,
          image: "/static/trajectory/travel.jpg"
        }
      ],
      showDetail: false,
      currentPoint: {},
      showAddModal: false,
      newPoint: {
        title: '',
        date: '',
        description: '',
        top: null,
        left: null,
        image: ''
      }
    };
  },
  methods: {
    showPointDetail(point) {
      this.currentPoint = point;
      this.showDetail = true;
    },
    hidePointDetail() {
      this.showDetail = false;
      this.currentPoint = {};
    },
    showAddModal() {
      this.showAddModal = true;
    },
    hideAddModal() {
      this.showAddModal = false;
      this.newPoint = {
        title: '',
        date: '',
        description: '',
        top: null,
        left: null,
        image: ''
      };
    },
    selectPosition() {
      // 模拟位置选择
      this.newPoint.top = Math.random() * 70 + 15;
      this.newPoint.left = Math.random() * 70 + 15;
      uni.showToast({ title: '位置已选择', icon: 'none' });
    },
    addTrajectoryPoint() {
      if (!this.newPoint.title || !this.newPoint.date) {
        uni.showToast({ title: '请填写地点名称和日期', icon: 'none' });
        return;
      }
      
      if (this.newPoint.top === null || this.newPoint.left === null) {
        uni.showToast({ title: '请选择位置', icon: 'none' });
        return;
      }
      
      this.trajectoryPoints.push({
        ...this.newPoint
      });
      
      this.hideAddModal();
      uni.showToast({ title: '轨迹点添加成功', icon: 'success' });
    }
  }
};
</script>

<style>
.trajectory-page {
  min-height: 100vh;
  background-color: #ffffff;
  padding-bottom: 40rpx;
}

.header {
  padding: 40rpx 30rpx 20rpx 30rpx;
}
.title {
  font-size: 44rpx;
  color: #2b2b2b;
  font-weight: 700;
  display: block;
}
.subtitle {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7a7a7a;
  display: block;
}

/* 地图容器 */
.map-container {
  position: relative;
  margin: 20rpx;
  height: 600rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.06);
}

.map-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 轨迹点 */
.trajectory-point {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.point-marker {
  width: 60rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.point-icon {
  font-size: 32rpx;
}

.point-label {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #2b2b2b;
  background: rgba(255, 255, 255, 0.9);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  white-space: nowrap;
}

/* 轨迹连线 */
.trajectory-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 添加按钮 */
.add-button {
  margin: 30rpx 20rpx 0 20rpx;
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.add-icon {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: 700;
}

.add-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: 600;
}

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

.modal-header {
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #2b2b2b;
  display: block;
}

.modal-date {
  margin-top: 8rpx;
  font-size: 26rpx;
  color: #7a7a7a;
  display: block;
}

.modal-content {
  margin-bottom: 24rpx;
}

.point-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.point-description {
  font-size: 26rpx;
  color: #555;
  line-height: 1.6;
}

/* 表单样式 */
.form {
  margin-top: 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.label {
  font-size: 26rpx;
  color: #4a4a4a;
  display: block;
  margin-bottom: 8rpx;
}

.input {
  width: 100%;
  border: 1rpx solid #e6e6e6;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 26rpx;
}

.textarea {
  width: 100%;
  border: 1rpx solid #e6e6e6;
  border-radius: 12rpx;
  padding: 14rpx;
  font-size: 26rpx;
  min-height: 120rpx;
}

.position-info {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #ff8fb3;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
}

.btn {
  padding: 16rpx 26rpx;
  border-radius: 12rpx;
  font-size: 26rpx;
  border: none;
}

.btn.primary {
  background: linear-gradient(135deg, #ff8fb3 0%, #ff7aa0 100%);
  color: #ffffff;
}

.btn.secondary {
  background: #f0f0f0;
  color: #333;
}
</style>