// tslint:disable-next-line:no-implicit-dependencies
import electron from 'electron';
const flvJS = require('flv.js').default;

class VolumeIndicator {
  private fadeoutTimer: any;

  constructor(
    private blockElement: HTMLDivElement,
    private valueElement: HTMLSpanElement,
  ) {
  }

  update(valuePercent: number) {
    this.valueElement.textContent = Math.floor(valuePercent).toString();
    this.blockElement.style.transitionDuration = '0s';
    this.blockElement.style.opacity = '1';
    clearTimeout(this.fadeoutTimer);
    this.fadeoutTimer = setTimeout(
      () => {
        this.blockElement.style.transitionDuration = '300ms';
        this.blockElement.style.opacity = '0';
      },
      2000,
    );
  }
}

class VideoWrapper {
  constructor(
    window: Window,
    private ipcRenderer: electron.IpcRenderer,
    volumeIndicator: VolumeIndicator,
    private video: HTMLVideoElement,
    private noSignalBlock: HTMLDivElement,
  ) {
    this.onPlay = this.onPlay.bind(this);
    this.onStop = this.onStop.bind(this);

    window.addEventListener('wheel', (e) => {
      const volumePercent = addVolumeByWheel(
        video.volume * 100,
        navigator.platform,
        e.deltaY,
      );
      video.volume = volumePercent / 100;
      volumeIndicator.update(volumePercent);
    });
    video.volume = 0.5;
    video.addEventListener('loadedmetadata', this.onPlay);
    video.addEventListener('emptied', this.onStop);
  }

  private onPlay() {
    this.noSignalBlock.style.display = 'none';
    this.ipcRenderer.send('play', {
      width: this.video.videoWidth,
      height: this.video.videoHeight,
      devicePixelRatio: window.devicePixelRatio,
    });
  }

  private onStop() {
    this.noSignalBlock.style.display = null;
    this.ipcRenderer.send('stop');
  }
}

function addVolumeByWheel(currentVolumePercent: number, platform: string, deltaY: number) {
  // Windowsのデフォルトでは+-100 OSXだと+-1~
  let deltaPercent: number;
  const isWin = platform.indexOf('Win') >= 0;
  if (isWin) {
    deltaPercent = deltaY > 0 ? -5 : 5;
  } else {
    deltaPercent = deltaY / 10;
  }
  let volumePercent = currentVolumePercent + deltaPercent;
  if (volumePercent < 0) {
    volumePercent = 0;
  } else if (100 < volumePercent) {
    volumePercent = 100;
  }
  return volumePercent;
}

export async function start() {
  const video = <HTMLVideoElement>document.getElementById('video');
  const volumeIndicator = new VolumeIndicator(
    <HTMLDivElement>window.document.getElementById('volume-block'),
    <HTMLSpanElement>window.document.getElementById('volume-value'),
  );
  // tslint:disable-next-line:no-unused-expression
  new VideoWrapper(
    window,
    electron.ipcRenderer,
    volumeIndicator,
    <HTMLVideoElement>document.getElementById('video'),
    <HTMLDivElement>document.getElementById('no-signal'),
  );
  const port = 8000;
  for (; ;) {
    await startPlayer(video, port);
  }
}

async function startPlayer(element: HTMLVideoElement, port: number) {
  const flvPlayer = flvJS.createPlayer({
    isLive: true,
    type: 'flv',
    url: `ws://localhost:${port}/live/.flv`,
  });
  flvPlayer.attachMediaElement(element);
  flvPlayer.load();
  await new Promise((resolve, reject) => {
    flvPlayer.play();
    flvPlayer.on(flvJS.Events.LOADING_COMPLETE, resolve);
  });
  flvPlayer.destroy();
}
