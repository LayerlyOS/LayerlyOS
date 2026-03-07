# Layerly Mobile App

**Manage Your 3D Print Farm from Anywhere**

`flutter-app` is a mobile application built with the Flutter framework, enabling remote access to the LayerlyOS system. Available for Android and iOS platforms.

## Features

*   **Live Preview:** Check printer status and print progress in real-time.
*   **Push Notifications:** Receive alerts about print completion or errors.
*   **Job Management:** Pause, resume, and cancel prints from your phone.
*   **Statistics:** View history and performance of your farm.

## Requirements

*   [Flutter SDK](https://flutter.dev/docs/get-started/install) (Stable version)
*   Android Studio / Xcode (for building on emulators and physical devices)

## Running the App

1.  **Get dependencies:**
    ```bash
    flutter pub get
    ```

2.  **Run on emulator or device:**
    ```bash
    flutter run
    ```

3.  **Build release version (Android):**
    ```bash
    flutter build apk --release
    ```

4.  **Build release version (iOS):**
    ```bash
    flutter build ios --release
    ```

## Configuration

The application requires the API address of your LayerlyOS instance. You can configure this in the app settings after the first launch.

## Directory Structure

*   `lib/` - Main Dart source code.
*   `assets/` - Images, icons, and fonts.
*   `test/` - Unit and widget tests.
*   `android/` - Native Android configuration.
*   `ios/` - Native iOS configuration.
