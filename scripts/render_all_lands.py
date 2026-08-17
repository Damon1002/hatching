import bpy
import mathutils
import os

def render_land(grid_size=4, output_filename="blender-cube-land-2d.png"):
    bpy.ops.wm.read_factory_settings(use_empty=True)

    glb_path = os.path.abspath('assets/models/cube-land.glb')
    output_path = os.path.abspath(os.path.join('assets/tiles', output_filename))
    atlas_img_path = os.path.abspath('assets/tiles/top-atlas.png')

    print(f"==========================================")
    print(f"Rendering {grid_size}x{grid_size} Land -> {output_filename}")
    print(f"==========================================")

    # 1. Import base GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)

    # 2. Update 'IsoLand Atlas' material texture with the 4-border dotted atlas
    atlas_mat = bpy.data.materials.get("IsoLand Atlas")
    if atlas_mat and atlas_mat.node_tree:
        for node in atlas_mat.node_tree.nodes:
            if node.type == 'TEX_IMAGE':
                new_img = bpy.data.images.load(atlas_img_path, check_existing=False)
                node.image = new_img
                print(f"Updated texture on IsoLand Atlas to: {atlas_img_path}")

    origin = mathutils.Vector((-2.361, -3.557, -1.143))
    step = 1.700

    if grid_size != 4:
        # Collect template blocks from the 16 original meshes
        templates = {}
        for obj in list(bpy.data.objects):
            if obj.type == 'MESH' and obj.name.startswith('IsoLand_'):
                parts = obj.name.replace('IsoLand_', '').split('_')
                gx, gy = int(parts[0]), int(parts[1])
                templates[(gx, gy)] = obj

        # Build NxN grid mapping corners, edges, and interior
        for x in range(grid_size):
            for y in range(grid_size):
                # Map to corresponding template
                tx = 0 if x == 0 else (3 if x == grid_size - 1 else 1)
                ty = 0 if y == 0 else (3 if y == grid_size - 1 else 1)

                template_obj = templates[(tx, ty)]
                new_obj = template_obj.copy()
                new_obj.data = template_obj.data.copy()
                new_obj.location = origin + mathutils.Vector((x * step, y * step, 0))
                bpy.context.scene.collection.objects.link(new_obj)

        # Delete original templates
        for obj in templates.values():
            bpy.data.objects.remove(obj, do_unlink=True)

    bpy.context.view_layer.update()

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

    print(f"Bounding Center: {center}, Size: {size}, MaxDim: {max_dim}")

    # Orthographic Camera with generous scale for complete 4-corner framing
    cam_data = bpy.data.cameras.new("IsoCamera")
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = max_dim * 2.35
    cam_data.clip_start = 0.1
    cam_data.clip_end = 200.0

    cam_obj = bpy.data.objects.new("IsoCamera", cam_data)
    dist = 40.0
    cam_obj.location = center + mathutils.Vector((dist, -dist, dist * 0.816))
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    cam_dir = (center - cam_obj.location).normalized()
    cam_obj.rotation_euler = cam_dir.to_track_quat('-Z', 'Y').to_euler()

    # Studio Sun Light
    sun_data = bpy.data.lights.new(name="SunKey", type='SUN')
    sun_data.energy = 6.0
    sun_data.color = (1.0, 0.98, 0.92)
    sun_obj = bpy.data.objects.new(name="SunKey", object_data=sun_data)
    sun_obj.location = center + mathutils.Vector((20.0, -15.0, 35.0))
    sun_dir = (center - sun_obj.location).normalized()
    sun_obj.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(sun_obj)

    fill_data = bpy.data.lights.new(name="SkyFill", type='SUN')
    fill_data.energy = 3.0
    fill_data.color = (0.85, 0.95, 0.90)
    fill_obj = bpy.data.objects.new(name="SkyFill", object_data=fill_data)
    fill_obj.location = center + mathutils.Vector((-25.0, 20.0, 25.0))
    fill_dir = (center - fill_obj.location).normalized()
    fill_obj.rotation_euler = fill_dir.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.collection.objects.link(fill_obj)

    bpy.context.view_layer.update()

    # Cycles Renderer
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 48
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.filepath = output_path

    bpy.ops.render.render(write_still=True)
    print(f"Completed render: {output_path}")

render_land(grid_size=4, output_filename="blender-cube-land-2d.png")
render_land(grid_size=5, output_filename="blender-land-25-grid.png")
