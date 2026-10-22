import { NativeModule, requireNativeModule } from 'expo';

declare class DeviceGreetingModuleType extends NativeModule {
  getGreeting(nickname: string): string;
  getPlatformLabel(): string;
}

export default requireNativeModule<DeviceGreetingModuleType>('DeviceGreeting');
