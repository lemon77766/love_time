<template>
  <view class="anniversary-page" :style="{ paddingTop: containerPaddingTop }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <!-- 渐变背景 -->
      <view class="navbar-gradient-bg"></view>
      <!-- 状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      <!-- 导航栏内容 -->
      <view class="navbar-content" :style="{ height: navBarHeight + 'px' }">
        <view class="navbar-left" @click="goBack">
          <text class="back-icon">←</text>
        </view>
        <view class="navbar-title">
          <text class="title-text">纪念日</text>
        </view>
        <view class="navbar-right"></view>
      </view>
    </view>
    
    <!-- 顶部背景图 -->
    <image class="top-bg" src="/subPackages/record/static/anniversary/tu.jpg" mode="aspectFill"></image>

    <view class="content">
      <view class="anniversary-list">
        <view class="anniversary-item" v-for="(item, index) in anniversaryList" :key="item.id">
          <view class="item-left" @click="editAnniversary(index)">
            <iconify-icon :icon="item.icon" :size="24" :color="item.color" class="item-icon" />
            <view class="item-info">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-date" v-if="item.date">{{ formatDate(item.date) }}</text>
            </view>
          </view>
          <view class="item-right">
            <text class="item-days" v-if="item.date">已经 <text class="days-count">{{ calculateDays(item.date) }}</text> 天</text>
            <view class="item-actions">
              <iconify-icon 
                :icon="item.remind ? 'mdi:bell' : 'mdi:bell-outline'" 
                :size="24" 
                :color="item.remind ? '#FFCC66' : '#CCCCCC'" 
                class="remind-icon" 
                @click.stop="toggleRemind(index)" 
              />
              <iconify-icon 
                icon="mdi:delete-outline" 
                :size="24" 
                color="#FF6B6B" 
                class="delete-icon" 
                @click.stop="deleteAnniversary(index)" 
              />
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-actions">
        <view class="reminder-status" v-if="hasReminders">
          <iconify-icon icon="mdi:bell" :size="18" color="#FFCC66" />
          <text>{{ reminderCount }}个提醒已设置</text>
        </view>
        <view class="reminder-status" v-else>
          <iconify-icon icon="mdi:alert-outline" :size="18" color="#FFA500" />
          <text>还没设置提醒哦</text>
        </view>
        <view class="add-anniversary-btn" @click="showAddModal = true">
          <iconify-icon icon="mdi:plus" :size="24" color="#ffffff" />
          <text>添加纪念日</text>
        </view>
      </view>
    </view>
    
    <!-- 添加纪念日弹窗 -->
    <view v-if="showAddModal" class="modal-mask" @click="showAddModal = false">
      <view class="modal" @click.stop>
        <text class="modal-title">添加纪念日</text>
        <view class="form">
          <view class="form-item">
            <text class="form-label">标题</text>
            <input class="form-input" v-model="newAnniversary.title" placeholder="请输入纪念日标题" />
          </view>
          <view class="form-item">
            <text class="form-label">日期</text>
            <picker mode="date" :value="newAnniversary.date" @change="onDateChange">
              <view class="form-input date-picker">
                {{ newAnniversary.date || '请选择日期' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">图标</text>
            <view class="icon-selector">
              <view 
                v-for="icon in iconOptions" 
                :key="icon.name"
                class="icon-option"
                :class="{ selected: newAnniversary.icon === icon.name }"
                @click="selectIcon(icon)"
              >
                <iconify-icon :icon="icon.name" :size="24" :color="icon.color" />
              </view>
            </view>
          </view>
          <view class="form-item">
            <label class="checkbox-container">
              <checkbox :checked="newAnniversary.remind" @change="onRemindChange" />
              <text class="checkbox-label">设置提醒</text>
            </label>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn cancel-btn" @click="showAddModal = false">取消</button>
          <button class="btn confirm-btn" @click="addAnniversary">确定</button>
        </view>
      </view>
    </view>
    
    <!-- 编辑纪念日弹窗 -->
    <view v-if="showEditModal" class="modal-mask" @click="showEditModal = false">
      <view class="modal" @click.stop>
        <text class="modal-title">编辑纪念日</text>
        <view class="form">
          <view class="form-item">
            <text class="form-label">标题</text>
            <input class="form-input" v-model="editingAnniversary.title" placeholder="请输入纪念日标题" />
          </view>
          <view class="form-item">
            <text class="form-label">日期</text>
            <picker mode="date" :value="editingAnniversary.date" @change="onEditDateChange">
              <view class="form-input date-picker">
                {{ editingAnniversary.date || '请选择日期' }}
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="form-label">图标</text>
            <view class="icon-selector">
              <view 
                v-for="icon in iconOptions" 
                :key="icon.name"
                class="icon-option"
                :class="{ selected: editingAnniversary.icon === icon.name }"
                @click="selectEditIcon(icon)"
              >
                <iconify-icon :icon="icon.name" :size="24" :color="icon.color" />
              </view>
            </view>
          </view>
          <view class="form-item">
            <label class="checkbox-container">
              <checkbox :checked="editingAnniversary.remind" @change="onEditRemindChange" />
              <text class="checkbox-label">设置提醒</text>
            </label>
          </view>
        </view>
        <view class="modal-actions">
          <button class="btn cancel-btn" @click="showEditModal = false">取消</button>
          <button class="btn confirm-btn" @click="saveEditedAnniversary">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      statusBarHeight: 0,
      navBarHeight: 44,
      screenWidth: 375,
      showAddModal: false,
      showEditModal: false,
      anniversaryList: [
        {
          id: 1,
          title: '我们第一次旅行',
          date: '2025-10-21',
          icon: 'mdi:airplane',
          color: '#4A90E2',
          remind: true
        },
        {
          id: 2,
          title: '圆月弯刀的生日',
          icon: 'mdi:cake',
          color: '#FFD93D',
          remind: false
        },
        {
          id: 3,
          title: '火车上不代表的生日',
          icon: 'mdi:cake',
          color: '#FFD93D',
          remind: false
        },
        {
          id: 4,
          title: '第一次接吻的日子',
          icon: 'mdi:heart-outline',
          color: '#FF91A4',
          remind: true
        },
        {
          id: 5,
          title: '第一次拥抱的日子',
          icon: 'mdi:human-handsup',
          color: '#FF91A4',
          remind: false
        },
        {
          id: 6,
          title: '我们在一起啦',
          icon: 'mdi:heart-multiple-outline',
          color: '#FF91A4',
          remind: true
        },
        {
          id: 7,
          title: '结婚纪念日',
          icon: 'mdi:ring',
          color: '#D9ACFF',
          remind: false
        }
      ],
      newAnniversary: {
        title: '',
        date: '',
        icon: 'mdi:calendar-heart',
        color: '#FF91A4',
        remind: false
      },
      editingAnniversary: {
        id: null,
        title: '',
        date: '',
        icon: 'mdi:calendar-heart',
        color: '#FF91A4',
        remind: false
      },
      iconOptions: [
        { name: 'mdi:calendar-heart', color: '#FF91A4' },
        { name: 'mdi:cake', color: '#FFD93D' },
        { name: 'mdi:airplane', color: '#4A90E2' },
        { name: 'mdi:ring', color: '#D9ACFF' },
        { name: 'mdi:heart-outline', color: '#FF91A4' },
        { name: 'mdi:human-handsup', color: '#FF91A4' },
        { name: 'mdi:heart-multiple-outline', color: '#FF91A4' },
        { name: 'mdi:gift', color: '#FF6B6B' }
      ]
    };
  },
  computed: {
    containerPaddingTop() {
      const totalHeightPx = this.statusBarHeight + this.navBarHeight;
      const pxToRpx = 750 / this.screenWidth;
      const totalHeightRpx = totalHeightPx * pxToRpx;
      return totalHeightRpx + 'rpx';
    },
    // 计算有多少个提醒
    reminderCount() {
      return this.anniversaryList.filter(item => item.remind).length;
    },
    // 是否有设置提醒
    hasReminders() {
      return this.reminderCount > 0;
    }
  },
  mounted() {
    this.getSystemInfo();
    // 初始化新纪念日的日期为今天
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.newAnniversary.date = `${year}-${month}-${day}`;
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getSystemInfo() {
      // #ifdef MP-WEIXIN
      try {
        const windowInfo = wx.getWindowInfo && wx.getWindowInfo();
        const deviceInfo = wx.getDeviceInfo && wx.getDeviceInfo();
        
        if (windowInfo && deviceInfo) {
          this.statusBarHeight = windowInfo.statusBarHeight || 0;
          this.screenWidth = windowInfo.windowWidth || 375;
        } else {
          const sysInfo = uni.getSystemInfoSync();
          this.statusBarHeight = sysInfo.statusBarHeight || 0;
          this.screenWidth = sysInfo.windowWidth || 375;
        }
      } catch (e) {
        const sysInfo = uni.getSystemInfoSync();
        this.statusBarHeight = sysInfo.statusBarHeight || 0;
        this.screenWidth = sysInfo.windowWidth || 375;
      }
      this.navBarHeight = 44;
      // #endif
      // #ifdef H5
      const sysInfoH5 = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoH5.statusBarHeight || 0;
      this.screenWidth = sysInfoH5.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
      // #ifndef MP-WEIXIN || H5
      const sysInfoOther = uni.getSystemInfoSync();
      this.statusBarHeight = sysInfoOther.statusBarHeight || 0;
      this.screenWidth = sysInfoOther.windowWidth || 375;
      this.navBarHeight = 44;
      // #endif
    },
    // 格式化日期显示
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${year}年${month}月${day}日`;
    },
    // 计算距离指定日期的天数
    calculateDays(dateStr) {
      if (!dateStr) return 0;
      const date = new Date(dateStr);
      const now = new Date();
      // 设置时间为当天的开始，避免时区问题
      date.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    },
    // 切换提醒状态
    toggleRemind(index) {
      this.anniversaryList[index].remind = !this.anniversaryList[index].remind;
      const message = this.anniversaryList[index].remind ? '已设置提醒' : '已取消提醒';
      uni.showToast({
        title: message,
        icon: 'success'
      });
    },
    // 选择日期
    onDateChange(e) {
      this.newAnniversary.date = e.detail.value;
    },
    // 编辑时选择日期
    onEditDateChange(e) {
      this.editingAnniversary.date = e.detail.value;
    },
    // 选择图标
    selectIcon(icon) {
      this.newAnniversary.icon = icon.name;
      this.newAnniversary.color = icon.color;
    },
    // 编辑时选择图标
    selectEditIcon(icon) {
      this.editingAnniversary.icon = icon.name;
      this.editingAnniversary.color = icon.color;
    },
    // 设置提醒变化
    onRemindChange(e) {
      this.newAnniversary.remind = e.detail.value;
    },
    // 编辑时设置提醒变化
    onEditRemindChange(e) {
      this.editingAnniversary.remind = e.detail.value;
    },
    // 添加纪念日
    addAnniversary() {
      if (!this.newAnniversary.title) {
        uni.showToast({
          title: '请输入纪念日标题',
          icon: 'none'
        });
        return;
      }
      
      if (!this.newAnniversary.date) {
        uni.showToast({
          title: '请选择纪念日日期',
          icon: 'none'
        });
        return;
      }
      
      // 添加到列表
      const newItem = {
        id: Date.now(), // 使用时间戳作为唯一ID
        title: this.newAnniversary.title,
        date: this.newAnniversary.date,
        icon: this.newAnniversary.icon,
        color: this.newAnniversary.color,
        remind: this.newAnniversary.remind
      };
      
      this.anniversaryList.push(newItem);
      
      // 重置表单
      this.newAnniversary.title = '';
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      this.newAnniversary.date = `${year}-${month}-${day}`;
      this.newAnniversary.icon = 'mdi:calendar-heart';
      this.newAnniversary.color = '#FF91A4';
      this.newAnniversary.remind = false;
      
      // 关闭弹窗
      this.showAddModal = false;
      
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      });
    },
    // 删除纪念日
    deleteAnniversary(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个纪念日吗？',
        success: (res) => {
          if (res.confirm) {
            const item = this.anniversaryList[index];
            this.anniversaryList.splice(index, 1);
            uni.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 如果删除的是设置了提醒的纪念日，检查是否还有提醒
            if (item.remind && !this.hasReminders) {
              // 可以在这里添加其他逻辑，比如更新全局提醒状态
            }
          }
        }
      });
    },
    // 编辑纪念日
    editAnniversary(index) {
      const item = { ...this.anniversaryList[index] };
      this.editingAnniversary = {
        id: item.id,
        title: item.title,
        date: item.date || '',
        icon: item.icon,
        color: item.color,
        remind: item.remind || false
      };
      this.showEditModal = true;
    },
    // 保存编辑的纪念日
    saveEditedAnniversary() {
      if (!this.editingAnniversary.title) {
        uni.showToast({
          title: '请输入纪念日标题',
          icon: 'none'
        });
        return;
      }
      
      if (!this.editingAnniversary.date) {
        uni.showToast({
          title: '请选择纪念日日期',
          icon: 'none'
        });
        return;
      }
      
      // 查找并更新纪念日
      const index = this.anniversaryList.findIndex(item => item.id === this.editingAnniversary.id);
      if (index !== -1) {
        this.anniversaryList[index] = {
          id: this.editingAnniversary.id,
          title: this.editingAnniversary.title,
          date: this.editingAnniversary.date,
          icon: this.editingAnniversary.icon,
          color: this.editingAnniversary.color,
          remind: this.editingAnniversary.remind
        };
        
        // 关闭弹窗
        this.showEditModal = false;
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.anniversary-page {
  min-height: 100vh;
  background-color: #FFFAF4;
  padding-bottom: 120rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 自定义导航栏样式 */
.custom-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background-color: #FFFAF4;
  overflow: hidden;
}

.navbar-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
}

.status-bar {
  width: 100%;
  background: transparent;
  position: relative;
  z-index: 1;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30rpx;
  box-sizing: border-box;
  position: relative;
  z-index: 1;
}

.navbar-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.title-text {
  font-size: 36rpx;
  font-weight: 500;
  color: #4A4A4A;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

.navbar-left {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 50rpx;
  font-weight: 600;
  color: #4A4A4A;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.3s;
}

.back-icon:active {
  opacity: 0.6;
}

.navbar-right {
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 顶部背景图 */
.top-bg {
  width: 100%;
  height: 360rpx;
  display: block;
}

.content {
  padding: 0 24rpx;
  margin-top: -80rpx; /* 调整内容区域上边距，与背景图衔接 */
  position: relative;
  z-index: 2; /* 确保内容在背景图之上 */
}

.anniversary-list {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 12rpx rgba(0, 0, 0, 0.04), inset 0 0 0 2rpx rgba(255,255,255,0.5);
  overflow: hidden;
  margin-bottom: 32rpx;
}

.anniversary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid #F0F0F0;
  cursor: pointer;

  &:active {
    background: #fdf2f8;
  }

  &:last-child {
    border-bottom: none;
  }
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.item-icon {
  margin-right: 20rpx;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
}

.item-date {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.item-days {
  font-size: 28rpx;
  color: #666;
  margin-right: 20rpx;
}

.days-count {
  color: #FFCC66;
  font-weight: bold;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.remind-icon {
  cursor: pointer;
}

.delete-icon {
  cursor: pointer;
}

.bottom-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20rpx;
}

.reminder-status {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 26rpx;
  color: #FFA500;
  
  iconify-icon {
    color: #FFCC66;
  }
}

.add-anniversary-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background-color: #FFCC66;
  color: #8B6914;
  font-size: 28rpx;
  padding: 15rpx 30rpx;
  border-radius: 40rpx;
  cursor: pointer;
  box-shadow: 0 8rpx 16rpx rgba(255, 204, 102, 0.3); /* 添加阴影 */
}

.add-anniversary-btn:active {
  opacity: 0.8;
  background-color: #FFD4A3; /* 修改点击时的背景色 */
  box-shadow: 0 4rpx 10rpx rgba(255, 204, 102, 0.2); /* 调整点击时的阴影 */
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  background: white;
  border-radius: 16rpx;
  width: 600rpx;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  position: relative;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  display: block;
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
  font-size: 28rpx;
}

.date-picker {
  line-height: 80rpx;
  color: #999;
}

.icon-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.icon-option {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #eee;
  cursor: pointer;
  
  &.selected {
    border-color: #FFCC66;
    background-color: rgba(255, 204, 102, 0.1);
  }
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.checkbox-label {
  font-size: 28rpx;
  color: #666;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
  gap: 20rpx;
}

.btn {
  flex: 1;
  height: 80rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  
  &.cancel-btn {
    background-color: #f5f5f5;
    color: #666;
  }
  
  &.confirm-btn {
    background-color: #FFCC66;
    color: #8B6914;
  }
}
</style>