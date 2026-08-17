import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('assets/models/cube-land.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH']

for obj in sorted(mesh_objs, key=lambda o: o.name):
    mat_names = [slot.material.name if slot.material else 'None' for slot in obj.material_slots]
    print(f"Object: {obj.name}, Mats: {mat_names}")
    # Inspect vertices/geometry
    print(f"  Vertices count: {len(obj.data.vertices)}, Polygons count: {len(obj.data.polygons)}")
