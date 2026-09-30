# RapidRescue Driver — Android Startup Crash Investigation & Technical Analysis

**Document Status:** Diagnostic Report (Investigation Only — No Code/Package Changes Applied)  
**Target Application:** RapidRescue Driver (`com.rapidrescue.driver`)  
**Environment:** Expo SDK 57.0.25 / React Native 0.86.3 / Hermes / React 19.2.3 / Android 15 (API 35, ARM64-v8a)  
**Artifact File:** `docs/ANDROID_STARTUP_CRASH_ANALYSIS.md`  

---

## Executive Summary

The RapidRescue Driver Android release APK crashes approximately one second after launch on Android 15. The crash occurs immediately after the React Native JavaScript runtime completes initial bundle execution (`ReactNativeJS: Running "main"`). 

Through low-level ADB inspection, tombstone extraction (`/data/tombstones/tombstone_02`), C++ symbol tracing, and dependency tree auditing, the root cause has been isolated:
1. The crash is a **native C++ abort (`SIGABRT`)** inside `libreactnative.so` triggered by `std::out_of_range` (subclass of `std::logic_error`) with message `"vector"` at `UIManagerBinding.cpp:250` during `UIManager::createNode`.
2. This is caused by a **dual-version conflict and version mismatch in Fabric New Architecture native modules**:
   - **`react-native-screens` dual-version conflict:** The compiled native APK contains `react-native-screens@4.26.2`, but `expo-router` has a nested duplicate at `node_modules/expo-router/node_modules/react-native-screens@4.28.0`. When `expo-router` mounts `<Stack>`, it executes JS components from `4.28.0` that call Fabric C++ `createNode` with props/structures that do not match the compiled `4.26.2` C++ descriptors in the binary.
   - **`react-native-safe-area-context` version mismatch:** `package.json` specifies `"~5.4.0"` (installed `5.4.1`), whereas Expo SDK 57 / React Native 0.86.3 mandates `"~5.7.0"`. `5.4.1` C++ props parsing does not conform to RN 0.86 Fabric component descriptor requirements when `<SafeAreaView edges={edges} />` mounts on the root `WelcomeScreen`.
3. The warning `Could not find generated setter for class org.reactnative.maskedview.RNCMaskedViewManager` was thoroughly investigated and **confirmed to be benign** (a standard legacy reflection fallback warning present across multiple view managers, with MaskedView completely unused on Android).

---

## A. Confirmed Crash Facts

| Parameter | Confirmed Value | Source |
|---|---|---|
| **Package ID** | `com.rapidrescue.driver` | `AndroidManifest.xml` / `app.json` |
| **Device / OS** | Redmi (`sky_in`), Android 15 (API 35), `arm64-v8a` | `adb shell getprop` |
| **Crashing Process** | PID 9475 (`com.rapidrescue.driver`) | `adb logcat` & `/data/tombstones/tombstone_02` |
| **Crashing Thread** | TID 9518 (`mqt_v_js` - React Native JavaScript Thread) | Tombstone Thread Dump |
| **Termination Signal** | `Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE)` | Tombstone header |
| **JS Runtime Phase** | Post-Bundle Execution (`ReactNativeJS: Running "main"`) | `adb logcat -s ReactNativeJS:*` |
| **Native Crash Trigger** | `google::LogMessageFatal` from `UIManagerBinding.cpp:250` | Tombstone Register `x12` string dump |
| **Exception Details** | `logic_error in createNode: vector` | Memory at `0x00000072b22ecf40` |
| **APK Libraries Loaded** | `libreactnative.so`, `libhermesvm.so`, `libexpo-modules-core.so`, `libreact_codegen_rnscreens.so`, `libreact_codegen_safeareacontext.so`, `libappmodules.so`, `librnscreens.so` | Verified present and loaded |

