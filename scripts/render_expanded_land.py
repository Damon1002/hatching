import bpy
import mathutils
import os
import sys

def render_grid(grid_size=5, output_filename="blender-land-25-grid.png"):
    bpy.ops.wm.read_factory_settings(use_empty=True)

    glb_path = os.path.abspath('assets/models/cube-land.glb')
    output_path = os.path.abspath(os.path.join('assets/tiles', output_filename))

    print(f"--- Generating {grid_size}x{grid_size} ({grid_size*grid_size} cubes) ---")
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # Collect source template cubes
    # We use IsoLand_1_1 (interior cube), IsoLand_0_1 (edge), etc.
    source_cubes = {}
    for obj in list(bpy.data.objects):
        if obj.type == 'MESH' and obj.name.startswith('IsoLand_'):
            parts = obj.name.replace('IsoLand_', '').split('_')
            gx, gy = int(parts[0]), int(parts[1])
            source_cubes[(gx, gy)] = obj

    # Reference origin and step
    origin = mathutils.Vector((-2.361, -3.557, -1.143))
    step = 1.700

    # If grid_size != 4, we build the NxN grid
    if grid_size != 4:
        # Remove original 4x4 meshes
        for obj in list(bpy.data.objects):
            if obj.type == 'MESH':
                bpy.data.objects.remove(obj, do_unlink=True)

        # Re-import cleanly
        bpy.ops.import_scene.gltf(filepath=glb_path)
        templates = {}
        for obj in list(bpy.data.objects):
            if obj.type == 'MESH' and obj.name.startswith('IsoLand_'):
                parts = obj.name.replace('IsoLand_', '').split('_')
                gx, gy = int(parts[0]), int(parts[1])
                templates[(gx, gy)] = obj

        # Create NxN grid using appropriate templates (corners, edges, interior)
        created_objects = []
        for x in range(grid_size):
            for y in range(grid_size):
                # Map to appropriate template
                # gx template: 0 for min, 3 for max, 1 for interior
                # gy template: 0 for min, 3 for max, 1 for interior
                tx = 0 if x == 0 else (3 if x == grid_size - 1 else 1)
                ty = 0 if y == 0 else (3 if y == grid_size - 1 else 1)

                template_obj = templates[(tx, ty)]
                new_obj = template_obj.copy()
                new_obj.data = template_obj.data.copy()
                new_loc = origin + mathutils.Vector((x * step, y * step, 0))
                new_obj.location = new_loc
                bpy.context.scene.collection.objects.link(new_obj)
                created_objects.append(new_obj)

        # Delete original templates
        for obj in templates.values():
            bpy.data.objects.remove(obj, do_unlink=True)

    # Compute bounding box
    mesh_objs = [obj for obj in bpy.data.objects if obj.type == 'MESH']
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

    # Orthographic Camera
    cam_data = bpy.data.cameras.new("IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = max_dim * 1.45
    cam_data.clip_start = 0.1
    cam_data.clip_end = 200.0

    cam_obj = bpy.data.objects.new("IsoCamera", cam_data)
    cam_obj.location = center + mathutils.Vector((25.0, -25.0, 22.0))
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    cam_dir = (center - cam_obj.location).normalized()
    cam_obj.rotation_euler = cam_dir.to_track_quat('-Z', 'Y').to_euler()

    # Studio Sun Light
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

    print(f"Rendering {grid_size}x{grid_size} to {output_path}...")
    bpy.ops.render.render(write_still=True)
    print(f"Saved: {output_path}")

# Render 5x5 (25 cubes)
render_grid(grid_size=5, output_filename="blender-land-25-grid.png")
