<template>
  <v-app>
    <v-system-bar
      v-if="process.platform != 'darwin'"
      app
      window
      style="-webkit-app-region: drag; user-select: none"
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
      <v-fade-transition group leave-absolute class="ma-auto pt-1">
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
      <!-- <v-text-field
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
      ></v-text-field> -->
      <v-text-field
        style="margin: 16px"
        class="text-h6"
        solo
        v-model="vid"
        @keydown="$event.code == 'Enter' ? search() : reset()"
        :loading="loading"
        :label="vid_includes_url ? 'Paste a YouTube URL...' : 'Video ID'"
        hide-details
        :prefix="vid_includes_url ? '' : 'https://www.youtube.com/watch?v='"
      ></v-text-field>

      <div v-if="video" style="margin: 16px">
        <v-hover>
          <template v-slot:default="{ hover }">
            <v-img
              @click="openVideo()"
              v-ripple
              style="width: calc(100vw - 36px); height: auto; cursor: pointer"
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
        <h5 class="text-h5 mt-3 mb-1 text-truncate">{{ video.title }}</h5>
        <p class="grey--text mb-3 pb-0">
          By
          <a
            class="grey--text"
            @click="openExternal(video.author.channel_url)"
            >{{ video.author.name }}</a
          >
        </p>
        <v-row align="baseline" class="text-center">
          <v-col cols="3">
            <!-- <v-select
              :items="types"
              v-model="download.type"
              label="Type"
              @change="(download.format = ''), (download.resolution = '')"
            ></v-select> -->
          </v-col>

          <v-col cols="3">
            <!-- <v-select
              :disabled="!download.type"
              :items="download.type == 'video' ? video_formats : audio_formats"
              v-model="download.format"
              label="Format"
            ></v-select> -->
          </v-col>

          <v-col cols="3">
            <v-select
              :disabled="progress == true || typeof progress == 'number'"
              hide-details
              :items="resolutions"
              v-model="resolution"
              label="Resolution"
              color="#CC0000"
            ></v-select>
          </v-col>

          <v-col cols="3">
            <v-btn
              v-if="progress == false && typeof progress == 'boolean'"
              :disabled="!resolution"
              @click="stream()"
              color="#CC0000"
              block
              >Download</v-btn
            >
            <v-btn v-else @click="cancel()" color="grey darken-4" block
              >Cancel</v-btn
            >
          </v-col>
        </v-row>
      </div>
    </v-main>
    <p
      class="mb-0 pb-0 ml-3 overline"
      :class="{ 'grey--text darken-2': progress == false }"
    >
      {{ message }}
    </p>
    <v-progress-linear
      v-if="progress || typeof progress == 'number'"
      :value="progress"
      color="#CC0000"
      style="position: absolute; bottom: 0px"
    ></v-progress-linear>
  </v-app>
</template>

<script>
import { remote, shell, ipcRenderer } from "electron";
import ytdl from "ytdl-core";
import fs from "fs";
import moment from "moment";
const ffmpeg = require("ffmpeg-static");
import cp from "child_process";

let ffmpegProcess;
let interval;
let messageTimeout;

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
    vid_includes_url: true,
    progress: false,
    time: false,
    resolutions: [],
    resolution: "",
    message: "Ready",
    openExternal: shell.openExternal,
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

      const vmp4s = video.formats.filter(
        (format) =>
          format.mimeType.includes('video/mp4; codecs="avc1.') &&
          !format.mimeType.includes("mp4a")
      );

      for (let v of vmp4s) {
        this.resolutions.push({ text: v.qualityLabel, value: v.itag });
      }
      this.resolution = this.resolutions[0];

      this.loading = false;
    },
    async stream() {
      clearTimeout(messageTimeout);
      this.message = "Preparing to download...";
      let path = remote.dialog.showSaveDialogSync({
        title: "Select a Location",
        filters: [{ name: "MP4", extensions: ["mp4"] }],
        defaultPath: `${this.video.title}.mp4`,
        buttonLabel: "Download",
      });

      if (path) {
        if (fs.existsSync(path)) fs.unlinkSync(path);
        this.progress = 0;
        this.time = "00:00";
        const tracker = {
          start: Date.now(),
          audio: { downloaded: 0, total: Infinity },
          video: { downloaded: 0, total: Infinity },
          merged: { frame: 0, speed: "0x", fps: 0 },
        };
        const audio = ytdl(this.vid, { quality: "highestaudio" }).on(
          "progress",
          (_, downloaded, total) => {
            tracker.audio = { downloaded, total };
          }
        );
        const video = ytdl(this.vid, { quality: this.resolution }).on(
          "progress",
          (_, downloaded, total) => {
            tracker.video = { downloaded, total };
          }
        );

        interval = setInterval(() => {
          this.progress =
            ((tracker.audio.downloaded + tracker.video.downloaded) /
              (tracker.audio.total + tracker.video.total)) *
            100;
          this.time = moment(Date.now() - tracker.start).format("mm:ss");
          this.message = `${(Math.floor(this.progress * 10) / 10).toFixed(
            1
          )}% downloaded - time
      elapsed: ${this.time}`;
          remote.getCurrentWindow().setProgressBar(this.progress / 100);
        }, 100);

        ffmpegProcess = cp.spawn(
          ffmpeg,
          [
            "-strict",
            "experimental",
            "-hide_banner",
            "-progress",
            "pipe:3",
            "-i",
            "pipe:4",
            "-i",
            "pipe:5",
            "-map",
            "0:a",
            "-map",
            "1:v",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            path,
          ],
          {
            windowsHide: true,
            stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
          }
        );
        ffmpegProcess.on("close", () => {
          console.log("done");
          clearInterval(interval);
        });

        ffmpegProcess.on("exit", (err) => {
          console.log("exit", err);
          this.cancel();
        });

        ffmpegProcess.stdio[3].on("data", (chunk) => {
          const lines = chunk.toString().trim().split("\n");
          const args = {};
          for (const l of lines) {
            const [key, value] = l.split("=");
            args[key.trim()] = value.trim();
          }
          tracker.merged = args;
        });
        audio.pipe(ffmpegProcess.stdio[4]);
        video.pipe(ffmpegProcess.stdio[5]);
      }
    },
    cancel() {
      ffmpegProcess.kill();
      clearInterval(interval);
      this.progress = false;
      remote.getCurrentWindow().setProgressBar(-1);
      this.message = "Stopped";
      messageTimeout = setTimeout(() => {
        this.message = "Ready";
      }, 2500);
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
  created() {
    ipcRenderer.on("url", (e, url) => {
      this.vid = url.substring(7);
      // if (this.vid.includes("https://www.youtube.com/watch?v="))
      //   this.vid_includes_url = true;
      this.search();
    });
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