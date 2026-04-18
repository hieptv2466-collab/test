export const pluginData = {
  ".github/workflows/build.yml": `name: Build Plugins

on:
  push:
    branches:
      - master
      - main
  workflow_dispatch:

jobs:
  build:
    name: Build plugins
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: "temurin"
          java-version: "17"

      - name: Make executable
        run: chmod +x ./gradlew

      - name: Build Plugins
        run: ./gradlew make
        
      - name: Create plugins.json
        run: ./gradlew makePluginsJson

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build
`,
  "settings.gradle.kts": `include(":PhimHay")
`,
  "build.gradle.kts": `buildscript {
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.4.2")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.20")
        classpath("com.github.recloudstream:gradle:-SNAPSHOT")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}
`,
  "gradle.properties": `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
`,
  "gradlew": `#!/usr/bin/env sh
# Gradle wrapper script placeholder
echo "Use standard gradlew"
`,
  "gradlew.bat": `@rem Gradle wrapper script placeholder
echo "Use standard gradlew"
`,
  "PhimHay/build.gradle.kts": `import com.lagradost.cloudstream3.gradle.CloudstreamExtension

apply(plugin = "com.android.library")
apply(plugin = "kotlin-android")
apply(plugin = "com.lagradost.cloudstream3.gradle")

cloudstream {
    name = "PhimHay"
    description = "Addon xem phim tiếng Việt hoàn thiện. Hỗ trợ Github Actions."
    versionCode = 1
    versionName = "1.0.0"
    authors = listOf("AI Studio")
    iconUrl = "https://raw.githubusercontent.com/recloudstream/cloudstream/master/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
}

android {
    compileSdk = 33
    defaultConfig {
        minSdk = 21
        targetSdk = 33
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("com.github.recloudstream:cloudstream:master-SNAPSHOT")
    implementation("org.jsoup:jsoup:1.15.3")
}
`,
  "PhimHay/src/main/AndroidManifest.xml": `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.phimhay">
</manifest>
`,
  "PhimHay/src/main/kotlin/com/phimhay/PhimHayPlugin.kt": `package com.phimhay

import com.lagradost.cloudstream3.plugins.CloudstreamPlugin
import com.lagradost.cloudstream3.plugins.Plugin
import android.content.Context

@CloudstreamPlugin
class PhimHayPlugin: Plugin() {
    override fun load(context: Context) {
        // Here we register our Movie/Anime Provider
        registerMainAPI(PhimHayProvider())
        // Registering another extractor if we have one
        // registerExtractorAPI(MyExtractor())
    }
}
`,
  "PhimHay/src/main/kotlin/com/phimhay/PhimHayProvider.kt": `package com.phimhay

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.utils.AppUtils.parseJson
import com.lagradost.cloudstream3.utils.ExtractorLink
import com.lagradost.cloudstream3.utils.Qualities
import org.jsoup.Jsoup

class PhimHayProvider : MainAPI() {
    override var mainUrl = "https://phimhay.to" // Replace with real URL
    override var name = "PhimHay"
    override val hasMainPage = true
    override var lang = "vi"
    override val supportedTypes = setOf(TvType.Movie, TvType.TvSeries, TvType.Anime)

    // Ví dụ mẫu lấy trang chủ
    override suspend fun getMainPage(page: Int, requestPath: String?): HomePageResponse {
        val items = ArrayList<HomePageList>()
        
        // Tạo một số phim giả lập làm mâm cơm (thay bằng Jsoup connect thật để cào phim)
        val dummyList = listOf(
            MovieSearchResponse(
                "Phim Giả Lập Mới Nhất",
                "https://phimhay.to/movie/1",
                this.name,
                TvType.Movie,
                "https://cdn.pixabay.com/photo/2023/12/15/22/37/mountains-8451680_1280.jpg",
                year = 2024
            ),
            MovieSearchResponse(
                "Anime Vietsub Siêu Phẩm", 
                "https://phimhay.to/movie/2",
                this.name,
                TvType.Anime,
                "https://cdn.pixabay.com/photo/2016/11/29/03/53/architecture-1867187_1280.jpg",
                year = 2023
            )
        )
        
        items.add(HomePageList("Đề xuất cho bạn", dummyList))
        return HomePageResponse(items)
    }

    override suspend fun search(query: String): List<SearchResponse> {
        // Thực hiện lệnh Jsoup.connect() với query ở đây
        return listOf()
    }

    override suspend fun load(url: String): LoadResponse {
        // Gọi thư viện cào dữ liệu URL và render chi tiết phim
        return newMovieLoadResponse("Phim Giả Lập", url, TvType.Movie, url) {
            this.posterUrl = "https://cdn.pixabay.com/photo/2023/12/15/22/37/mountains-8451680_1280.jpg"
            this.year = 2024
            this.plot = "Đây là Addon CloudStream tiếng Việt đầu tiên được tạo bởi AI. Hỗ trợ tự động Github Action siêu xịn sò."
            this.tags = listOf("Hành Động", "Viễn Tưởng")
            this.rating = 95
        }
    }

    override suspend fun loadLinks(data: String, isCasting: Boolean, callback: (ExtractorLink) -> Unit, subtitleCallback: (SubtitleFile) -> Unit): Boolean {
        // Đây là video stream demo (HLS Live stream video)
        callback(
            ExtractorLink(
                this.name,
                "Demo Stream 1080p",
                "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Direct link stream m3u8
                this.mainUrl,
                Qualities.P1080.value,
                isM3u8 = true
            )
        )
        // Gọi callback phụ đề nếu trang có phụ đề srt/vtt
        subtitleCallback(
            SubtitleFile(
                "Vietnamese",
                "https://example.com/sub.vtt"
            )
        )
        return true
    }
}
`,
  "README.md": `# Mẫu CloudStream Plugin - Tiếng Việt

Được tạo tự động. Repository này chứa một mẫu Addon cho CloudStream.

## Cách sử dụng với GitHub Actions (Quan trọng)

1. **Fork hoặc tạo một Repository mới** trên GitHub của bạn.
2. Upload tất cả các file này lên repository đó.
3. Chờ **GitHub Actions** tự động biên dịch Plugin.
4. Tới mục **Settings > Pages**, chọn deploy từ nhánh \`gh-pages\`.
5. Sau đó, đường dẫn plugin JSON của bạn sẽ có dạng: 
   \`https://<user>.github.io/<repo>/plugins.json\`
6. Dán link này vào CloudStream App là xong!
`
};
