import { Documented } from '../docs';

export default class Breaks extends Documented {
  constructor(channel) {
    super();
    this.channel_ = channel;
    this.breaks = [];
  }

  BreakResponseHandler(response) {
    let breaks = this.breaks;
    breaks = breaks.filter(el => el.line !== response.line || el.target !== response.target);
    if (response.on === true) {
      breaks.push({ 'target': response.target, 'line': response.line });
    }
    this.breaks = breaks;
  }

  BreaksResponseHandler(response) {
    let breaks = [];
    let newBreaks = response.breaks;
    if (newBreaks !== undefined) {
      newBreaks.forEach(macroBreaks => {
        macroBreaks.lines.forEach(line => {
          breaks.push({ 'target': macroBreaks.name, 'line': line });
        });
      });
    }
    this.breaks = breaks;
  }

  GetBreaks(target) {
    let breaks = this.breaks;
    breaks = breaks.filter(el => el.target === target);
    return breaks;
  }

  IsBreak(name, aline) {
    let breaks = this.breaks;
    let abreak = breaks.find(el => {
      let match = el.target === name && el.line === aline;
      return match;
    });
    return abreak !== undefined;
  }
}
