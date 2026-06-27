# Bir Daha Native App Roadmap

Bu dokuman Android ve iOS uygulama yol haritasini takip etmek icin tutulur. Web oyunu React/Vite olarak kalir; Capacitor sadece `dist/` web build'ini Android/iOS native kabuklarina kopyalar.

## Mevcut Durum

- Web build: Vite + React.
- PWA: Manifest, iOS meta, icon ve service worker kurulumu var.
- Capacitor config: `capacitor.config.ts`.
- App id: `com.denizardac.birdaha`.
- App name: `Bir Daha`.
- Native web dir: `dist`.
- Android proje: `android/`.
- iOS proje: `ios/`.
- Native orientation: portrait.
- Dogrulanan komutlar:
  - `npm test`
  - `npm run cap:sync`
  - `npx cap doctor`
- Bilinen lokal engel:
  - Android debug build yerelde Java 8 yuzunden durdu. Android Gradle icin Java 11+ gerekir; pratik tercih Java 17.
  - iOS build Windows'ta alinmaz; Xcode veya macOS CI gerekir.

## Temel Komutlar

```bash
npm run build
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Android Studio acmak icin:

```bash
npx cap open android
```

iOS Xcode projesi acmak icin:

```bash
npx cap open ios
```

## Android Yol Haritasi

1. Java 17 kur ve aktif et.
   - `java -version` Java 17 gostermeli.
   - Gerekirse `JAVA_HOME` Java 17 dizinine ayarlanir.

2. Android Studio kurulumu.
   - Android SDK.
   - Android SDK Platform.
   - Android SDK Build-Tools.
   - Emulator veya fiziksel cihaz.

3. Lokal debug build.
   - `cd android`
   - `.\gradlew.bat assembleDebug`
   - Beklenen cikti: `android/app/build/outputs/apk/debug/app-debug.apk`

4. Cihaz QA.
   - App acilis ve splash.
   - Portrait kilidi.
   - Status bar / safe-area.
   - Geri tusu davranisi.
   - Oyun ici scroll.
   - Maç ekrani.
   - Kaybetme ekrani.
   - Run end ve paylasim ekrani.
   - LocalStorage kayit/devam eden run.
   - Offline acilis davranisi.

5. Android icon/splash polish.
   - Varsayilan Capacitor ikonlari yerine Bir Daha ikon seti.
   - Adaptive icon foreground/background.
   - Splash rengi ve logo.

6. Release build hazirligi.
   - Version code/name stratejisi.
   - Keystore olusturma.
   - Signing config.
   - `bundleRelease` ile AAB uretimi.

7. Google Play hazirligi.
   - Uygulama adi ve aciklama.
   - Kisa aciklama.
   - Ekran goruntuleri.
   - Feature graphic.
   - Privacy policy.
   - Data Safety formu.
   - Internal testing track.

## iOS Yol Haritasi

1. Apple Developer hesabi.
   - App Store yayini icin Apple Developer Program gerekir.
   - Bundle id: `com.denizardac.birdaha`.

2. macOS build ortami.
   - Secenekler:
     - GitHub Actions macOS runner.
     - Codemagic.
     - Bitrise.
     - Kiralik/uzak Mac.

3. Xcode proje ayarlari.
   - Team secimi.
   - Bundle identifier kontrolu.
   - Signing & capabilities.
   - Version/build number.
   - Portrait orientation kontrolu.

4. iOS app QA.
   - iPhone SE / 390x844 / buyuk iPhone.
   - Safe-area ve notch.
   - Splash.
   - Status bar rengi.
   - WebView scroll hissi.
   - LocalStorage devam eden run.
   - Paylasim/kopyalama izin davranislari.

5. TestFlight.
   - Archive build.
   - App Store Connect'e upload.
   - Internal testers.
   - 20-50 kisilik beta hedefi.
   - Retention, oyun hissi ve crash takibi.

6. App Store hazirligi.
   - App adi.
   - Subtitle.
   - Description.
   - Keywords.
   - Screenshots.
   - App privacy.
   - Age rating.
   - Review notes.

## CI/CD Yol Haritasi

1. GitHub Actions Android workflow.
   - Node kurulumu.
   - Java 17 kurulumu.
   - `npm ci`.
   - `npm run cap:sync`.
   - `cd android && ./gradlew assembleDebug`.
   - APK artifact upload.

2. GitHub Actions iOS workflow.
   - macOS runner.
   - Node kurulumu.
   - `npm ci`.
   - `npm run cap:sync`.
   - Xcode build.
   - Signing secrets.
   - TestFlight upload.

3. Release workflow.
   - Tag veya manual dispatch.
   - Version bump.
   - Android AAB.
   - iOS archive.
   - Artifact retention.

## Urun ve UX Takip Listesi

1. Mobil gerçek cihaz QA.
   - 1 tam run Android cihazda.
   - 1 tam run iPhone/TestFlight'ta.

2. App store oncesi UX cilasi.
   - Ilk acilis.
   - Ana menu.
   - Kart secimi.
   - Taktik detay modali.
   - Mac ekrani.
   - Loss screen.
   - Run end screen.

3. Paylasilabilir sonuc ekrani.
   - PNG indirme/kopyalama native WebView'da test.
   - iOS clipboard davranisi.
   - Android share sheet ihtiyaci.

4. Analytics ve crash takibi.
   - Basit privacy-friendly event olcumu.
   - App crash/console hata takibi.
   - Retention olcumu.

## Bilinen Riskler

- WebView ile tarayici ayni degil; iOS Safari/WKWebView scroll ve clipboard farklari cikabilir.
- Native app icinde PWA install prompt gosterilmemeli; gerekirse Capacitor ortaminda gizlenecek.
- Android geri tusu default olarak app'i kapatabilir; oyun fazlarina gore ozel davranis gerekebilir.
- App icon/splash su an Capacitor varsayilanindan turetilmis olabilir; yayin oncesi markali asset gerekir.
- iOS build icin Mac zorunlu; Windows sadece proje hazirlar.

## Siradaki Net Isler

1. Java 17 kur ve Android debug build al.
2. Android cihazda ilk APK QA yap.
3. Native icon/splash assetlerini Bir Daha markasina gore yenile.
4. Android GitHub Actions debug APK workflow ekle.
5. iOS icin macOS CI secimini yap.
6. TestFlight pipeline kur.
