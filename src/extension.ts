import { logger } from '@pano/utils/shell';
import './styles/stylesheet.css';

const debug = logger('extension');

class PanoExtension {
  constructor() {
    debug('extension is initialized');
  }

  enable(): void {
    debug('extension is enabled');
  }

  disable(): void {
    debug('extension is disabled');
  }
}

export default function (): PanoExtension {
  return new PanoExtension();
}
