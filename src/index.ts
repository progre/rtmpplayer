// tslint:disable:no-implicit-dependencies
try { require('source-map-support').install(); } catch (e) { /* NOP */ }
import electron from 'electron';
// tslint:enable:no-implicit-dependencies
import { serve } from './server';
import WindowSizeController from './WindowSizeController';

const { app, BrowserWindow, dialog, ipcMain } = electron;

class PlayerWindowWrapper {
  private windowSizeController: WindowSizeController;

  constructor(listeningInfo: string) {
    const win = new BrowserWindow({
      backgroundColor: 'black',
      height: 360,
      title: `RTMP Player (${listeningInfo})`, // TODO: It should be presented on main content.
      minHeight: 180,
      minWidth: 320,
      resizable: true,
      show: false,
      useContentSize: true,
      width: 640,
    });
    win.setMenuBarVisibility(false);
    win.loadURL(`file://${__dirname}/public/index.html`);
    win.on('ready-to-show', () => {
      win.show();
    });
    this.windowSizeController = new WindowSizeController(electron.screen, win);
    this.fitToAspectRatio
      = this.windowSizeController.fitToAspectRatio.bind(this.windowSizeController);
    this.setScalableContentSize
      = this.windowSizeController.setScalableContentSize.bind(this.windowSizeController);
    this.clearAspectRatio
      = this.windowSizeController.clearAspectRatio.bind(this.windowSizeController);
  }

  fitToAspectRatio: typeof WindowSizeController.prototype.fitToAspectRatio;
  setScalableContentSize: typeof WindowSizeController.prototype.setScalableContentSize;
  clearAspectRatio: typeof WindowSizeController.prototype.clearAspectRatio;
}

async function main() {
  const port = Number.parseInt(process.argv[(process.defaultApp ? 1 : 0) + 1], 10) || 1935;
  await new Promise((resolve, reject) => app.once('ready', resolve));
  app.on('window-all-closed', app.quit.bind(app));

  const wrapper = new PlayerWindowWrapper(`rtmp://0.0.0.0:${port}/live`);
  ipcMain.on(
    'play',
    (_: any, params: { width: number; height: number; devicePixelRatio: number }) => {
      wrapper.setScalableContentSize(
        params.width,
        params.height,
        params.devicePixelRatio,
      );
    },
  );
  ipcMain.on('stop', (_: any) => {
    wrapper.clearAspectRatio();
  });
  ipcMain.on('click', () => { wrapper.fitToAspectRatio(); });
  try {
    await serve(port);
  } catch (e) {
    dialog.showErrorBox(e.message, '');
    app.quit();
  }
}

main().catch((e) => { console.error(e.stack || e); });
