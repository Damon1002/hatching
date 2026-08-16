# Dragon Grove

一款把真实专注时间变成龙的成长经历的 iOS 专注伴侣。

核心产品假设只有一个：当用户距离龙的下一次变化很近时，会不会愿意多完成一次专注？因此这个原型优先实现了完整的陪伴式专注闭环，没有加入战斗、商城、排行榜、聊天或复杂地图。

## 当前原型

- 龙窝：原创分层 SVG 龙、山谷、月光、雾、炉火，以及呼吸、眨眼和尾巴动画
- 专注：25 / 45 / 60 分钟，温柔模式与深度模式，真实倒计时和完成反馈
- 旅程：周节奏、总投入和龙的成长时间线
- 我的：专注偏好、系统动态效果和产品承诺
- 动效：Reanimated 4 UI 线程动画、按下即时反馈、系统 Reduce Motion 支持
- 场景：React Native Skia 2.6.2、显式角色状态机和可替换纹理图集
- 触觉：选择、开始与完成事件使用不同强度，并与视觉反馈同步

开发模式下每个“专注分钟”会压缩成 1 秒，便于快速测试完整流程；正式构建自动恢复为 60 秒。

## 运行

```bash
npm install
npm run ios
```

`npm run ios` 专门用于同一台 Mac 上的 iOS Simulator：它固定使用 Expo Go、IPv4 `localhost`，并清理 Metro 缓存，避免 Expo Go 保存了已经失效的局域网地址，或 Metro 只监听 IPv6、Expo Go 却连接 IPv4。

真机调试时，Mac 与 iPhone 在同一 Wi-Fi 可使用：

```bash
npm run ios:lan
```

如果局域网、VPN 或防火墙阻止连接，使用：

```bash
npm run ios:tunnel
```

Metro 必须在整个调试期间保持运行。关闭运行 `npm run ios` 的终端后，Expo Go 会显示无法连接服务器，这是开发构建的正常行为。

验证：

```bash
npm run typecheck
npm run verify:ios
```

## 产品原则

1. 龙由真实 Focus Minutes 塑造，不由付费加速。
2. 中断不会伤害或杀死龙；用户可以温柔地重新开始。
3. 专注画面是 Ambient Focus Object，不用刺激性动画争抢注意力。
4. 社交若加入，只服务于 body doubling，不做点赞、Feed 或排行榜。
5. 世界观、角色、美术与命名保持原创，避免影视和竞品 IP。

## 建议的下一阶段

1. 接入本地持久化与真实 session lifecycle（前后台、锁屏和意外终止）。
2. 用原生 FamilyControls / ManagedSettings 模块实现深度模式的 App Blocking。
3. 加入 Live Activity、Widget 与环境音频。
4. 用真实用户测试“距离成长节点越近，专注次数是否增加”。
5. 核心假设成立后，再增加蛋、行为塑形和 Realm 扩展。

## Dragon art handoff

The exact production asset specification is in [`docs/DRAGON_ART_BRIEF.md`](docs/DRAGON_ART_BRIEF.md). The app now renders Emberwing from the optimized Skia atlas in `assets/dragon/emberwing/runtime-512/`.

Important: canonical `2048×2048` transparent source frames are preserved in `assets/dragon/emberwing/source-2048/`. Future exports and variants must start from those masters, never from the 512px runtime frames or atlas. See [`docs/DRAGON_EXPORT_REMINDER.md`](docs/DRAGON_EXPORT_REMINDER.md).
