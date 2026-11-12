# Character models (optional)

Place rigged `.glb` files here. Missing files fall back to a simple procedural person.

| File | Used for |
|---|---|
| shopper.glb | the player (push-trolley pose optional) |
| npc0.glb, npc1.glb, npc2.glb | walking shoppers |
| greeter.glb | entrance greeter (wave clip) |
| cashier.glb | cashier |

Animation clip names should contain `idle` and `walk` (case-insensitive).

Mixamo workflow: upload/pick a character, download FBX (with skin) plus Walking and Idle (without skin), then in Blender import all, rename actions to "walk" and "idle", and export as glTF Binary (.glb). Optimise with `npx gltfjsx model.glb --transform` (Draco + resized textures).
