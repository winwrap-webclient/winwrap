import Change from './Change';
import ChangeOp from './ChangeOp';

export default function diff(stringA, stringB, hint) { // eslint-disable-line max-statements
  const len0 = stringA.length;
  const len1 = stringB.length;
  const delta = len1 - len0;
  if (delta === 0 && stringA === stringB) {
    return null;
  }

  if (delta > 0 && hint >= delta && hint <= len1) {
    // detect simple insertion before hint (caret)
    const left = hint - delta;
    if (stringA.substring(0, left) === stringB.substring(0, left) &&
    stringA.substring(left) === stringB.substring(hint)) {
      const insert = stringB.substring(left, hint);
      return new Change(ChangeOp.EditChangeOp, left, 0, insert);
    }
  } else if (delta < 0 && hint >= 0 && hint <= len0) {
    // detect simple deletion after hint (caret)
    // delta is negative
    const right = hint - delta;
    if (stringA.substring(0, hint) === stringB.substring(0, hint) &&
    stringA.substring(right) === stringB.substring(hint)) {
      const deletecount = -delta;
      return new Change(ChangeOp.EditChangeOp, hint, deletecount, '');
    }
  }

  const min = Math.min(len0, len1);
  let offset = 0;
  const guard = hint < 100 ? 5 : 50;
  if (hint >= guard && hint < min - guard) {
    const hint0 = len0 === min ? hint : hint + len0 - len1;
    const hint1 = len1 === min ? hint : hint + len1 - len0;
    if (stringA.substring(0, hint - guard) === stringB.substring(0, hint - guard) &&
    stringA.substring(hint0 + guard) === stringB.substring(hint1 + guard)) {
      // leading strings match from to hint - guard
      // trailing strings match from hint0 + guard and hint1 + guard
      offset = hint - guard;
      stringA = stringA.substring(offset, hint0 + guard);
      stringB = stringB.substring(offset, hint1 + guard);
    }
  }

  let index = 0;
  while (index < min) {
    if (stringA.charAt(index) !== stringB.charAt(index)) {
      break;
    }
    ++index;
  }

  let indexA = len0;
  let indexB = len1;
  while (indexA > index && indexB > index) {
    if (stringA.charAt(indexA - 1) !== stringB.charAt(indexB - 1)) {
      break;
    }
    --indexA;
    --indexB;
  }

  const deletecount = indexA - index;
  const insert = stringB.substring(index, indexB);
  return new Change(ChangeOp.EditChangeOp, index + offset, deletecount, insert);
}
