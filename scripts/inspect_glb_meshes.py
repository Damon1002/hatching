import bpy
import mathutils
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('assets/models/cube-land.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH']
print(f"Total meshes: {len(mesh_objs)}")

for i, obj in enumerate(mesh_objs):
    loc = obj.matrix_world.translation
    print(f"Mesh {obj.name}: loc = ({loc.x:.3f}, {loc.y:.3f}, {loc.z:.3f})")
