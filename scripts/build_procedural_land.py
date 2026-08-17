import bpy
import mathutils
import os

def generate_procedural_land(grid_size=5, output_filename="blender-land-25-grid.png"):
    bpy.ops.wm.read_factory_settings(use_empty=True)

    glb_path = os.path.abspath('assets/models/cube-land.glb')
    output_path = os.path.abspath(os.path.join('assets/tiles', output_filename))

    print(f"==========================================")
    print(f"Building {grid_size}x{grid_size} Land with 4-border dotted lines -> {output_filename}")
    print(f"==========================================")

    # 1. Import base GLB to get original materials and cube template
    bpy.ops.import_scene.gltf(filepath=glb_path)

    mat_atlas = bpy.data.materials.get("IsoLand Atlas")
    mat_mud = bpy.data.materials.get("IsoLand Mud")
    mat_wall = bpy.data.materials.get("IsoLand Wall")

    template_obj = bpy.data.objects.get("IsoLand_0_0")
    orig_mesh = template_obj.data

    # Remove all imported objects
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)

    origin = mathutils.Vector((-2.361, -3.557, -1.143))
    step = 1.700

    # Build NxN grid with exact UV mapping
    for x in range(grid_size):
        for y in range(grid_size):
            mesh_name = f"IsoCube_{x}_{y}"
            new_mesh = orig_mesh.copy()
            new_obj = bpy.data.objects.new(mesh_name, new_mesh)

            new_obj.data.materials.clear()
            new_obj.data.materials.append(mat_atlas)  # Slot 0: Top Atlas
            new_obj.data.materials.append(mat_mud)    # Slot 1: Mud Bottom
            new_obj.data.materials.append(mat_wall)   # Slot 2: Wall Bricks

            new_obj.location = origin + mathutils.Vector((x * step, y * step, 0))
            bpy.context.scene.collection.objects.link(new_obj)

            uv_layer = new_mesh.uv_layers.active.data
            
            # Exact NxN texture atlas slicing
            # Top-left, top-right, bottom-left, bottom-right all get outer dotted stitches
            u_min = x / grid_size
            u_max = (x + 1) / grid_size
            v_min = y / grid_size
            v_max = (y + 1) / grid_size

            for poly in new_mesh.polygons:
                if poly.normal.z > 0.8:
                    poly.material_index = 0
                    
                    loop_uv_map = []
                    for loop_idx in poly.loop_indices:
                        vert_idx = new_mesh.loops[loop_idx].vertex_index
                        v_pos = new_mesh.vertices[vert_idx].co
                        loop_uv_map.append((loop_idx, v_pos.x, v_pos.y))
                    
                    min_vx = min(p[1] for p in loop_uv_map)
                    max_vx = max(p[1] for p in loop_uv_map)
                    min_vy = min(p[2] for p in loop_uv_map)
                    max_vy = max(p[2] for p in loop_uv_map)
                    
                    for loop_idx, vx, vy in loop_uv_map:
                        norm_u = (vx - min_vx) / max(1e-5, max_vx - min_vx)
                        norm_v = (vy - min_vy) / max(1e-5, max_vy - min_vy)
                        
                        target_u = u_min + norm_u * (u_max - u_min)
                        target_v = v_min + norm_v * (v_max - v_min)
                        uv_layer[loop_idx].uv = mathutils.Vector((target_u, target_v))

                elif poly.normal.z < -0.8:
                    poly.material_index = 1
                else:
                    is_outer_wall = (
                        (poly.normal.x < -0.8 and x == 0) or
                        (poly.normal.x > 0.8 and x == grid_size - 1) or
                        (poly.normal.y < -0.8 and y == 0) or
                        (poly.normal.y > 0.8 and y == grid_size - 1)
                    )
                    if is_outer_wall:
                        poly.material_index = 2
                    else:
                        poly.material_index = 1

    # Force dependency graph update so world transforms are computed
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

    # Orthographic Camera
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

    # Studio Lighting
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
    print(f"Rendered: {output_path}")

generate_procedural_land(grid_size=4, output_filename="blender-cube-land-2d.png")
generate_procedural_land(grid_size=5, output_filename="blender-land-25-grid.png")
