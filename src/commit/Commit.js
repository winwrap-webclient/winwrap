import Changes from './Changes';

export default class Commit {
  constructor() {
    this.changes = new Changes();
    this.revert_changes = new Changes();
  }

  AnyChanges() {
    return this.changes.AnyChanges();
  }

  AppendChange(nextchange) {
    this.changes.Append(nextchange);
  }

  Changes() {
    return this.changes;
  }

  PrependRevertChange(priorchange) {
    this.revert_changes.Prepend(priorchange);
  }

  RevertChanges() {
    return this.revert_changes;
  }

  TakeChanges(need_commit) {
    let commit = null;
    if (this.AnyChanges() || need_commit) {
      commit = new Commit();
      commit.changes = this.changes;
      this.changes = new Changes();
      commit.revert_changes = this.revert_changes;
      this.revert_changes = new Changes();
    }

    return commit;
  }
  Log(title) {
    console.log(title);
    console.log(this);
  }
}
