export default class Changes {
  constructor(changes = []) {
    this.changes = [...changes];
  }

  AnyChanges() {
    return this.changes.length !== 0;
  }

  Append(nextchange) {
    if (Array.isArray(nextchange)) {
      nextchange.forEach(change => this.Append(change));
    } else if (this.changes.length === 0 || !this.changes[this.changes.length - 1].Combine(nextchange)) {
      // don't overlap (successfully combined)
      this.changes.push(nextchange);
    }
  }

  AppendNoCombine(nextchange) {
    if (Array.isArray(nextchange)) {
      this.changes = this.changes.concat(nextchange);
    } else {
      this.changes.push(nextchange);
    }
  }

  Changes() {
    return this.changes;
  }

  Equals(changes) {
    if (this.changes.length !== changes.changes.length) {
      return false;
    }

    for (let i = 0; i < this.changes.length; ++i) {
      if (!this.changes[i].Equals(changes.changes[i])) {
        return false;
      }
    }

    return true;
  }

  MergeTransform(serverChanges) {
    let mergedChanges = new Changes(this.changes);
    // apply server Commit to create new Changes
    serverChanges.Changes().forEach(function (serverChange) {
      // apply each server Change to create a new merged changes
      const transformedChanges = new Changes();
      mergedChanges.Changes().forEach(change => {
        transformedChanges.AppendNoCombine(change.MergeTransform(serverChange));
      });

      mergedChanges = transformedChanges;
    });
    return mergedChanges;
  }

  Prepend(priorchange) {
    if (Array.isArray(priorchange)) {
      priorchange.forEach(change => this.Prepend(change));
    } else if (this.changes.length === 0) {
      this.changes.unshift(priorchange);
    } else {
      const change = priorchange.Copy();
      if (change.Combine(this.changes[0])) {
        this.changes[0] = change;
      } else {
        this.changes.unshift(priorchange);
      }
    }
  }
}
