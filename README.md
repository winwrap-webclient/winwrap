Editor - Client-implemented interface
  accept and generate edit
  generates autocompletion requests


transport


deal with how message move in the javascript
  blackboxed

create a factory for implementing different channels


repos
  transport - transporting messaging objects using a configuration
  editor - accept and generate change, autocomplete (Monaco example)
  ui - interaction components
  winwrap -



jupyter






flow
  instantiate each window
  setup channels for each window
    pass url and tokens to channel factory
  setup event listeners for each window
  send ?attach message for each window
