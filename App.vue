<script>
	// ⚡ 立即初始化错误处理（在 App 实例创建之前）
	(function() {
		// 保存原始的 console.error
		const originalError = console.error;
		
		// 重写 console.error 以过滤已知的无害错误
		console.error = function(...args) {
			const errorMsg = args.join(' ');
			
			// 过滤 WebSocket 连接错误（开发工具日志通道）
			if (
				errorMsg.includes('WebSocket connection') && 
				errorMsg.includes('failed') &&
				(errorMsg.includes('mp-weixin') || errorMsg.includes('8090'))
			) {
				return; // 静默处理
			}
			
			// 过滤文件系统错误（小程序环境不支持 Node.js 文件系统）
			if (
				errorMsg.includes('not node js file system') ||
				errorMsg.includes('saaa_config.json') ||
				(errorMsg.includes('readFile') && errorMsg.includes('worker')) ||
				errorMsg.includes('__invokeHandler__ readFile')
			) {
				return; // 静默处理
			}
			
			// 其他错误正常显示
			originalError.apply(console, args);
		};
		
		// 捕获全局错误（小程序环境）
		if (typeof uni !== 'undefined') {
			uni.onError && uni.onError((error) => {
				if (!error) return;
				
				const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
				
				// 过滤已知的无害错误
				if (
					(errorStr.includes('WebSocket') && errorStr.includes('mp-weixin')) ||
					errorStr.includes('not node js file system') ||
					errorStr.includes('saaa_config.json') ||
					(errorStr.includes('readFile') && errorStr.includes('worker')) ||
					errorStr.includes('__invokeHandler__ readFile')
				) {
					return; // 静默处理
				}
				
				// 其他错误正常处理
				originalError('未捕获的错误:', error);
			});
		}
		
		// 捕获全局错误（浏览器环境）
		if (typeof window !== 'undefined') {
			const originalOnError = window.onerror;
			window.onerror = function(message, source, lineno, colno, error) {
				const errorMsg = message || '';
				if (
					errorMsg.includes('not node js file system') ||
					errorMsg.includes('saaa_config.json') ||
					(errorMsg.includes('readFile') && errorMsg.includes('worker')) ||
					errorMsg.includes('__invokeHandler__ readFile')
				) {
					return true; // 阻止默认错误处理
				}
				// 其他错误正常处理
				if (originalOnError) {
					return originalOnError.call(this, message, source, lineno, colno, error);
				}
				return false;
			};
		}
	})();
	
	export default {
		onLaunch: function() {
			console.log('App Launch');
			
			// 检查登录状态
			this.checkLoginStatus();
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 检查登录状态
			checkLoginStatus() {
				try {
					const loginInfo = uni.getStorageSync('login_info');
					const pages = getCurrentPages();
					const currentPage = pages[pages.length - 1];
					const currentRoute = currentPage ? currentPage.route : '';
					
					// 白名单页面（不需要登录的页面）
					const whiteList = ['pages/login/index'];
					
					// 检查是否有有效的token
					const hasToken = loginInfo && (
						(loginInfo.token && loginInfo.token.trim()) ||
						(loginInfo.data?.token && loginInfo.data.token.trim()) ||
						(loginInfo.accessToken && loginInfo.accessToken.trim())
					);
					
					// 如果登录信息存在但token缺失，清除无效的登录信息
					if (loginInfo && loginInfo.isLoggedIn && !hasToken) {
						console.warn('⚠️ 检测到无效的登录信息（缺少token），正在清除...');
						uni.removeStorageSync('login_info');
						console.warn('✅ 已清除无效的登录信息');
					}
					
					// 如果未登录且不在白名单中，跳转到登录页
					if (!loginInfo || !loginInfo.isLoggedIn || !hasToken) {
						if (!whiteList.includes(currentRoute)) {
							uni.reLaunch({
								url: '/pages/login/index'
							});
						}
					}
				} catch (e) {
					console.error('检查登录状态失败', e);
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
	
	/* 底部导航栏字体样式 - 与主页导航栏一致 */
	/* #ifdef MP-WEIXIN */
	/* 微信小程序底部导航栏字体样式 */
	/deep/ .uni-tabbar {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	}
	
	/deep/ .uni-tabbar__bd {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-weight: 500;
	}
	/* #endif */
	
	/* #ifdef H5 */
	/* H5底部导航栏字体样式 */
	.uni-tabbar {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
	}
	
	.uni-tabbar__bd {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		font-weight: 500;
	}
	/* #endif */
	
	/* 底部导航栏选中图标颜色 - 尝试通过filter实现粉色效果 */
	/* 注意：原生tabbar的PNG图标可能无法通过CSS直接改变颜色 */
	/* 如果此方法无效，需要准备粉色版本的图标文件 */
</style>
