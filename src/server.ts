// tslint:disable-next-line:variable-name
const NodeMediaServer = require('node-media-server');
import net from 'net';

export async function serve(port: number) {
  await isFreePort(port);
  const config = {
    rtmp: {
      port,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      ping_timeout: 30,
    },
    http: {
      port: 8000, // TODO: use efemeral port
      allow_origin: '*',
    },
  };
  const nms = new NodeMediaServer(config);
  nms.run();
  nms.nrs.tcpServer.on('error', (e: any) => {
    console.error(e);
  });
}

async function isFreePort(port: number) {
  return new Promise((resolve, reject) => {
    const conn = net.connect(port);
    conn.on('connect', () => {
      conn.destroy();
      reject(new Error(`TCP ${port} is already assigned.`));
    });
    conn.on('error', () => {
      conn.destroy();
      resolve();
    });
  });
}
