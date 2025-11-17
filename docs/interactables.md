# Interactables

Interactables are entities in the game that the player can activate to trigger events or scripts. They are defined in `gamedata/interactables.js` and loaded by the game at startup.

## Anatomy of an Interactable

An interactable is a JavaScript object with the following properties:

| Property     | Type    | Description                                                                                             |
|--------------|---------|---------------------------------------------------------------------------------------------------------|
| `id`         | String  | A unique identifier for the interactable.                                                               |
| `name`       | String  | The name of the interactable, which can be displayed in the UI.                                         |
| `char`       | String  | The character used to represent the interactable on the game map.                                       |
| `colour`     | String  | The hexadecimal colour code for the character.                                                          |
| `script`     | String  | The name of the script to execute when the player activates the interactable. Must be a key in `SCRIPT_REGISTRY`. |
| `scriptArgs` | Object  | An object containing arguments to pass to the script.                                                   |

**Note on Solidity:** The `gamedata/interactables.js` currently does not define a `solid` property. Instead, the `SolidComponent` is added imperatively by the `world-builder.js` for specific interactables (e.g., `TEST_BOX`, `DOOR_CLOSED`). For a fully data-driven approach, a `solid` property should be added to the interactable definitions in `gamedata/interactables.js`.

## How to Build an Interactable

To create a new interactable, add a new object to the `INTERACTABLE_DATA` array in `gamedata/interactables.js`.

### Example

```javascript
{
  "id": "TEST_BOX",
  "name": "Crate",
  "char": "X",
  "colour": "#f0f",
  "script": "openMenu",
  "scriptArgs": {
    "title": "Test Menu",
    "options": [
      { "label": "Yes", "action": "close_menu" },
      { "label": "No", "action": "close_menu" },
      { "label": "Exit", "action": "close_menu" }
    ]
  }
}
```

## Stateful Interactables (Doors)

Some interactables, like doors, need to change their state. The recommended way to handle this is to create a separate interactable definition for each state and then swap them out using a menu action.

For example, a door is implemented as two separate interactables: `DOOR_CLOSED` and `DOOR_OPEN`.
- `DOOR_CLOSED` has its `SolidComponent` added by the `world-builder` and its menu has an `open_door` action.
- When `open_door` is triggered, the game replaces the `DOOR_CLOSED` entity with a `DOOR_OPEN` entity at the same location.
- `DOOR_OPEN` does *not* have a `SolidComponent` (meaning it's not solid) and its menu has a `close_door` action, which swaps the entity back.

### Door Example

```javascript
// In gamedata/interactables.js
{
    "id": "DOOR_CLOSED",
    "name": "Door",
    "char": "D",
    "colour": "#f90",
    "script": "openMenu",
    "scriptArgs": {
      "title": "It's a closed door.",
      "options": [
        { "label": "Open", "action": "open_door" },
        { "label": "Cancel", "action": "close_menu" }
      ]
    }
  },
  {
    "id": "DOOR_OPEN",
    "name": "Door",
    "char": "O",
    "colour": "#f90",
    "script": "openMenu",
    "scriptArgs": {
      "title": "It's an open door.",
      "options": [
        { "label": "Close", "action": "close_door" },
        { "label": "Cancel", "action": "close_menu" }
      ]
    }
  }
```

## Available Scripts

The following scripts can be assigned to an interactable's `script` property. These are defined in `game.js` in the `SCRIPT_REGISTRY` object.

### `showMessage`

Adds a `MessageComponent` to the interactable entity, causing a message to be displayed on the screen near the interactable's position for a set duration.

**Arguments:**

| Argument  | Type   | Description                                         |
|-----------|--------|-----------------------------------------------------|
| `message` | String | The text to display.                                |
| `duration`| Number | (Optional) The duration in milliseconds the message will be displayed. Defaults to 3000ms. |

### `openMenu`

Adds a `MenuComponent` to the player entity, causing a menu with a title and a list of options to be displayed.

**Arguments:**

| Argument | Type  | Description                                      |
|----------|-------|--------------------------------------------------|
| `title`  | String| The title of the menu.                           |
| `options`| Array | An array of menu options, each with a `label` and an `action`. |

## Menu Actions

The actions for the menu options are defined in the `MENU_ACTIONS` object in `game.js`. These actions now manipulate `MenuComponent`s on entities rather than a global `Menu` object.

| Action         | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `close_menu`   | Closes the currently open menu by removing its `MenuComponent`.             |
| `open_door`    | Replaces the activated interactable with the 'DOOR_OPEN' entity.            |
| `close_door`   | Replaces the activated interactable with the 'DOOR_CLOSED' entity.          |

