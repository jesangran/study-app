/**
 * Kotlin Android 네이티브 모듈 데모 (프로토타입)
 * 홈 화면 인사 칩에만 사용. 실서비스에선 제거하거나 교체해도 됨.
 */
import DeviceGreetingModule from './src/DeviceGreetingModule';

export function getGreeting(nickname: string): string {
  try {
    return DeviceGreetingModule.getGreeting(nickname);
  } catch {
    return `안녕, ${nickname}!`;
  }
}

export function getPlatformLabel(): string {
  try {
    return DeviceGreetingModule.getPlatformLabel();
  } catch {
    return 'React Native';
  }
}

export default DeviceGreetingModule;
