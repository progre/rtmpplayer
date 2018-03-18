// tslint:disable-next-line:no-implicit-dependencies
import electron from 'electron';
import { start } from './player';

async function main() {
  initDocument(window.document, window.devicePixelRatio, electron.ipcRenderer);
  await start();
}

function initDocument(
  document: Document,
  devicePixelRatio: number,
  ipcRenderer: electron.IpcRenderer,
) {
  scaleToPixelPerfect(document.body.style, devicePixelRatio);
  document.body.addEventListener('click', () => {
    ipcRenderer.send('click');
  });
  document.body.addEventListener('dblclick', () => {
    if (document.webkitFullscreenElement == null) {
      document.documentElement.webkitRequestFullscreen();
    } else {
      document.webkitExitFullscreen();
    }
  });
}

function scaleToPixelPerfect(style: CSSStyleDeclaration, devicePixelRatio: number) {
  style.transform = `scale(${1 / devicePixelRatio})`;
  style.width = `${devicePixelRatio * 100}%`;
  style.height = `${devicePixelRatio * 100}%`;
}

main().catch((e) => { console.error(e.stack || e); });
