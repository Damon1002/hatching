import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('assets/models/cube-land.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

for img in bpy.data.images:
    print(f"Image name: {img.name}, size: {img.size[0]}x{img.size[1]}")
    save_path = os.path.abspath(f"assets/tiles/{img.name}.png")
    img.save_render(save_path)
    print(f"  Saved texture to {save_path}")
