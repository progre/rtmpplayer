// tslint:disable-next-line:no-implicit-dependencies
try { require('source-map-support').install(); } catch (e) { /* NOP */ }
import module from './module';

async function main() {
  await module();
}

main().catch((e) => { console.error(e.stack || e); });
