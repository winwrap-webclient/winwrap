import { isUndefined } from 'lodash';
import ChangeOp from './ChangeOp';

export default class Change {
  constructor(op, index, deletecount, insert) {
    this.op = op;
    this.index = index;
    this.delete_count = deletecount;
    this.insert = insert;
  }

  AdjustCaret(x, is_server) {
    // server operation at Index does not adjust the caret
    if (x >= this.index + is_server) {
      if (x >= this.DeleteIndex()) {
        // shift by change's delta
        return x + this.Delta();
      } else if (is_server) {
        // move to front of change
        return this.index;
      }
      // move to end of change
      return this.InsertIndex();
    }
    return x;
  }

  CanCombine(nextchange) {
    if (this.op !== ChangeOp.EditChangeOp || nextchange.op !== ChangeOp.EditChangeOp) {
      return this.op === nextchange.op && this.Equals(nextchange);
    }
    return this.index <= nextchange.DeleteIndex() && nextchange.index <= this.InsertIndex();
  }

  Combine(nextchange) { // eslint-disable-line max-statements
    if (!this.CanCombine(nextchange)) {
      return false;
    }

    let iIndex = 0;
    let iDelete = nextchange.delete_count;
    let sInsert = '';
    const iThisInsertLength = this.InsertLength();

    // this is the prior change
    let iPriorInsertHeadCount = 0;
    let iPriorInsertTailCount = 0;
    if (nextchange.index < this.index) {
      // next change is left of this (prior) change
      iIndex = nextchange.index;
      iPriorInsertHeadCount = 0;
      const iKeepDelete = this.index - iIndex;
      let iPriorInsertDelete = iDelete - iKeepDelete;
      if (iPriorInsertDelete > iThisInsertLength) {
        iPriorInsertDelete = iThisInsertLength;
      }

      iDelete -= iPriorInsertDelete;
      iPriorInsertTailCount = iThisInsertLength - iPriorInsertDelete;
    } else {
      // next change is at or right of this (prior) change
      iIndex = this.index;
      iPriorInsertHeadCount = nextchange.index - iIndex;
      if (iPriorInsertHeadCount > iThisInsertLength) {
        iPriorInsertHeadCount = iThisInsertLength;
      }

      iPriorInsertTailCount = iThisInsertLength - iPriorInsertHeadCount;
      if (iDelete < iPriorInsertTailCount) {
        // all of next change's delete count goes to the this (prior) change's insert
        // some of the this (prior) change's insert is still inserted (tail portion)
        iPriorInsertTailCount -= iDelete;
        iDelete = 0;
      } else {
        // some of the next change's delete goes to the constructed change
        // none of the this (prior) change's insert beyond the head portion is retained
        iDelete -= iPriorInsertTailCount;
        iPriorInsertTailCount = 0;
      }
    }

    // left portion of this (prior) change's insert
    if (iPriorInsertHeadCount > 0) {
      sInsert += this.insert.substring(0, iPriorInsertHeadCount);
    }

    // all of next change's insert
    sInsert += nextchange.insert;

    // right portion of this (prior) change's insert
    if (iPriorInsertTailCount > 0) {
      sInsert += this.insert.substring(iThisInsertLength - iPriorInsertTailCount);
    }

    // all of this (prior) change's delete count
    iDelete += this.delete_count;

    this.index = iIndex;
    this.delete_count = iDelete;
    this.insert = sInsert;
    return true;
  }

  Copy() {
    return new Change(this.op, this.index, this.delete_count, this.insert);
  }

  DeleteCount() {
    return this.delete_count;
  }

  DeleteIndex() {
    return this.index + this.delete_count;
  }

  Delta() {
    return this.InsertLength() - this.delete_count;
  }

  Equals(change) {
    return this.op === change.op && this.index === change.index && this.delete_count === change.delete_count && this.insert === change.insert;
  }

  Index() {
    return this.index;
  }

  Insert() {
    return this.insert;
  }

  InsertIndex() {
    return this.index + this.InsertLength();
  }

  InsertLength() {
    const position = isUndefined(this.insert) ? 0 : this.insert.length;
    return this.op === ChangeOp.EditChangeOp
      ? position
      : this.delete_count;
  }

  IsNull() {
    return this.op === ChangeOp.EditChangeOp && this.delete_count === 0 && (isUndefined(this.insert) || this.insert === '');
  }

  MergeTransform(serverChange) { // eslint-disable-line max-statements
    let beforeChange = new Change(0, 0, '');
    let afterChange = new Change(0, 0, '');
    if (this.DeleteIndex() < serverChange.index) {
      // entirely before serverChange
      beforeChange = this.Copy();
    } else if (this.index >= serverChange.DeleteIndex()) {
      // entirely after serverChange
      afterChange = this.Copy();
      afterChange.index += serverChange.Delta();
    } else {
      // overlaps
      if (this.index < serverChange.index) {
        // overlaps start - split into two
        beforeChange.index = this.index;
        beforeChange.delete_count = serverChange.index - this.index;

        afterChange.index = serverChange.insert_Index();
        afterChange.delete_count = this.delete_count - beforeChange.delete_count - serverChange.delete_count;
        if (afterChange.delete_count < 0) {
          afterChange.delete_count = 0;
        }

        // shift after change forward
        afterChange.index -= beforeChange.delete_count;
        if (afterChange.index === beforeChange.index) {
          // merge into after change - remove before change
          afterChange.delete_count += beforeChange.delete_count;
          beforeChange.delete_count = 0;
        }
      } else {
        // overlap end or subset
        afterChange.index = serverChange.insert_Index();
        afterChange.delete_count = this.DeleteIndex() - serverChange.DeleteIndex();
        if (afterChange.delete_count < 0) {
          afterChange.delete_count = 0;
        } else if (afterChange.delete_count > this.delete_count) {
          afterChange.delete_count = this.delete_count;
        }
      }

      afterChange.insert = this.insert;
    }

    const changes = [];
    if (!beforeChange.IsNull()) {
      changes.push(beforeChange);
    }

    if (!afterChange.IsNull()) {
      changes.push(afterChange);
    }

    return changes;
  }

  Op() {
    return this.op;
  }

  RevertChange(s0) {
    return new Change(ChangeOp.EditChangeOp, this.index, this.InsertLength(), s0.substring(this.index, this.DeleteIndex()));
  }

  toString() {
    let s = `${this.index}-${this.delete_count}`;
    if (!isUndefined(this.insert)) {
      if (typeof this.insert === 'string') {
        s += `"${this.insert}"`;
      } else {
        s += JSON.stringify(this.insert);
      }
    }

    return s;
  }
}
