import { NativeModule, registerWebModule } from 'expo';

class DeviceGreetingModule extends NativeModule {
  getGreeting(nickname: string): string {
    return `안녕, ${nickname}! 웹 미리보기예요`;
  }

  getPlatformLabel(): string {
    return 'Web · Preview';
  }
}

export default registerWebModule(DeviceGreetingModule, 'DeviceGreeting');