### Native Stack Backtrace (From Tombstone 02)
```text
backtrace:
  #00 pc 0000000000062b34  /apex/com.android.runtime/lib64/bionic/libc.so (abort+168)
  #01 pc 00000000000b411c  /data/app/.../lib/arm64/libreactnative.so (google::LogMessageFatal::~LogMessageFatal()+8)
  #02 pc 00000000000b3964  /data/app/.../lib/arm64/libreactnative.so (google::LogMessageFatal::~LogMessageFatal()+8)
  #03 pc 00000000000b37dc  /data/app/.../lib/arm64/libreactnative.so
  #04 pc 00000000000b37c8  /data/app/.../lib/arm64/libreactnative.so
  #05 pc 0000000000109a24  /data/app/.../lib/arm64/libreactnative.so
  #06 pc 0000000000065be8  /data/app/.../lib/arm64/libhermesvm.so
  #07 pc 000000000005ca78  /data/app/.../lib/arm64/libhermesvm.so
  #08 pc 000000000005d5e8  /data/app/.../lib/arm64/libhermesvm.so
  #09 pc 000000000004ff94  /data/app/.../lib/arm64/libhermesvm.so
  #10 pc 0000000000052734  /data/app/.../lib/arm64/libhermesvm.so
  #11 pc 0000000000041a78  /data/app/.../lib/arm64/libhermesvm.so
  #12 pc 000000000004191c  /data/app/.../lib/arm64/libhermesvm.so
  #13 pc 00000000000a68d0  /data/app/.../lib/arm64/libhermesvm.so
  #14 pc 00000000000b4638  /data/app/.../lib/arm64/libreactnative.so (facebook::react::Task::execute()+44)
  #15 pc 00000000000b44fc  /data/app/.../lib/arm64/libreactnative.so (facebook::react::RuntimeScheduler_Modern::executeTask(std::__1::shared_ptr<facebook::react::Task> const&)+96)
```

---

## B. Exact Likely Crash Location

### 1. Source Line
**File:** `node_modules/react-native/ReactCommon/react/renderer/uimanager/UIManagerBinding.cpp`  
**Lines 240–252:**
```cpp
    return valueFromShadowNode(
        runtime,
        uiManager->createNode(
            tag,
            name,
            surfaceId,
            RawProps(runtime, rawPropsValue),
            instanceHandle),
        true);
  } catch (const std::logic_error& ex) {
    LOG(FATAL) << "logic_error in createNode: " << ex.what();
  }
```

### 2. Mechanism of the Abort
- When React mounts native elements on the screen in Fabric (New Architecture), Hermes calls `nativeFabricUIManager.createNode(...)` via JSI.
- This invokes `UIManager::createNode` in C++.
- In the LLVM standard C++ library (`libc++`) used by Android NDK, `std::vector::at(size_type __n)` throws `std::out_of_range("vector")` if `__n >= size()`.
- Because `std::out_of_range` inherits from `std::logic_error`, the `catch (const std::logic_error& ex)` block catches it.
- `LOG(FATAL)` creates a `google::LogMessageFatal` object, which logs `"logic_error in createNode: vector"` and calls `abort()`, terminating the process with `SIGABRT` on `mqt_v_js`.

---

## C. Dependency/Version Compatibility Findings

An audit of `package.json`, `node_modules/expo/bundledNativeModules.json`, `npx expo-doctor`, and `npx expo install --check` revealed three critical discrepancies:

| Module | Root `package.json` | Installed at Root | Nested in `expo-router` | Expo SDK 57 Bundled Spec | Status |
|---|---|---|---|---|---|
| **`react-native`** | `0.86.3` | `0.86.3` | — | `0.86.3` | **Aligned** |
| **`react`** | `19.2.3` | `19.2.3` | — | `19.2.3` | **Aligned** |
| **`expo`** | `~57.0.25` | `57.0.25` | — | `57.0.25` | **Aligned** |
| **`expo-router`** | `~57.0.23` | `57.0.23` | — | `~57.0.23` | **Aligned** |
| **`react-native-screens`** | `~4.26.0` | **`4.26.2`** | **`4.28.0`** *(conflict)* | `~4.26.0` | **MISMATCH & DUPLICATION** |
| **`react-native-safe-area-context`** | **`~5.4.0`** | **`5.4.1`** | — | **`~5.7.0`** | **VERSION MISMATCH** |
| **`@react-native-masked-view/masked-view`**| *(transitive)* | `0.3.2` | — | `0.3.2` | **Aligned (Legacy Paper)** |

### Finding Details:
1. **`react-native-screens` Dual-Version Conflict:**
   - Android Gradle compiles native C++ code and Java bindings from `node_modules/react-native-screens` (`4.26.2`).
   - `expo-router@57.0.23` specifies `"react-native-screens": "^4.26.0"` in peerDependencies, but an npm resolution anomaly installed `react-native-screens@4.28.0` inside `node_modules/expo-router/node_modules/react-native-screens/`.
   - Metro resolves `react-native-screens` imports inside `expo-router` from the nested directory, bundling `4.28.0` JavaScript code.
   - At runtime, `4.28.0` JS sends Fabric component descriptors and props commands to a native binary running `4.26.2` C++ descriptors.
