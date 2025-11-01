<script>
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
