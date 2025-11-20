<template>
	<view class="custom-tabbar" :style="{ paddingBottom: safeAreaInsets.bottom + 'px' }">
		<view 
			class="tabbar-item" 
			v-for="(item, index) in tabList" 
			:key="index"
			:class="{ 'active': current === index }"
			@click="switchTab(item, index)"
		>
			<view class="icon-wrapper">
				<image 
					class="tabbar-icon" 
					:src="current === index ? item.selectedIconPath : item.iconPath" 
					mode="aspectFit"
				/>
				<!-- 选中时的渐变遮罩 -->
				<view v-if="current === index" class="icon-gradient"></view>
			</view>
			<text class="tabbar-text" :class="{ 'active': current === index }">{{ item.text }}</text>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CustomTabbar',
	props: {
		current: {
			type: Number,
			default: 0
		}
	},
	data() {
		return {
			safeAreaInsets: {
				bottom: 0
			},
			tabList: [
				{
					pagePath: 'pages/index/index',
					text: '首页',
					iconPath: '/static/love.png',
					selectedIconPath: '/static/love.png'
				},
				{
					pagePath: 'pages/trajectory/index',
					text: '轨迹',
					iconPath: '/static/trajectory.png',
					selectedIconPath: '/static/trajectory.png'
				},
				{
					pagePath: 'pages/we/index',
					text: '我们',
					iconPath: '/static/we.png',
					selectedIconPath: '/static/we.png'
				}
			]
		}
	},
	mounted() {
		// 获取安全区域
		this.getSafeAreaInsets();
	},
	methods: {
		switchTab(item, index) {
			if (this.current === index) return;
			
			// 跳转页面（自定义 tabBar 仍然使用 switchTab）
			uni.switchTab({
				url: '/' + item.pagePath,
				fail: (err) => {
					console.error('切换页面失败', err);
				}
			});
		},
		getSafeAreaInsets() {
			// #ifdef MP-WEIXIN
			const systemInfo = uni.getSystemInfoSync();
			this.safeAreaInsets.bottom = systemInfo.safeAreaInsets?.bottom || 0;
			// #endif
			
			// #ifdef H5
			this.safeAreaInsets.bottom = 0;
			// #endif
		}
	}
}
</script>

<style scoped>
.custom-tabbar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	justify-content: space-around;
	/* 白色背景 */
	background-color: #ffffff;
	border-top: 1px solid rgba(218, 165, 32, 0.15);
	box-shadow: 0 -2px 12px rgba(218, 165, 32, 0.08);
	z-index: 999;
	height: 98rpx;
	backdrop-filter: blur(10px);
}

.tabbar-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	padding: 12rpx 0;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	cursor: pointer;
}

.icon-wrapper {
	position: relative;
	width: 52rpx;
	height: 52rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 6rpx;
}

.tabbar-icon {
	width: 48rpx;
	height: 48rpx;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	z-index: 2;
}

/* 未选中状态：淡黄色，类似图片中的浅色状态 */
.tabbar-item:not(.active) .tabbar-icon {
	filter: sepia(30%) saturate(120%) hue-rotate(20deg) brightness(1.2);
	opacity: 0.65;
	transform: scale(1);
}

/* 选中状态：深黄色 + 明显缩放效果，类似图片中的高亮状态 */
.tabbar-item.active .icon-wrapper {
	transform: scale(1.15);
}

.tabbar-item.active .tabbar-icon {
	filter: sepia(60%) saturate(250%) hue-rotate(5deg) brightness(0.95) drop-shadow(0 2px 4px rgba(218, 165, 32, 0.3));
	opacity: 1;
	transform: scale(1.1);
}

/* 选中时的脉冲光晕效果，类似图片中的光晕 */
.icon-gradient {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 70rpx;
	height: 70rpx;
	background: radial-gradient(circle, rgba(218, 165, 32, 0.25) 0%, rgba(244, 164, 96, 0.15) 40%, transparent 70%);
	border-radius: 50%;
	animation: pulseGlow 2s ease-in-out infinite;
	pointer-events: none;
	z-index: 1;
}

@keyframes pulseGlow {
	0%, 100% {
		opacity: 0.4;
		transform: translate(-50%, -50%) scale(1);
	}
	50% {
		opacity: 0.7;
		transform: translate(-50%, -50%) scale(1.15);
	}
}

.tabbar-text {
	font-size: 20rpx;
	color: #D4C5A9;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	font-weight: 400;
	letter-spacing: 0.5rpx;
	position: relative;
	z-index: 2;
}

/* 选中状态的文字：深黄色、加粗、缩放，类似图片中的选中文字 */
.tabbar-text.active {
	color: #DAA520;
	font-weight: 700;
	transform: scale(1.08);
	text-shadow: 0 1px 2px rgba(218, 165, 32, 0.2);
}

/* 点击反馈效果 */
.tabbar-item:active {
	transform: scale(0.92);
}

.tabbar-item.active:active {
	transform: scale(1.08);
}

.tabbar-item.active:active .icon-wrapper {
	transform: scale(1.2);
}
</style>

