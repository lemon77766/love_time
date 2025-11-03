<script>
	export default {
		onLaunch: function() {
			console.log('App Launch');
			
			// 捕获并静默处理 WebSocket 错误（uni-app 开发工具的日志通道连接）
			this.handleWebSocketError();
			
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
			// 处理 WebSocket 错误（uni-app 开发工具日志通道）
			handleWebSocketError() {
				// 重写 console.error 以过滤 WebSocket 相关错误
				const originalError = console.error;
				console.error = function(...args) {
					// 检查是否是 WebSocket 连接错误（开发工具日志通道）
					const errorMsg = args.join(' ');
					if (
						errorMsg.includes('WebSocket connection') && 
						errorMsg.includes('failed') &&
						(errorMsg.includes('mp-weixin') || errorMsg.includes('8090'))
					) {
						// 静默处理，不显示此错误
						// 这是 uni-app 开发工具的正常行为，不影响功能
						return;
					}
					// 其他错误正常显示
					originalError.apply(console, args);
				};
				
				// 捕获未捕获的错误（包括 WebSocket 错误）
				if (typeof uni !== 'undefined') {
					// 小程序环境
					uni.onError && uni.onError((error) => {
						if (error && typeof error === 'string' && 
							error.includes('WebSocket') && 
							error.includes('mp-weixin')) {
							// 静默处理 WebSocket 错误
							return;
						}
						// 其他错误正常处理
						originalError('未捕获的错误:', error);
					});
				}
			},
			
			// 检查登录状态
			checkLoginStatus() {
				try {
					const loginInfo = uni.getStorageSync('login_info');
					const pages = getCurrentPages();
					const currentPage = pages[pages.length - 1];
					const currentRoute = currentPage ? currentPage.route : '';
					
					// 白名单页面（不需要登录的页面）
					const whiteList = ['pages/login/index'];
					
					// 如果未登录且不在白名单中，跳转到登录页
					if (!loginInfo || !loginInfo.isLoggedIn) {
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
	
	/* 底部导航栏选中图标颜色 - 尝试通过filter实现粉色效果 */
	/* 注意：原生tabbar的PNG图标可能无法通过CSS直接改变颜色 */
	/* 如果此方法无效，需要准备粉色版本的图标文件 */
</style>
