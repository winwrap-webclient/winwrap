import { isUndefined } from 'lodash';
import Change from './Change';
import ChangeOp from './ChangeOp';
import Commit from './Commit';
import diff from './diff';

export default class Doc {
  constructor(sync_id, name, revision, editor) {
    this.name = name;
    this.revision = revision;
    this.editor = editor;
    // editor object support this methods:
    // applyChange, getText, getSelection and scrollToSelection
    this.need_commit = false;
    this.current_commit = null;
    this.revision_text = this.editor.GetText();
    this.pending_commit = new Commit(sync_id, sync_id);
  }

  AppendPendingChange(op = ChangeOp.EditChangeOp, caret) {
    if (isUndefined(caret)) {
      caret = this.editor.GetSelection().first;
    }

    const commit = this.pending_commit;

    if (op === ChangeOp.EditChangeOp) {
      // calculate change
      const text = this.editor.GetText();
      let change = diff(this.revision_text, text, caret);
      if (change !== null) {
        change = diff(this.revision_text, text, caret);
        commit.AppendChange(change);
        const revertChange = change.RevertChange(this.revision_text);
        commit.PrependRevertChange(revertChange);
        this.revision_text = text;
      }
    } else if (op === ChangeOp.EnterChangeOp) {
      const range = this.editor.GetIndexRangeOfLineAt(caret);
      commit.AppendChange(new Change(op, range.first - 2, 2));
    } else if (op === ChangeOp.FixupChangeOp) {
      const range = this.editor.GetIndexRangeOfLineAt(caret);
      commit.AppendChange(new Change(op, range.first, range.last - range.first));
    }
  }

  ApplyChanges(changes, is_server) {
    this.editor.ApplyChanges(changes, is_server);
  }

  Commit() {
    if (this.current_commit !== null) {
      return null;
    }

    this.AppendPendingChange();
    if (!this.pending_commit.AnyChanges() && !this.need_commit) {
      return null;
    }

    const { need_commit } = this;
    this.need_commit = false;
    this.current_commit = this.pending_commit.TakeChanges(need_commit);
    this.current_commit.Log('Current commit:');
    return this.current_commit;
  }

  CommitDone() {
    if (this.current_commit !== null) {
      this.current_commit.Log('Commit done:');
      this.current_commit = null;
    }
  }

  InCommit(name) {
    return name === this.name && this.current_commit !== null;
  }

  Name() {
    return this.name;
  }

  NeedCommit() {
    this.need_commit = true;
  }

  Rebase(serverChanges) {
    if (serverChanges.AnyChanges()) {
      // make sure all changes have been commited
      this.AppendPendingChange();

      // Rebasing Onto Master(Client - Side) After an operation is transformed and applied server - side,
      // it is broadcasted to the other clients.
      // When a client receives the change, it does the equivalent of a git rebase:
      // 1. Reverts all 'pending' (non - merged) local operations operation from the server
      // 2. Applies remote operation
      // 3. Re-applies pending operations, transforming each operation against the new operation from the server

      // take the pending commits (ApplyChanges below will add them back)
      const pending_commit = this.pending_commit.TakeChanges();

      if (pending_commit) {
        // revert pending commit and selection using the pending commit
        this.ApplyChanges(pending_commit.RevertChanges(), false);
      }

      // rebase text using server commit
      this.ApplyChanges(serverChanges, true);

      // update revision text
      this.revision_text = this.editor.GetText();

      if (pending_commit) {
        // rebase pending commit changes using server commit
        const pending_changes = pending_commit.Changes().MergeTransform(serverChanges);
        // apply rebased pending changes
        this.ApplyChanges(pending_changes, false);
      }
    }
  }

  Revision() {
    return this.revision;
  }

  SetRevision(revision) {
    this.revision = revision;
  }
}