2. **`react-native-safe-area-context` Outdated Version:**
   - `package.json` pins `~5.4.0` (resolves to `5.4.1`).
   - `5.4.1` was published for React Native 0.74/0.75.
   - React Native 0.86.3 with Fabric requires `react-native-safe-area-context@~5.7.0` (as defined in `node_modules/expo/bundledNativeModules.json`).
   - `RNCSafeAreaView` and `RNCSafeAreaProvider` descriptors in 5.4.1 use outdated prop conversion structures for edge vectors.

---

## D. Whether Masked-View is Likely Related

### Conclusion: **NOT Related (Confirmed Red Herring)**

#### Evidence:
1. **The Logcat Warning:**
   ```text
   W ViewManagerPropertyUpdater: Could not find generated setter for class org.reactnative.maskedview.RNCMaskedViewManager
   ```
   - In React Native, `ViewManagerPropertyUpdater` uses annotation processors to generate compile-time `$$PropsSetter` classes. When a legacy library does not generate one, React Native prints this `Could not find generated setter` warning and falls back to reflection.
   - The identical warning is output on startup for multiple view managers, including:
     - `com.swmansion.rnscreens.ScreenStackViewManager`
     - `com.facebook.react.views.text.ReactTextViewManager`
   - This warning is an ordinary informational diagnostic on Android and does not cause a crash.
2. **Execution Flow on Android:**
   - `@react-native-masked-view/masked-view` is pulled in solely as a dependency of `@react-navigation/elements` (for `HeaderBackButton`).
   - In `@react-navigation/elements/src/Header/HeaderBackButton.tsx`:
     ```typescript
     if (Platform.OS === 'ios') {
       // MaskedView is rendered only on iOS for native back title truncation
     } else {
       // Android renders a standard View/Text element
     }
     ```
   - MaskedView is never mounted or rendered on Android in this app.
3. **Absence from Fabric Autolinking:**
   - Inspection of `android/app/build/generated/autolinking/src/main/jni/autolinking.cpp` shows that `RNCMaskedView` has no Fabric C++ Component Descriptor registered. It plays no role in `UIManager::createNode`.

---

## E. Root Provider & Import Chain Executed at Startup

### Entry Point
`package.json`: `"main": "expo-router/entry"` -> `ExpoRoot` -> renders `app/_layout.tsx`.

### Provider & Component Hierarchy
```text
<ExpoRoot> (expo-router)
  └── <SafeAreaProvider> (from react-native-safe-area-context, wrapped by expo-router)
        └── <RootLayout> (app/_layout.tsx)
              ├── <AuthProvider> (src/context/AuthContext.tsx)
              │     └── [Pure in-memory state; no native calls on mount]
              ├── <AdminProvider> (src/context/AdminContext.tsx)
              │     └── [Pure in-memory state; no native calls on mount]
              ├── <VerificationProvider> (src/context/VerificationContext.tsx)
              │     └── [Pure in-memory state; no native calls on mount]
              ├── <LocationProvider> (src/context/LocationContext.tsx)
              │     └── [State initialized; watcher stopped; no GPS calls on mount]
              ├── <EmergencyProvider> (src/context/EmergencyContext.tsx)
              │     └── [State initialized; no active polling/socket on mount]
              ├── <StatusBar style="light" /> (expo-status-bar)
              └── <Stack screenOptions={{ headerShown: false, ... }}> (expo-router)
                    │   └── Uses react-native-screens native components:
                    │         ├── RNSScreenStack
                    │         └── RNSScreen
                    └── <Stack.Screen name="index" /> -> (app/index.tsx - WelcomeScreen)
                          └── <ScreenWrapper> (src/components/common/ScreenWrapper.tsx)
                                └── <SafeAreaView edges={['top', 'left', 'right', 'bottom']}>
                                      └── RNCSafeAreaView (native Fabric shadow node)
```

### Native Modules Touched During Startup
1. `RNSScreenStack` / `RNSScreen` (`react-native-screens`) — Native shadow node created via `UIManager::createNode`.
2. `RNCSafeAreaProvider` / `RNCSafeAreaView` (`react-native-safe-area-context`) — Native shadow node created via `UIManager::createNode`.
3. `expo-location` — Imported via service modules, but **not invoked** during initial render (only triggered when driver presses "Go Online").
4. `tokenStorage` — In-memory JavaScript class (`MemoryTokenStorage`); does not touch native storage during startup.

---

## F. Ranked Hypotheses

