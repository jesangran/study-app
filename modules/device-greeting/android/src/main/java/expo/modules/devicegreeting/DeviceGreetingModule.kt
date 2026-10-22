package expo.modules.devicegreeting

import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DeviceGreetingModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceGreeting")

    Function("getGreeting") { nickname: String ->
      val device = Build.MODEL ?: "Android"
      "안녕, ${nickname}! Kotlin이 ${device}에서 인사해요"
    }

    Function("getPlatformLabel") {
      "Android · Kotlin"
    }
  }
}
