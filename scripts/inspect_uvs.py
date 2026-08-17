import bpy
import os

bpy.ops.wm.read_factory_settings(use_empty=True)
glb_path = os.path.abspath('assets/models/cube-land.glb')
bpy.ops.import_scene.gltf(filepath=glb_path)

for x in range(4):
    for y in range(4):
        obj = bpy.data.objects.get(f"IsoLand_{x}_{y}")
        if not obj: continue
        mesh = obj.data
        uv_layer = mesh.uv_layers.active.data
        
        # Find top polygon (normal.z > 0.9)
        top_poly = None
        for poly in mesh.polygons:
            if poly.normal.z > 0.8:
                top_poly = poly
                break
        
        if top_poly:
            uvs = [uv_layer[loop_idx].uv for loop_idx in top_poly.loop_indices]
            uv_min = (min(u.x for u in uvs), min(u.y for u in uvs))
            uv_max = (max(u.x for u in uvs), max(u.y for u in uvs))
            print(f"IsoLand_{x}_{y} (tx={x}, ty={y}): Top UV box = ({uv_min[0]:.3f}, {uv_min[1]:.3f}) to ({uv_max[0]:.3f}, {uv_max[1]:.3f})")