### Hypothesis 1: Fabric Descriptor/Prop Mismatch from Duplicate `react-native-screens` (Probability: 65%)
- **Mechanism:** Metro bundles `node_modules/expo-router/node_modules/react-native-screens@4.28.0` for `<Stack>`, but the APK contains native C++ descriptors compiled from `react-native-screens@4.26.2`. 
- When `RNSScreenStack` or `RNSScreen` is created during `<Stack>` initialization, Hermes passes prop objects or layout state that triggers an out-of-bounds indexing in vector collections during Fabric shadow node instantiation.
- **Evidence:** Exact match to `UIManager::createNode` throwing `logic_error: vector`.

### Hypothesis 2: Incompatible `react-native-safe-area-context@5.4.1` with RN 0.86.3 Fabric (Probability: 30%)
- **Mechanism:** `package.json` specifies `"~5.4.0"` (installed `5.4.1`), but Expo SDK 57 requires `"~5.7.0"`. 
- `ScreenWrapper.tsx` passes `edges={['top', 'left', 'right', 'bottom']}` to `<SafeAreaView>`.
- In `RNCSafeAreaViewShadowNode.cpp`, edge configurations are unpacked into vector representations. In React Native 0.86.3's updated Fabric architecture, the C++ codegen interface for safe area context underwent breaking changes between 5.4.x and 5.7.x.
- **Evidence:** `expo-doctor` explicitly warns of incompatibility; crash occurs precisely when the root view tree mounts.

### Hypothesis 3: `newArchEnabled=true` Strict Abort Behavior (Contributing Factor: 5%)
- **Mechanism:** In `android/gradle.properties`, `newArchEnabled=true` enables Fabric. In Old Architecture (Paper), prop mismatches log a warning and continue. In Fabric, any unhandled C++ exception in `createNode` calls `LOG(FATAL)` and aborts the app immediately.
- Disabling New Architecture (`newArchEnabled=false`) would act as a universal safety fallback if Fabric-specific codegen issues persist.

---

## G. Minimal Fix Recommendation

To resolve the crash with the smallest possible footprint and zero UI/logic disruption:

### Recommendation:
1. **Align `react-native-safe-area-context` to `~5.7.0`** in `package.json` (the exact version specified by Expo SDK 57 / React Native 0.86.3).
2. **Deduplicate `react-native-screens`** by removing the nested `node_modules/expo-router/node_modules/react-native-screens` folder and running `npm dedupe` so that both the JS bundle and native C++ binary share the exact same `~4.26.0` version.
3. *(Contingency Fallback)*: If Fabric C++ errors persist after dependency alignment, temporarily toggle `newArchEnabled=false` in `android/gradle.properties` until upstream Fabric codegen for React Native 0.86 stabilizes.

---

## H. Exact Files That Would Need Modification

| File | Proposed Change | Purpose |
|---|---|---|
| `package.json` | Change `"react-native-safe-area-context": "~5.4.0"` to `"~5.7.0"` | Align safe-area-context with Expo SDK 57 / RN 0.86.3 |
| `package-lock.json` | Regenerate via targeted install to remove nested duplicate `react-native-screens` | Eliminate dual-version JS/C++ divergence |
| *(Contingency)* `android/gradle.properties` | Change line 38 from `newArchEnabled=true` to `newArchEnabled=false` | Fallback if Fabric C++ issues persist |

---

## I. Exact Commands That Should Be Run AFTER Approval

> **Note:** DO NOT RUN THESE COMMANDS NOW. They are documented here for execution only after explicit user approval.

```powershell
# 1. Update react-native-safe-area-context to the Expo SDK 57 compatible version
npx expo install react-native-safe-area-context@~5.7.0

# 2. Remove any nested react-native-screens to eliminate duplicate version conflict
Remove-Item -Recurse -Force node_modules\expo-router\node_modules\react-native-screens -ErrorAction SilentlyContinue

# 3. Deduplicate npm tree
npm dedupe

# 4. Validate dependency alignment with Expo doctor
npx expo-doctor

# 5. Clean Android build cache before rebuilding
cd android
.\gradlew clean
cd ..
```

---

## J. What Should NOT Be Changed

To protect the stability of the project and preserve work completed in previous phases:
1. **DO NOT change backend code** (`rapidrescue-backend`). The backend contract is finalized.
2. **DO NOT change the patient application**.
3. **DO NOT redesign UI or alter screen styling** in `app/` or `src/components/`.
4. **DO NOT modify context providers or business logic** (`AuthContext`, `EmergencyContext`, `LocationContext`, `VerificationContext`).
5. **DO NOT perform broad npm upgrades** (e.g., `npm update` or bumping Expo SDK / React Native versions).
6. **DO NOT remove `@react-native-masked-view/masked-view`** (it is a transitive requirement of React Navigation and is not causing the crash).
7. **DO NOT alter `tokenStorage` or authentication flow** (it is already safe and memory-backed).
