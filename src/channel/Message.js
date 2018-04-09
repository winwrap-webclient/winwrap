import { Documented } from '../docs';

const messagesComplement = (req, res) => `!${req.substr(1)}` === res;

export default class Message extends Documented {
  constructor(props) {
    super();
    this.extend(props);
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
  extend(props) {
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        this[key] = props[key];
      }
    }
  }
  matchesResponse(response) {
    return (
      this.id === response.id &&
      messagesComplement(this.command, response.response)
    );
  }
}
