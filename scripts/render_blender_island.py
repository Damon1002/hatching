import bpy
import mathutils
import os
import math

bpy.ops.wm.read_factory_settings(use_empty=True)

glb_path = os.path.abspath('assets/models/cube-land.glb')
output_path = os.path.abspath('assets/tiles/blender-cube-land-2d.png')

print(f"Importing GLB: {glb_path}")
bpy.ops.import_scene.gltf(filepath=glb_path)

mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH']
print(f"Loaded {len(mesh_objs)} mesh objects")

min_c = mathutils.Vector((float('inf'), float('inf'), float('inf')))
max_c = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))

for obj in mesh_objs:
    for v in obj.bound_box:
        w_v = obj.matrix_world @ mathutils.Vector(v)
        min_c.x = min(min_c.x, w_v.x)
        min_c.y = min(min_c.y, w_v.y)
        min_c.z = min(min_c.z, w_v.z)
        max_c.x = max(max_c.x, w_v.x)
        max_c.y = max(max_c.y, w_v.y)
        max_c.z = max(max_c.z, w_v.z)

center = (min_c + max_c) / 2.0
size = max_c - min_c
max_dim = max(size.x, size.y, size.z)

print(f"Center: {center}, Size: {size}, MaxDim: {max_dim}")

# Orthographic Camera
cam_data = bpy.data.cameras.new("IsoCamera")
cam_data.type = 'ORTHO'
cam_data.ortho_scale = max_dim * 1.45
cam_data.clip_start = 0.1
cam_data.clip_end = 200.0

cam_obj = bpy.data.objects.new("IsoCamera", cam_data)
# Place camera in classic isometric offset
cam_obj.location = center + mathutils.Vector((25.0, -25.0, 22.0))
bpy.context.scene.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# Explicit rotation to look at center
cam_dir = (center - cam_obj.location).normalized()
rot_quat = cam_dir.to_track_quat('-Z', 'Y')
cam_obj.rotation_euler = rot_quat.to_euler()

# Sun Light
sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
sun_data.energy = 6.0
sun_data.color = (1.0, 0.98, 0.92)
sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
sun_obj.location = center + mathutils.Vector((15.0, -10.0, 30.0))
sun_dir = (center - sun_obj.location).normalized()
sun_obj.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.collection.objects.link(sun_obj)

# Fill Light
fill_data = bpy.data.lights.new(name="SkyFill", type='SUN')
fill_data.energy = 3.0
fill_data.color = (0.85, 0.95, 0.90)
fill_obj = bpy.data.objects.new(name="SkyFill", object_data=fill_data)
fill_obj.location = center + mathutils.Vector((-20.0, 15.0, 20.0))
fill_dir = (center - fill_obj.location).normalized()
fill_obj.rotation_euler = fill_dir.to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.collection.objects.link(fill_obj)

bpy.context.view_layer.update()

# Cycles Renderer
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.filepath = output_path

print("Rendering with Cycles...")
bpy.ops.render.render(write_still=True)
print(f"Cycles render completed: {output_path}")
