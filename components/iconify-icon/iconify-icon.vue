<template>
  <!-- #ifdef H5 -->
  <span 
    class="iconify-icon" 
    :data-icon="icon" 
    :style="iconStyle"
    ref="iconRef"
  ></span>
  <!-- #endif -->
  
  <!-- #ifdef MP-WEIXIN -->
  <view class="iconify-icon-wrapper" :style="wrapperStyle">
    <image 
      v-if="svgUrl" 
      :src="svgUrl" 
      mode="aspectFit"
      class="iconify-icon-image"
      :style="imageStyle"
    />
    <text v-else class="iconify-icon" :style="iconStyle">{{ iconUnicode }}</text>
  </view>
  <!-- #endif -->
  
  <!-- #ifndef H5 || MP-WEIXIN -->
  <view class="iconify-icon-wrapper" :style="wrapperStyle">
    <image 
      v-if="svgUrl" 
      :src="svgUrl" 
      mode="aspectFit"
      class="iconify-icon-image"
      :style="imageStyle"
    />
    <text v-else class="iconify-icon" :style="iconStyle">{{ iconUnicode }}</text>
  </view>
  <!-- #endif -->
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true,
    default: ''
  },
  size: {
    type: [String, Number],
    default: 24
  },
  color: {
    type: String,
    default: '#666666'
  }
})

const iconRef = ref(null)
const svgUrl = ref('')

// 图标Unicode映射（Material Design Icons常用图标，作为fallback）
const iconUnicodeMap = {
  'mdi:heart': '❤',
  'mdi:account': '👤',
  'mdi:chat-question': '💬',
  'mdi:check-all': '✓',
  'mdi:heart-box': '💝',
  'mdi:email-heart': '✉',
  'mdi:camera': '📷',
  'mdi:achievement': '🏆',
  'mdi:calendar': '📅',
  'mdi:calendar-heart': '💕',
  'mdi:arrow-left': '←',
  'mdi:map': '🗺',
  'mdi:apps': '☰',
  'mdi:home': '🏠',
  'mdi:message': '💬',
  'mdi:gift': '🎁',
  'mdi:pencil': '✏',
  'mdi:bell': '🔔',
  'mdi:shield-account': '🛡',
  'mdi:cloud-upload': '☁',
  'mdi:lock': '🔒',
  'mdi:chevron-right': '›',
  'mdi:cupcake': '🧁',
  'mdi:airplane': '✈'
}

const iconUnicode = computed(() => {
  return iconUnicodeMap[props.icon] || '●'
})

const iconStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}rpx` : props.size
  return {
    fontSize: sizeValue,
    color: props.color,
    display: 'inline-block',
    lineHeight: '1'
  }
})

const wrapperStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}rpx` : props.size
  return {
    width: sizeValue,
    height: sizeValue,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

const imageStyle = computed(() => {
  const sizeValue = typeof props.size === 'number' ? `${props.size}rpx` : props.size
  return {
    width: sizeValue,
    height: sizeValue,
    filter: `drop-shadow(0 0 0 ${props.color})`
  }
})

// 通过iconify API获取SVG（小程序端使用）
const loadSvgIcon = async () => {
  // #ifndef H5
  if (!props.icon) return
  
  try {
    // 使用iconify API获取SVG
    const [iconSet, iconName] = props.icon.split(':')
    if (!iconSet || !iconName) return
    
    // 构建SVG URL（使用iconify的CDN）
    const svgApiUrl = `https://api.iconify.design/${iconSet}/${iconName}.svg?color=${encodeURIComponent(props.color)}&width=${props.size}&height=${props.size}`
    
    // 对于小程序，可以直接使用这个URL
    svgUrl.value = svgApiUrl
  } catch (error) {
    console.warn('Failed to load icon:', error)
    svgUrl.value = ''
  }
  // #endif
}

onMounted(() => {
  // #ifdef H5
  // 动态加载iconify脚本（如果未加载）
  if (typeof window !== 'undefined' && !window.Iconify) {
    const script = document.createElement('script')
    script.src = 'https://code.iconify.design/3/3.1.1/iconify.min.js'
    script.onload = () => {
      if (iconRef.value && window.Iconify) {
        window.Iconify.scan(iconRef.value.parentElement || document.body)
      }
    }
    document.head.appendChild(script)
  } else if (window.Iconify && iconRef.value) {
    window.Iconify.scan(iconRef.value.parentElement || document.body)
  }
  // #endif
  
  // #ifndef H5
  loadSvgIcon()
  // #endif
})

watch(() => props.icon, () => {
  // #ifdef H5
  if (window.Iconify && iconRef.value) {
    window.Iconify.scan(iconRef.value.parentElement || document.body)
  }
  // #endif
  
  // #ifndef H5
  loadSvgIcon()
  // #endif
})

watch(() => [props.color, props.size], () => {
  // #ifndef H5
  loadSvgIcon()
  // #endif
})
</script>

<style scoped>
.iconify-icon {
  display: inline-block;
  vertical-align: middle;
}

.iconify-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.iconify-icon-image {
  width: 100%;
  height: 100%;
}

/* #ifdef H5 */
.iconify-icon {
  font-size: inherit;
}
/* #endif */
</style>

