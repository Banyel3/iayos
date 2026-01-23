# Flutter Mobile Build with Docker

This guide explains how to build the Flutter mobile app using Docker, which ensures a consistent build environment across all platforms.

## Quick Start

### Build APK using Docker (Recommended for CI/CD)

```powershell
# Build Flutter APK and extract to ./output folder
.\scripts\build-mobile.ps1
```

Or manually:

```powershell
docker buildx build --target mobile-production --output type=local,dest=./output -f Dockerfile .
```

The APK files will be available in the `./output/` directory:
- `app-armeabi-v7a-release.apk` - ARM 32-bit (older devices)
- `app-arm64-v8a-release.apk` - ARM 64-bit (modern devices)
- `app-x86_64-release.apk` - Intel/AMD 64-bit (emulators)

## Development Workflow

### Option 1: Local Flutter Development (Recommended)

Run Flutter directly on your machine for faster hot reload:

```powershell
cd apps\frontend_mobile\iayos_mobile
flutter pub get
flutter run
```

### Option 2: Docker Development Container

Use Docker for a consistent development environment:

```powershell
# Start mobile development container (with profile flag)
docker-compose -f docker-compose.dev.yml --profile mobile up mobile

# In another terminal, run Flutter commands inside the container
docker exec -it iayos-mobile-dev flutter pub get
docker exec -it iayos-mobile-dev flutter run
```

## Build Targets

The Dockerfile includes the following Flutter-related stages:

### Stage 4: `flutter-base`
Base Flutter SDK image with Android SDK precached. Used as foundation for builds.

### Stage 5: `mobile-builder`
Builds the Flutter app and generates APK files.

### Stage 6: `mobile-production`
Extracts built APK files to host filesystem.

## Build Commands

### Build specific architecture APK

```powershell
# Build only ARM64 (most modern Android devices)
docker buildx build --target mobile-builder --build-arg BUILD_ARGS="--target-platform android-arm64" -f Dockerfile .

# Build all architectures (default)
docker buildx build --target mobile-builder -f Dockerfile .
```

### Build App Bundle (AAB) for Play Store

Modify the Dockerfile `mobile-builder` stage to use:

```dockerfile
RUN flutter build appbundle --release
```

Then extract with:

```powershell
docker buildx build --target mobile-production --output type=local,dest=./output -f Dockerfile .
```

The AAB will be in `./output/app-release.aab`

## API Configuration

The Flutter app connects to the backend via `api_config.dart`:

- **Android Emulator**: Uses `http://10.0.2.2:8000` (special IP for host machine)
- **iOS Simulator**: Uses `http://localhost:8000`
- **Physical Device**: Update to your machine's local IP (e.g., `http://192.168.1.100:8000`)

## Backend Requirements

Ensure your Django backend is configured to accept mobile connections:

1. **ALLOWED_HOSTS** in `apps/backend/src/iayos_project/settings.py`:
   ```python
   ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.2.2', '*']
   ```

2. **CORS Settings**:
   ```python
   CORS_ALLOW_ALL_ORIGINS = True  # For development
   ```

3. **Backend Running**:
   ```powershell
   docker-compose -f docker-compose.dev.yml up backend
   ```

## Troubleshooting

### Build fails with "Flutter SDK not found"
The first build will take longer as Docker downloads and caches the Flutter SDK (~700MB).

### APK not working on device
- Ensure you're using the correct architecture APK for your device
- Most modern devices use `app-arm64-v8a-release.apk`
- Check Android version compatibility in `build.gradle`

### Backend connection fails
1. Check backend is running: `docker ps | grep backend`
2. Verify `api_config.dart` has correct URL (`http://10.0.2.2:8000` for emulator)
3. Check Django `ALLOWED_HOSTS` and CORS settings
4. Test backend manually: `curl http://10.0.2.2:8000/api/health/` (from emulator)

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build Flutter APK
  run: |
    docker buildx build \
      --target mobile-production \
      --output type=local,dest=./dist \
      -f Dockerfile .

- name: Upload APK
  uses: actions/upload-artifact@v3
  with:
    name: flutter-apk
    path: ./dist/*.apk
```

## File Sizes

Typical APK sizes:
- ARM64: ~20-25 MB (release mode, no splitting)
- Split per ABI: ~15-18 MB each
- With ProGuard/R8: ~12-15 MB

## Next Steps

1. **Code Signing**: Add keystore for production releases
2. **ProGuard/R8**: Enable code obfuscation for production
3. **Flavor Configuration**: Setup dev/staging/prod build flavors
4. **Automated Testing**: Add Flutter integration tests to Docker build

## Resources

- [Flutter Docker Best Practices](https://docs.flutter.dev/deployment/docker)
- [Android APK Signing](https://docs.flutter.dev/deployment/android#signing-the-app)
- [Flutter Build Modes](https://docs.flutter.dev/testing/build-modes)
