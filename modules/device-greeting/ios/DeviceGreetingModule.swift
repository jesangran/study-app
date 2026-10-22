import ExpoModulesCore

public class DeviceGreetingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DeviceGreeting")

    Function("getGreeting") { (nickname: String) -> String in
      return "안녕, \(nickname)! iOS에서 인사해요"
    }

    Function("getPlatformLabel") { () -> String in
      return "iOS · Swift"
    }
  }
}
