# Medica – Advanced Medical Learning Platform

Medica is a premium React Native LMS application designed for medical professionals. It features a high-definition colorful UI, integrated video learning, and progressive assessment modules.

## 🚀 Key Features

- **Personalized Home**: Track active courses (e.g., Medicine & Surgery 101) with animated progress counts.
- **Video Library (Learn)**: Immersive high-definition video playback for medical lessons (powered by `react-native-video`).
- **Assessments (Assess)**: Interactive quiz system with animated scoring and detailed results tracking.
- **Premium UI/UX**: Custom curved tab bar, vibrant teal gradients, and smooth navigation (optimized with `react-native-screens`).

---

## 🛠 Prerequisites

Ensure you have the following installed:
- **Node.js** (LTS)
- **React Native CLI**
- **Android Studio** (with SDK API 35+)
- **Java JDK 17**

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Metro Server
```bash
npx react-native start --reset-cache
```

### 3. Run on Android
```bash
npx react-native run-android
```

---

## 📦 Android Build Commands

### Clean Project
```bash
cd android
.\gradlew clean
cd ..
```

### Build Debug APK
```bash
cd android
.\gradlew assembleDebug
```
**APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

### Build Release APK
```bash
cd android
.\gradlew assembleRelease
```
**APK Location:** `android/app/build/outputs/apk/release/app-release.apk`

---

## 🍎 iOS Build Process

> **Note:** iOS builds require a Mac with Xcode installed. You cannot build for iOS on Windows.

### Prerequisites (macOS only)
- **macOS** 13 (Ventura) or later
- **Xcode** 15+ (install from the Mac App Store)
- **Command Line Tools**: `xcode-select --install`
- **Ruby** 3.x (pre-installed on macOS, or use `rbenv`/`rvm`)
- **CocoaPods**: `sudo gem install cocoapods`
- **Node.js** LTS + React Native CLI

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Install CocoaPods Dependencies
```bash
cd ios
pod install
cd ..
```

> If you encounter errors, try:
> ```bash
> cd ios
> pod repo update
> pod install
> cd ..
> ```

### 3. Run on iOS Simulator
```bash
npx react-native run-ios
```

To target a specific simulator:
```bash
npx react-native run-ios --simulator "iPhone 15 Pro"
```

### 4. Run on Physical Device (Debug)
1. Connect your iPhone via USB and trust the computer.
2. Open `ios/Medica.xcworkspace` in Xcode (⚠️ always use `.xcworkspace`, not `.xcodeproj`).
3. Select your device in the Xcode toolbar.
4. Set your Apple Developer Team under **Signing & Capabilities → Team**.
5. Press **▷ Run** (Cmd+R).

### 5. Production Build (Release IPA)

#### Step 1 — Configure Signing
1. Open `ios/Medica.xcworkspace` in Xcode.
2. Select the **Medica** target → **Signing & Capabilities**.
3. Set your **Team** and ensure **Automatically manage signing** is enabled (or manually set provisioning profile).
4. Set **Bundle Identifier** to match your App Store Connect entry (e.g., `com.yourcompany.medica`).

#### Step 2 — Set Build Configuration to Release
In Xcode, go to **Product → Scheme → Edit Scheme…**, select the **Run** tab, and change **Build Configuration** to `Release`.

#### Step 3 — Archive the App
```
Product → Archive
```
This compiles the app with release optimizations. Wait for the **Organizer** window to appear automatically.

#### Step 4 — Export / Distribute
In the **Organizer**:
- Click **Distribute App**.
- Choose **App Store Connect** (for TestFlight / App Store) or **Ad Hoc** (for direct device distribution).
- Follow the wizard to export the signed `.ipa` file.

#### Step 5 — Upload to App Store Connect (Optional)
Use **Transporter** (free from the Mac App Store) or Xcode's built-in uploader:
```
Organizer → Distribute App → App Store Connect → Upload
```

---

## ⚠️ Troubleshooting

### Build Failure (API Level)
The video module requires **Android API Level 35**. If you get a `CheckAarMetadata` error, ensure your `compileSdkVersion` in `android/build.gradle` is set to `35`.

### iOS – Pod Install Fails
If `pod install` fails with Ruby or openssl errors, try:
```bash
sudo arch -x86_64 gem install ffi
cd ios && arch -x86_64 pod install
```
Or update CocoaPods:
```bash
sudo gem install cocoapods
pod repo update
```

### iOS – Icons Not Rendering
Ensure `UIAppFonts` is present in `ios/Medica/Info.plist` (already configured). If icons still don't appear after a clean build:
```bash
cd ios && pod deintegrate && pod install
```
Then do a clean build in Xcode: **Product → Clean Build Folder** (Cmd+Shift+K), then run again.

### Performance Issues
The app is optimized to pause background videos when tabs are switched. If navigation feels sluggish on certain emulators, try disabling "Enable hardware acceleration" in Android Studio's AVD settings or run on a physical device.

### "RCTVideo" Not Found
If you see an "Invariant Violation: RCTVideo not found" error, you must perform a full native rebuild:
```bash
npx react-native run-android
```

### iOS – Xcode Signing Error
Make sure you open `ios/Medica.xcworkspace` (not `Medica.xcodeproj`). Then verify your Developer Team is selected under **Signing & Capabilities**.

---

## 👨‍💻 Development
- **Navigation**: Uses `@react-navigation/bottom-tabs` with custom animated icons.
- **Icons**: Powered by `react-native-vector-icons` (MaterialIcons).
- **Styling**: Premium `StyleSheet` implementation with `react-native-linear-gradient`.
- **Animations**: `react-native-reanimated` + `lottie-react-native` for smooth micro-interactions.
- **State / Data Fetching**: `@tanstack/react-query` + `axios`.
- **Utility CSS**: `nativewind` (TailwindCSS for React Native).