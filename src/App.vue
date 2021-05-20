<template>
  <v-app>
    <v-system-bar
      v-if="process.platform != 'darwin'"
      app
      window
      style="-webkit-app-region: drag; -webkit-user-select: none"
      height="38"
      color="#CC0000"
      class="pr-0"
    >
      <v-fade-transition
        group
        leave-absolute
        style="-webkit-app-region: no-drag"
      >
        <div
          key="logo"
          v-if="!$root.notify.is"
          style="display: inline-flex !important; margin-left: 2px; z-index: 10"
        >
          <img
            src="./assets/logo.png"
            style="margin-right: 4px; margin-top: 3px; height: 18px"
          />
          <span style="margin-top: 2px" class="mr-2">YouTube Downloader</span>
        </div>
        <span
          key="notification"
          v-if="$root.notify.is"
          v-html="$root.notify.text"
        ></span>
      </v-fade-transition>

      <v-spacer></v-spacer>
      <div style="-webkit-app-region: no-drag; margin-bottom: 1px">
        <v-icon @click="minimize()" v-ripple class="toolbar-icon"
          >mdi-minus</v-icon
        >
        <v-icon
          @click="maximized ? unmaximize() : maximize()"
          v-ripple
          class="toolbar-icon"
          >mdi-crop-square</v-icon
        >
        <v-icon @click="close()" v-ripple class="toolbar-icon"
          >mdi-close</v-icon
        >
      </div>
    </v-system-bar>

    <v-system-bar
      v-if="process.platform == 'darwin'"
      app
      window
      style="-webkit-app-region: drag"
      height="38"
      color="#CC0000"
    >
      <div
        style="height: 12px; width: 12px; border-radius: 12px"
        v-ripple
        @click="close()"
        class="red lighten-1 mx-1"
      ></div>
      <div
        style="height: 12px; width: 12px; border-radius: 12px"
        v-ripple
        @click="minimize()"
        class="yellow darken-2 mx-1"
      ></div>
      <div
        style="height: 12px; width: 12px; border-radius: 12px"
        v-ripple
        @click="maximized ? unmaximize() : maximize()"
        class="green mx-1"
      ></div>
      <v-fade-transition group leave-absolute style="margin: 4px 4px 0px 10px">
        <div
          key="logo"
          v-if="!$root.notify.is"
          style="display: inline-flex !important"
        >
          <img
            src="./assets/logo.png"
            style="height: 24px; margin-right: 4px; margin-top: 1px"
          />
          <span style="margin-right: 4px; margin-top: 3px"
            >YouTube Downloader</span
          >
        </div>
        <p
          key="notification"
          v-if="$root.notify.is"
          class="mb-1"
          v-html="$root.notify.text"
        ></p>
      </v-fade-transition>
    </v-system-bar>

    <v-main>
      <v-text-field
        style="margin: 16px"
        class="text-h6"
        solo
        v-model="vid"
        @keyup="
          vid.includes('https://www.youtube.com/watch?v=')
            ? (vid_includes_url = true)
            : (vid_includes_url = false)
        "
        @keydown="$event.code == 'Enter' ? search() : reset()"
        :loading="loading"
        :label="vid_includes_url ? 'YouTube URL' : 'Video ID'"
        hide-details
        :prefix="vid_includes_url ? '' : 'https://www.youtube.com/watch?v='"
      ></v-text-field>

      <div v-if="video" style="margin: 16px">
        <v-hover>
          <template v-slot:default="{ hover }">
            <v-img
              @click="openVideo()"
              v-ripple
              style="width: calc(100vw - 36px); cursor: pointer"
              :src="video.thumbnails[video.thumbnails.length - 1].url"
            >
              <v-fade-transition>
                <v-overlay v-if="hover" absolute color="black">
                  <v-icon size="50">mdi-play</v-icon>
                </v-overlay>
              </v-fade-transition>
            </v-img>
          </template>
        </v-hover>
        <h5 class="text-h5 my-3">{{ video.title }}</h5>
        <v-row align="center" class="text-center">
          <v-col cols="3">
            <v-select
              :items="types"
              v-model="download.type"
              label="Type"
              @change="(download.format = ''), (download.resolution = '')"
            ></v-select>
          </v-col>

          <v-col cols="3">
            <v-select
              :disabled="!download.type"
              :items="download.type == 'video' ? video_formats : audio_formats"
              v-model="download.format"
              label="Format"
            ></v-select>
          </v-col>

          <v-col cols="3">
            <v-select
              :disabled="!download.format"
              :items="
                download.type == 'video'
                  ? download.format == 'mp4'
                    ? v_mp4_res
                    : v_webm_res
                  : download.format == 'mp4'
                  ? a_mp4_res
                  : a_webm_res
              "
              v-model="download.resolution"
              :label="download.type == 'video' ? 'Resolution' : 'Bitrate'"
            ></v-select>
          </v-col>

          <v-col cols="3">
            <v-btn
              :disabled="
                !download.resolution || !download.format || !download.type
              "
              class="mb-2"
              @click="getURL()"
              color="primary"
              >Download</v-btn
            >
          </v-col>
        </v-row>
      </div>
    </v-main>
  </v-app>
