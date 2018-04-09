import { isUndefined } from 'lodash';
import { Documented } from '../docs';
import Change from './Change';
import Changes from './Changes';
import ChangeOp from './ChangeOp';
import Doc from './Doc';

export default class CommitRebase extends Documented {
  constructor(allocatedChannelId) {
    super();
    this.allocatedChannelId = allocatedChannelId;
    this.doc = null;
    // channel.AddResponseHandlers({
    //   commit: response => {
    //     this.CommitDone(response);
    //   },
    //   rebase: response => {
    //     if (!response.visible) {
    //       // hidden code is manipulated by this implementation
    //       return;
    //     }
    //     if (this.doc.InCommit(response.target)) {
    //       // rebasing self commit - no extra work required
    //       return;
    //     }
    //     this.doc.NeedCommit();
    //   },
    // });
  }

  SetEditor(editor) {
    this.editor_ = editor;
  }

  AppendPendingChange(op, caret) {
    this.doc.AppendPendingChange(op, caret);
  }

  applyCommit(response) {
    if (response.success) {
      if (response.target === this.Name()) {
        const serverChanges = new Changes();
        response.visible.forEach(change => {
          serverChanges.AppendNoCombine(new Change(ChangeOp.EditChangeOp, change.index, change.delete, change.insert));
        });
        this.doc.Rebase(serverChanges);
        this.doc.SetRevision(response.revision);
        if (!isUndefined(response.caret_index)) {
          this.editor_.SetSelection({ first: response.caret_index, last: response.caret_index });
        }
      }
    } else {
      console.error('Commit failed.');
    }
    this.doc.CommitDone();
  }

  getCommit() {
    let request = null;
    const commit = this.doc === null ? null : this.doc.Commit();
    if (commit !== null) {
      //console.log("Send ?commit request");
      const visibleChanges = [];
      if (commit.AnyChanges()) {
        commit.Changes().Changes().forEach(change => {
          if (change.Op() === ChangeOp.EditChangeOp) {
            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'delete': change.DeleteCount(), 'insert': change.Insert() });
          } else if (change.Op() === ChangeOp.EnterChangeOp || change.Op() === ChangeOp.FixupChangeOp) {
            visibleChanges.push({ 'op': change.Op(), 'index': change.Index(), 'length': change.DeleteCount() });
          }
        });
      }
      request = {
        target: this.Name(),
        revision: this.doc.Revision(),
        tab_width: 4,
        tab_as_space: true,
        visible: visibleChanges,
      };
    }
    return request;
  }

  HandleSavedResponse(response) {
    this.doc = new Doc(this.channel.AllocatedID, response.name, response.revision, this.editor_);
  }

  Name() {
    return this.doc === null ? null : this.doc.Name();
  }

  Read(file) {
    this.editor_.SetText(file.visible_code);
    this.doc = new Doc(this.channel.AllocatedID, file.name, file.revision, this.editor_);
  }
}
