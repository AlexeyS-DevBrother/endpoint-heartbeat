import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
    removeCircular(obj) {
      const seen = new WeakSet();
      const recursiveRemove = (obj, result = {}) => {
        seen.add(obj);
        const entries = Object.entries(obj);
        // eslint-disable-next-line prefer-const
        for (let [key, value] of entries) {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) continue;
            seen.add(value);
            value = recursiveRemove(value);
            result[key] = value;
          } else if (typeof value !== 'object') result[key] = value + '';
        }
        return result;
      };
      return recursiveRemove(obj);
    }

    parseBoolean(prop: string): boolean {
      if (prop === 'true') return true;
      else if (prop === 'false') return false;
      else prop;
    }
}
