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
			
			// 应用启动时设置游客状态
			this.setGuestStatus();
			
			// 直接跳转到首页
			uni.reLaunch({
				url: '/pages/index/index'
			});
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 设置游客状态
			setGuestStatus() {
				try {
					// 检查是否已有登录信息
					const loginInfo = uni.getStorageSync('login_info');
					
					// 如果没有登录信息，设置游客状态
					if (!loginInfo || !loginInfo.isLoggedIn) {
						const guestUserInfo = {
							nickName: '游客用户',
							displayName: '游客用户',
							isGuest: true
						};
						
						const guestLoginInfo = {
							isLoggedIn: true,
							userInfo: guestUserInfo,
							isGuest: true,
							loginTime: new Date().toISOString()
						};
						
						uni.setStorageSync('login_info', guestLoginInfo);
						console.log('已设置游客状态');
					}
				} catch (e) {
					console.error('设置游客状态失败', e);
				}
			}
		}
	}
</script>