</template>

<script>
import { remote, shell } from "electron";
import ytdl from "ytdl-core";

export default {
  name: "App",
  data: () => ({
    win: remote.getCurrentWindow(),
    maximized: remote.getCurrentWindow().isMaximized(),
    process,
    document,
    vid: "",
    loading: false,
    video: false,
    formats: [],
    download: {
      type: "",
      format: "",
      resolution: "",
    },
    vid_includes_url: false,

    types: [],
    video_formats: [],
    audio_formats: [],
    v_mp4_res: [],
    v_webm_res: [],
    a_mp4_res: [],
    a_webm_res: [],
  }),
  methods: {
    close() {
      this.win.close();
    },
    maximize() {
      this.win.maximize();
      this.maximized = remote.getCurrentWindow().isMaximized();
    },
    unmaximize() {
      this.win.unmaximize();
      this.maximized = remote.getCurrentWindow().isMaximized();
    },
    minimize() {
      this.win.minimize();
    },

    async search() {
      this.loading = true;
      const video = await ytdl.getInfo(
        this.vid_includes_url
          ? this.vid
          : `http://www.youtube.com/watch?v=${this.vid}`
      );
      this.video = video.videoDetails;
      this.formats = video.formats;

      const videoMimes = video.formats.filter((format) =>
        format.mimeType.includes("video")
      );
      if (videoMimes.length > 0)
        this.types.push({ text: "Video", value: "video" });

      const vmp4s = videoMimes.filter((format) =>
        format.mimeType.includes("mp4")
      );
      if (vmp4s.length > 0)
        this.video_formats.push({ text: "MP4", value: "mp4" });
      const vwebms = videoMimes.filter((format) =>
        format.mimeType.includes("webm")
      );
      if (vwebms.length > 0)
        this.video_formats.push({ text: "WEBM", value: "webm" });

      for (let v of vwebms) {
        this.v_webm_res.push({ text: v.qualityLabel, value: v.qualityLabel });
      }
      for (let v of vmp4s) {
        this.v_mp4_res.push({ text: v.qualityLabel, value: v.qualityLabel });
      }

      const audioMimes = video.formats.filter((format) =>
        format.mimeType.includes("audio")
      );
      if (audioMimes.length > 0)
        this.types.push({ text: "Audio", value: "audio" });
      const amp4s = audioMimes.filter((format) =>
        format.mimeType.includes("mp4")
      );
      if (amp4s.length > 0)
        this.audio_formats.push({ text: "MP4", value: "mp4" });
      const awebms = audioMimes.filter((format) =>
        format.mimeType.includes("webm")
      );
      if (awebms.length > 0)
        this.audio_formats.push({ text: "WEBM", value: "webm" });

      for (let a of awebms) {
        this.a_webm_res.push({
          text: a.audioSampleRate,
          value: a.audioSampleRate,
        });
      }
      for (let a of amp4s) {
        this.a_mp4_res.push({
          text: a.audioSampleRate,
          value: a.audioSampleRate,
        });
      }
      this.loading = false;
    },
    getURL() {
      const mime = `${this.download.type}/${this.download.format}`;
      const mimeFilter = this.formats.filter((format) =>
        format.mimeType.includes(mime)
      );
      let result;
      if (this.download.type == "video") {
        result = mimeFilter.find(
          (format) => format.qualityLabel == this.download.resolution
        );
      }
      if (this.download.type == "audio") {
        result = mimeFilter.find(
          (format) => format.quality == this.download.resolution
        );
      }

      shell.openExternal(result.url);
    },
    openVideo() {
      shell.openExternal(
        this.vid_includes_url
          ? this.vid
          : `https://www.youtube.com/watch?v=${this.vid}`
      );
    },
    reset() {
      this.video = false;
      this.formats = [];
      this.download = {
        type: "",
        format: "",
        resolution: "",
      };
      this.types = [];
      this.video_formats = [];
      this.audio_formats = [];
      this.v_mp4_res = [];
      this.v_webm_res = [];
      this.a_mp4_res = [];
      this.a_webm_res = [];
    },
  },
};
</script>

<style>
html {
  overflow: hidden !important;
}

input {
  color: white;
  outline: none;
}
</style>