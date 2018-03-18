// tslint:disable-next-line:no-implicit-dependencies
import electron from 'electron';

export default class WindowSizeController {
  private aspectRatio?: number; // width / height

  constructor(
    private screen: electron.Screen,
    private win: electron.BrowserWindow,
  ) {
  }

  fitToAspectRatio() {
    if (this.aspectRatio == null) {
      return;
    }
    const [width, height] = this.win.getContentSize();
    const expectedWidth = Math.floor(height * this.aspectRatio);
    const [x, y] = this.win.getPosition();
    if (width > expectedWidth) {
      this.setContentSize(expectedWidth, height);
      this.win.setPosition(x + Math.floor((width - expectedWidth) / 2), y);
      this.keepWithinDisplayRange();
    } else if (width < expectedWidth) {
      const expectedHeight = Math.floor(width / this.aspectRatio);
      this.setContentSize(width, expectedHeight);
      this.win.setPosition(x, y + Math.floor((height - expectedHeight) / 2));
      this.keepWithinDisplayRange();
    }
  }

  setScalableContentSize(width: number, height: number, devicePixelRatio: number) {
    this.aspectRatio = width / height;
    const expectedWidth = Math.floor(width / devicePixelRatio);
    const expectedHeight = Math.floor(height / devicePixelRatio);
    this.setContentSize(expectedWidth, expectedHeight);
  }

  clearAspectRatio() {
    this.aspectRatio = undefined;
  }

  private setContentSize(expectedWidth: number, expectedHeight: number) {
    const [precheckWidth, precheckHeight] = this.win.getContentSize();
    if (expectedWidth === precheckWidth && expectedHeight === precheckHeight) {
      return;
    }
    this.win.setContentSize(expectedWidth, expectedHeight);
    // Electron 1.8.2 win セットした通りにならないので差分を設定しなおす
    for (let i = 0; ; i += 1) {
      const [actualWidth, actualHeight] = this.win.getContentSize();
      if (expectedWidth === actualWidth && expectedHeight === actualHeight) {
        return;
      }
      if (i > 5) {
        console.warn(`expectedWidth=${expectedWidth} expectedHeight=${expectedHeight}`
          + ` actualWidth=${actualWidth} actualHeight=${actualHeight}`);
        return;
      }
      this.win.setContentSize(
        expectedWidth * 2 - actualWidth,
        expectedHeight * 2 - actualHeight,
      );
    }
  }

  private setBounds(bounds: electron.Rectangle) {
    this.win.setBounds(bounds);
    // Electron 1.8.2 win セットした通りにならないので差分を設定しなおす
    const [actualWidth, actualHeight] = this.win.getSize();
    if (bounds.width === actualWidth && bounds.height === actualHeight) {
      this.win.setSize(
        bounds.width * 2 - actualWidth,
        bounds.height * 2 - actualHeight,
      );
      const [actualWidth2, actualHeight2] = this.win.getSize();
      if (bounds.width !== actualWidth2
        || bounds.height !== actualHeight2) {
        console.warn(`expectedWidth=${bounds.width} expectedHeight=${bounds.height}`
          + ` actualWidth=${actualWidth2} actualHeight=${actualHeight2}`);
        // throw new Error(`expectedWidth=${expectedWidth} expectedHeight=${expectedHeight}`
        //   + ` actualWidth=${actualWidth2} actualHeight=${actualHeight2}`);
      }
    }
  }

  private keepWithinDisplayRange() {
    const bounds = this.win.getBounds();
    let modify = false;
    const metrics = this.screen.getDisplayMatching(bounds);
    if (bounds.width > metrics.size.width) {
      modify = true;
      bounds.width = metrics.size.width;
    }
    if (bounds.height > metrics.size.height) {
      modify = true;
      bounds.height = metrics.size.height;
    }
    if (bounds.x + bounds.width <= metrics.workArea.x) {
      modify = true;
      bounds.x = metrics.workArea.x;
    }
    if (metrics.workArea.x + metrics.workArea.width <= bounds.x) {
      modify = true;
      bounds.x = metrics.workArea.x + metrics.workArea.width - bounds.width;
    }
    if (bounds.y <= metrics.workArea.y) {
      modify = true;
      bounds.y = metrics.workArea.y;
    }
    if (metrics.workArea.y + metrics.workArea.height <= bounds.y) {
      modify = true;
      bounds.y = metrics.workArea.y + metrics.workArea.height - bounds.height;
    }
    if (modify) {
      this.setBounds(bounds);
    }
  }
}
