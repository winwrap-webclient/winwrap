import { callee } from '../utils';

export const DOCS_URL = 'https://winwrap.com/web-editor-docs/winwrap';

export class Documented {
  help(memberName = null) {
    return `Read the documentation: ${DOCS_URL}/${this.constructor.name}#${memberName || callee()}`;
  }
}
