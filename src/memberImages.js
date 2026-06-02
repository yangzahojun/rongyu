const BASE = import.meta.env.BASE_URL

const memberImages = {
  '丁老师': 'avatars/丁老师抠图.png',
  '周雄': 'avatars/周雄抠图.png',
  '邹碧霞': 'avatars/邹碧霞抠图.png',
  '曹博雅': 'avatars/曹博雅抠图.png',
  '柏雅云': 'avatars/柏雅云抠图.png',
  '王佳欣': 'avatars/王佳欣抠图.png',
  '陈思伊': 'avatars/陈思伊抠图.png',
  '杨赵俊': 'avatars/杨赵俊抠图.png',
  '王子宜': 'avatars/王子宜抠图.png',
  '薛佳欣': 'avatars/薛佳欣抠图.png',
  '范唯伊': 'avatars/范唯伊抠图.png',
  '李宣萱': 'avatars/李宣萱抠图.png',
  '王静怡': 'avatars/王静怡抠图.png',
  '汪安琪': 'avatars/汪安琪抠图.png',
  '李健鑫': 'avatars/李健鑫抠图.png',
}

export function getMemberImage(name) {
  const file = memberImages[name]
  if (!file) return null
  return `${BASE}${file}`
}

export default memberImages
