"""SHRED processing line — procedural Blender model.
Builds a twin-shaft shredder line as named parts, exports GLB for the web
and (optionally) Cycles stills.  Run:  python3 build_line.py <outdir> [render]
"""
import sys, math, os
import bpy, bmesh
from mathutils import Matrix, Vector

OUT = sys.argv[1]
RENDER = len(sys.argv) > 2 and sys.argv[2] == "render"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

# ---------------------------------------------------------------- materials
def mat(name, rgb, metallic, rough, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 1.0
    return m

M = {
    "body":   mat("body",   (0.045, 0.05, 0.055), 0.75, 0.42),
    "panel":  mat("panel",  (0.42, 0.44, 0.46),   0.85, 0.38),
    "steel":  mat("steel",  (0.62, 0.64, 0.66),   1.0,  0.24),
    "dark":   mat("dark",   (0.12, 0.125, 0.13),  1.0,  0.5),
    "accent": mat("accent", (0.0, 0.84, 0.0),     0.1,  0.42),
    "rubber": mat("rubber", (0.012, 0.012, 0.014), 0.0, 0.85),
    "motor":  mat("motor",  (0.2, 0.21, 0.22),    0.7,  0.5),
}

# ---------------------------------------------------------------- helpers
def RX(a): return Matrix.Rotation(a, 4, 'X')
def RY(a): return Matrix.Rotation(a, 4, 'Y')
def RZ(a): return Matrix.Rotation(a, 4, 'Z')
def T(x, y, z): return Matrix.Translation((x, y, z))

def finish(bm, angle=math.radians(32)):
    """smooth faces, mark hard edges sharp"""
    bm.normal_update()
    for f in bm.faces:
        f.smooth = True
    for e in bm.edges:
        if len(e.link_faces) == 2:
            e.smooth = e.calc_face_angle(0) < angle
        else:
            e.smooth = False

class Part:
    def __init__(self, name, parent=None):
        self.name = name
        self.empty = bpy.data.objects.new(name, None)
        col.objects.link(self.empty)
        if parent:
            self.empty.parent = parent
        self.bms = {}

    def add(self, bm, material, mtx=None):
        if mtx is not None:
            bm.transform(mtx)
        finish(bm)
        tmp = bpy.data.meshes.new("tmp")
        bm.to_mesh(tmp)
        bm.free()
        dst = self.bms.setdefault(material, bmesh.new())
        dst.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)

    def box(self, size, loc=(0, 0, 0), material="body", rot=None, bevel=0.012, mtx=None):
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bm.transform(Matrix.Diagonal((*size, 1)))
        if bevel and min(size) > bevel * 2.5:
            bmesh.ops.bevel(bm, geom=bm.edges[:], offset=bevel, segments=2,
                            affect='EDGES', profile=0.5)
        m = T(*loc)
        if rot is not None:
            m = m @ rot
        if mtx is not None:
            m = mtx @ m
        self.add(bm, material, m)

    def cyl(self, r, depth, loc=(0, 0, 0), axis='Z', material="body", seg=28,
            r2=None, bevel=0.0, mtx=None):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r,
                              radius2=r if r2 is None else r2, depth=depth)
        if bevel:
            rim = [e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-6]
            bmesh.ops.bevel(bm, geom=rim, offset=bevel, segments=2, affect='EDGES', profile=0.5)
        rot = {'Z': Matrix.Identity(4), 'X': RY(math.pi / 2), 'Y': RX(-math.pi / 2)}[axis]
        m = T(*loc) @ rot
        if mtx is not None:
            m = mtx @ m
        self.add(bm, material, m)

    def tube(self, p0, p1, r=0.022, material="accent", seg=10):
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=d.length)
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        self.add(bm, material, T(*((p0 + p1) / 2)) @ q.to_matrix().to_4x4())

    def beam(self, p0, p1, w=0.1, h=0.1, material="body", bevel=0.01):
        """box section between two points"""
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        q = Vector((0, 0, 1)).rotation_difference(d.normalized())
        self.box((w, h, d.length), material=material, bevel=bevel,
                 mtx=T(*((p0 + p1) / 2)) @ q.to_matrix().to_4x4())

    def build(self):
        objs = []
        for mname, bm in self.bms.items():
            me = bpy.data.meshes.new(f"{self.name}_{mname}")
            bm.to_mesh(me)
            bm.free()
            me.materials.append(M[mname])
            ob = bpy.data.objects.new(f"{self.name}_{mname}", me)
            ob.parent = self.empty
            col.objects.link(ob)
            objs.append(ob)
        return objs

root = bpy.data.objects.new("Line", None)
col.objects.link(root)

# ================================================================ FRAME + PLATFORM
frame = Part("P_frame", root)
LX, LY, TOP = 1.06, 0.72, 1.6
for sx in (-1, 1):
    for sy in (-1, 1):
        frame.box((0.14, 0.14, TOP), (sx * LX, sy * LY, TOP / 2), bevel=0.014)
        frame.box((0.3, 0.3, 0.025), (sx * LX, sy * LY, 0.0125), "dark", bevel=0.006)
    # side braces in the X-end planes (conveyor passes through the Y faces)
    frame.beam((sx * LX, -LY, 0.45), (sx * LX, LY, 0.45), 0.09, 0.09)
    frame.beam((sx * LX, -LY, 0.5), (sx * LX, 0, 1.5), 0.07, 0.07)
    frame.beam((sx * LX, LY, 0.5), (sx * LX, 0, 1.5), 0.07, 0.07)
for sy in (-1, 1):
    frame.beam((-LX, sy * LY, TOP - 0.09), (LX, sy * LY, TOP - 0.09), 0.14, 0.18)
for sx in (-1, 1):
    frame.beam((sx * LX, -LY, TOP - 0.09), (sx * LX, LY, TOP - 0.09), 0.18, 0.14)

# service platform on the -X side
PZ, PX0, PX1, PY = 1.42, -2.25, -1.2, 1.15
frame.beam((PX0, -PY, PZ), (PX0, PY, PZ), 0.08, 0.12)
frame.beam((PX1, -PY, PZ), (PX1, PY, PZ), 0.08, 0.12)
for y in (-PY, 0, PY):
    frame.beam((PX0, y, PZ), (PX1, y, PZ), 0.12, 0.08)
n = 26
for i in range(n):  # grating bars
    y = -PY + 0.06 + i * (2 * PY - 0.12) / (n - 1)
    frame.box((PX1 - PX0 - 0.1, 0.025, 0.03), ((PX0 + PX1) / 2, y, PZ + 0.07), "dark", bevel=0)
for y in (-PY, PY):
    frame.box((0.1, 0.1, PZ), (PX0, y, PZ / 2), bevel=0.01)
    frame.box((0.24, 0.24, 0.02), (PX0, y, 0.01), "dark", bevel=0.005)
    frame.beam((PX0, y, 0.3), (PX1 + 0.1, y, 1.3), 0.06, 0.06)
# handrail (outer edge + far end)
HR = 1.1
posts = [(PX0, -PY), (PX0, -PY / 3), (PX0, PY / 3), (PX0, PY), (PX1 - 0.02, PY)]
for (x, y) in posts:
    frame.tube((x, y, PZ + 0.06), (x, y, PZ + HR), 0.024)
for h in (HR, HR * 0.55):
    frame.tube((PX0, -PY, PZ + h), (PX0, PY, PZ + h), 0.024)
    frame.tube((PX0, PY, PZ + h), (PX1 - 0.02, PY, PZ + h), 0.024)
frame.box((0.012, 2 * PY, 0.12), (PX0, 0, PZ + 0.14), "accent", bevel=0)  # kick plate
# stairs off the -Y end
SN, rise, run = 6, PZ / 7, 0.27
sx0, sx1 = PX0 + 0.08, PX1 - 0.15
for i in range(SN):
    z = PZ - (i + 1) * rise
    y = -PY - (i + 0.5) * run
    frame.box((sx1 - sx0, run * 0.9, 0.03), ((sx0 + sx1) / 2, y, z), "dark", bevel=0.005)
top = Vector((0, -PY, PZ)); bot = Vector((0, -PY - SN * run - 0.1, 0.05))
for x in (sx0, sx1):
    frame.beam((x, top.y, top.z - 0.05), (x, bot.y, bot.z), 0.04, 0.16)
    frame.tube((x, top.y, top.z + HR), (x, bot.y + 0.1, bot.z + HR - 0.05), 0.024)
    frame.tube((x, top.y, top.z + HR * 0.55), (x, bot.y + 0.1, bot.z + HR * 0.55 - 0.05), 0.024)
    frame.tube((x, bot.y + 0.1, bot.z), (x, bot.y + 0.1, bot.z + HR - 0.05), 0.024)
    frame.tube((x, top.y, top.z + 0.06), (x, top.y, top.z + HR), 0.024)
# control cabinet
frame.box((0.5, 0.28, 0.9), (PX0 + 0.3, PY + 0.32, 0.95), "panel", bevel=0.015)
frame.box((0.12, 0.12, 0.5), (PX0 + 0.3, PY + 0.32, 0.25))
frame.box((0.34, 0.01, 0.12), (PX0 + 0.3, PY + 0.465, 1.2), "accent", bevel=0)
frame.box((0.3, 0.3, 0.02), (PX0 + 0.3, PY + 0.32, 0.01), "dark", bevel=0.005)
frame.build()

# ================================================================ CUTTING CHAMBER
ch = Part("P_chamber", root)
CX, CY, CZ0, CZ1 = 2.0, 1.3, 1.6, 2.2
cz = (CZ0 + CZ1) / 2
WT = 0.07
for sy in (-1, 1):
    ch.box((CX + 0.12, WT, CZ1 - CZ0), (0, sy * (CY / 2), cz), bevel=0.012)
    for x in (-0.66, 0, 0.66):  # external ribs
        ch.box((0.05, 0.06, CZ1 - CZ0 - 0.08), (x, sy * (CY / 2 + 0.06), cz), bevel=0.008)
    # comb / cleaner fingers inside
    for i in range(13):
        x = -0.84 + i * 0.14
        ch.box((0.05, 0.2, 0.3), (x, sy * (CY / 2 - 0.13), cz - 0.02), "dark", bevel=0.006)
for sx in (-1, 1):
    ch.box((WT, CY + WT, CZ1 - CZ0), (sx * (CX / 2 + 0.025), 0, cz), bevel=0.012)
# top & bottom flanges
for z in (CZ0 + 0.02, CZ1 - 0.02):
    for sy in (-1, 1):
        ch.box((CX + 0.3, 0.1, 0.04), (0, sy * (CY / 2 + 0.05), z), "dark", bevel=0.006)
    for sx in (-1, 1):
        ch.box((0.1, CY + 0.2, 0.04), (sx * (CX / 2 + 0.08), 0, z), "dark", bevel=0.006)
# bearing housing, -X end
ch.box((0.2, CY - 0.1, 0.5), (-CX / 2 - 0.16, 0, cz), "motor", bevel=0.02)
for sy in (-1, 1):
    ch.cyl(0.17, 0.1, (-CX / 2 - 0.3, sy * 0.26, 1.9), 'X', "steel", seg=32, bevel=0.012)
    ch.cyl(0.07, 0.14, (-CX / 2 - 0.32, sy * 0.26, 1.9), 'X', "dark", seg=6)
# discharge chute beneath
def frustum(part, a0, b0, z0, a1, b1, z1, t, material):
    bm = bmesh.new()
    def ring(a, b, z):
        return [bm.verts.new((sx * a / 2, sy * b / 2, z)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    o0, o1 = ring(a0, b0, z0), ring(a1, b1, z1)
    i0, i1 = ring(a0 - 2 * t, b0 - 2 * t, z0), ring(a1 - 2 * t, b1 - 2 * t, z1)
    for k in range(4):
        j = (k + 1) % 4
        bm.faces.new((o0[k], o0[j], o1[j], o1[k]))
        bm.faces.new((i0[j], i0[k], i1[k], i1[j]))
        bm.faces.new((o1[k], o1[j], i1[j], i1[k]))
        bm.faces.new((o0[j], o0[k], i0[k], i0[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, material)
frustum(ch, CX - 0.1, CY - 0.05, CZ0, 1.05, 0.95, 1.06, 0.03, "body")
ch.build()

# ================================================================ SHAFTS + CUTTERS
def cutter_mesh(name, mirror=False):
    bm = bmesh.new()
    N, teeth, th = 96, 3, 0.062
    prof = []
    for i in range(N):
        a = 2 * math.pi * i / N
        f = (i * teeth / N) % 1.0
        r = 0.2 + 0.092 * (f ** 1.7)
        if mirror:
            a = -a
        prof.append((r * math.cos(a), r * math.sin(a)))
    fr = [bm.verts.new((th / 2, y, z)) for (y, z) in prof]
    bk = [bm.verts.new((-th / 2, y, z)) for (y, z) in prof]
    bm.faces.new(fr); bm.faces.new(bk[::-1])
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((fr[i], bk[i], bk[j], fr[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4],
                          quad_method='BEAUTY', ngon_method='BEAUTY')
    finish(bm, math.radians(40))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(M["steel"])
    return me

SHAFT_Y, SHAFT_Z, PITCH = 0.26, 1.9, 0.14
for tag, sy, par in (("A", -1, 0), ("B", 1, 1)):
    sh = Part(f"P_shaft{tag}", root)
    sh.empty.location = (0, sy * SHAFT_Y, SHAFT_Z)
    sh.cyl(0.085, CX + 0.1, (0, 0, 0), 'X', "dark", seg=6)
    cm = cutter_mesh(f"cutter{tag}", mirror=(sy < 0))
    k = 0
    for i in range(13):
        x = -0.84 + i * PITCH
        if i % 2 == par:
            ob = bpy.data.objects.new(f"cut{tag}{i}", cm)
            ob.location = (x, 0, 0)
            ob.rotation_euler = (math.radians(k * 40 * (1 if sy < 0 else -1)), 0, 0)
            ob.parent = sh.empty
            col.objects.link(ob)
            k += 1
        else:
            sh.cyl(0.135, PITCH * 0.98, (x, 0, 0), 'X', "dark", seg=24)
    sh.build()

# ================================================================ DRIVE
dr = Part("P_drive", root)
GX0 = CX / 2 + 0.07
dr.box((0.52, 1.22, 0.78), (GX0 + 0.26, 0, SHAFT_Z), "motor", bevel=0.03)
for y in (-0.42, -0.14, 0.14, 0.42):
    dr.box((0.44, 0.03, 0.84), (GX0 + 0.26, y, SHAFT_Z), "dark", bevel=0.006)
dr.box((0.3, 0.5, 0.05), (GX0 + 0.26, 0, SHAFT_Z + 0.41), "accent", bevel=0.01)
for sy in (-1, 1):
    y = sy * 0.3
    x0 = GX0 + 0.52
    dr.cyl(0.24, 0.07, (x0 + 0.035, y, SHAFT_Z), 'X', "dark", seg=32, bevel=0.01)
    dr.cyl(0.2, 0.62, (x0 + 0.38, y, SHAFT_Z), 'X', "motor", seg=32)
    for i in range(11):
        dr.cyl(0.225, 0.018, (x0 + 0.13 + i * 0.05, y, SHAFT_Z), 'X', "dark", seg=32)
    dr.cyl(0.215, 0.16, (x0 + 0.77, y, SHAFT_Z), 'X', "accent", seg=32, bevel=0.03)
    dr.box((0.2, 0.16, 0.1), (x0 + 0.34, y, SHAFT_Z + 0.25), "dark", bevel=0.012)
# drive cradle
dr.box((1.3, 1.1, 0.08), (GX0 + 0.72, 0, SHAFT_Z - 0.46), "body", bevel=0.012)
for sy in (-1, 1):
    dr.box((0.1, 0.1, SHAFT_Z - 0.5), (GX0 + 1.25, sy * 0.48, (SHAFT_Z - 0.5) / 2), bevel=0.01)
    dr.box((0.24, 0.24, 0.02), (GX0 + 1.25, sy * 0.48, 0.01), "dark", bevel=0.005)
    dr.beam((GX0 + 1.25, sy * 0.48, 0.5), (LX + 0.05, sy * 0.48, 1.3), 0.06, 0.06)
dr.beam((GX0 + 1.25, -0.48, 0.5), (GX0 + 1.25, 0.48, 0.5), 0.07, 0.07)
dr.build()

# ================================================================ HOPPER
hp = Part("P_hopper", root)
HZ0, HZ1, HA, HB = CZ1, 3.3, 3.0, 2.5
frustum(hp, CX + 0.1, CY + 0.1, HZ0, HA, HB, HZ1, 0.035, "panel")
def band(part, t, w, material, hh=0.09):
    a = (CX + 0.1) + (HA - CX - 0.1) * t + 0.04
    b = (CY + 0.1) + (HB - CY - 0.1) * t + 0.04
    z = HZ0 + (HZ1 - HZ0) * t
    for sy in (-1, 1):
        part.box((a + w, w, hh), (0, sy * b / 2, z), material, bevel=0.012)
    for sx in (-1, 1):
        part.box((w, b + w, hh), (sx * a / 2, 0, z), material, bevel=0.012)
band(hp, 1.0, 0.09, "body", 0.1)
band(hp, 0.5, 0.06, "body", 0.07)
band(hp, 0.0, 0.1, "dark", 0.05)
# sloped corner ribs
for sx in (-1, 1):
    for sy in (-1, 1):
        hp.beam((sx * (CX + 0.1) / 2, sy * (CY + 0.1) / 2, HZ0), (sx * HA / 2, sy * HB / 2, HZ1), 0.07, 0.07)
hp.box((0.9, 0.012, 0.16), (0, -HB / 2 * 0.86 - 0.05, HZ0 + (HZ1 - HZ0) * 0.74), "accent",
       rot=RX(-math.atan2((HB - CY - 0.1) / 2, HZ1 - HZ0)), bevel=0)
hp.build()

# ================================================================ CONVEYORS
def conveyor(part, tail, head, width=1.1, cleats=True, guards=True):
    tail, head = Vector(tail), Vector(head)
    d = head - tail
    L = d.length
    ang = math.atan2(d.z, d.y)
    Mx = T(*((tail + head) / 2)) @ RX(ang)
    rail_h = 0.3
    for sx in (-1, 1):
        part.box((0.06, L, rail_h), (sx * (width / 2 + 0.04), 0, 0), "body", bevel=0.012, mtx=Mx)
        part.box((0.1, L, 0.05), (sx * (width / 2 + 0.06), 0, rail_h / 2), "dark", bevel=0.008, mtx=Mx)
        if guards:
            part.box((0.02, L * 0.42, 0.1), (sx * (width / 2 + 0.03), L * 0.22, rail_h / 2 + 0.08),
                     "accent", bevel=0, mtx=Mx)
    part.box((width, L - 0.1, 0.02), (0, 0, 0.07), "rubber", bevel=0, mtx=Mx)
    part.box((width, L - 0.1, 0.02), (0, 0, -0.1), "rubber", bevel=0, mtx=Mx)
    for y in (-L / 2 + 0.05, L / 2 - 0.05):
        part.cyl(0.095, width + 0.02, (0, y, -0.015), 'X', "steel", seg=24, mtx=Mx)
        for sx in (-1, 1):
            part.box((0.07, 0.2, 0.2), (sx * (width / 2 + 0.1), y, -0.015), "motor", bevel=0.012, mtx=Mx)
    if cleats:
        nC = int(L / 0.45)
        for i in range(nC):
            y = -L / 2 + 0.3 + i * (L - 0.6) / (nC - 1)
            part.box((width - 0.08, 0.03, 0.07), (0, y, 0.11), "rubber", bevel=0, mtx=Mx)
    nI = int(L / 0.6)
    for i in range(nI):  # return idlers
        y = -L / 2 + 0.4 + i * (L - 0.8) / max(1, nI - 1)
        part.cyl(0.035, width + 0.06, (0, y, -0.13), 'X', "dark", seg=12, mtx=Mx)
    return Mx, L, ang

def trestle(part, y, z_top, width=1.1, brace=True):
    w = width / 2 + 0.16
    for sx in (-1, 1):
        part.box((0.09, 0.09, z_top), (sx * w, y, z_top / 2), "body", bevel=0.01)
        part.box((0.22, 0.22, 0.02), (sx * w, y, 0.01), "dark", bevel=0.005)
    part.beam((-w, y, z_top - 0.08), (w, y, z_top - 0.08), 0.09, 0.07)
    if brace and z_top > 1.0:
        part.beam((-w, y, 0.25), (w, y, z_top - 0.3), 0.05, 0.05)
        part.beam((-w, y, 0.3), (w, y, 0.3), 0.06, 0.06)

inf = Part("P_infeed", root)
i_tail, i_head = (0, -6.7, 0.7), (0, -0.85, 3.78)
Mx, L, ang = conveyor(inf, i_tail, i_head)
def zat(tail, head, y): return tail[2] + (y - tail[1]) / (head[1] - tail[1]) * (head[2] - tail[2])
for y in (-5.6, -3.9, -2.3):
    trestle(inf, y, zat(i_tail, i_head, y) - 0.14)
# head drive motor
inf.cyl(0.12, 0.36, (0.86, L / 2 - 0.05, -0.015), 'X', "motor", seg=24, mtx=Mx)
inf.cyl(0.13, 0.08, (1.06, L / 2 - 0.05, -0.015), 'X', "accent", seg=24, bevel=0.02, mtx=Mx)
# feed apron at tail
inf.box((1.5, 0.9, 0.03), (0, -L / 2 + 0.25, 0.3), "panel", rot=RX(math.radians(-18)), bevel=0.008, mtx=Mx)
inf.build()

dis = Part("P_discharge", root)
d_tail, d_head = (0, -0.55, 0.72), (0, 4.45, 2.75)
Mx2, L2, ang2 = conveyor(dis, d_tail, d_head, width=0.9, guards=False)
for y in (2.0, 3.6):
    trestle(dis, y, zat(d_tail, d_head, y) - 0.14, width=0.9)
trestle(dis, -0.35, zat(d_tail, d_head, -0.35) - 0.14, width=0.9, brace=False)
dis.cyl(0.11, 0.32, (0.74, L2 / 2 - 0.05, -0.015), 'X', "motor", seg=24, mtx=Mx2)
dis.cyl(0.12, 0.07, (0.92, L2 / 2 - 0.05, -0.015), 'X', "accent", seg=24, bevel=0.02, mtx=Mx2)
# overband magnet across the discharge belt (ferrous extraction)
my = 2.6; mz = zat(d_tail, d_head, my) + 0.62
dis.box((1.5, 0.55, 0.26), (0, my, mz), "motor", rot=RX(ang2), bevel=0.02)
dis.box((1.56, 0.6, 0.03), (0, my, mz - 0.16), "rubber", rot=RX(ang2), bevel=0)
dis.box((0.3, 0.57, 0.05), (0, my, mz + 0.16), "accent", rot=RX(ang2), bevel=0.01)
for sx in (-1, 1):
    dis.box((0.08, 0.08, mz + 0.2), (sx * 0.86, my, (mz + 0.2) / 2), "body", bevel=0.01)
    dis.box((0.2, 0.2, 0.02), (sx * 0.86, my, 0.01), "dark", bevel=0.005)
dis.beam((-0.86, my, mz + 0.26), (0.86, my, mz + 0.26), 0.08, 0.08)
dis.build()

# ================================================================ COLLECTION BINS
bn = Part("P_bin", root)
def bin_(part, c, a, b, h, material="body"):
    bm = bmesh.new()
    t = 0.04
    def ring(aa, bb, z):
        return [bm.verts.new((c[0] + sx * aa / 2, c[1] + sy * bb / 2, z)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    o0, o1 = ring(a - 0.25, b - 0.25, 0.12), ring(a, b, h)
    i0, i1 = ring(a - 0.25 - 2 * t, b - 0.25 - 2 * t, 0.12 + t), ring(a - 2 * t, b - 2 * t, h)
    for k in range(4):
        j = (k + 1) % 4
        bm.faces.new((o0[k], o0[j], o1[j], o1[k]))
        bm.faces.new((i0[j], i0[k], i1[k], i1[j]))
        bm.faces.new((o1[k], o1[j], i1[j], i1[k]))
    bm.faces.new(o0[::-1]); bm.faces.new(i0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, material)
    for sy in (-1, 1):
        part.box((a + 0.1, 0.08, 0.1), (c[0], c[1] + sy * b / 2, h - 0.05), "dark", bevel=0.012)
    for sx in (-1, 1):
        part.box((0.08, b + 0.1, 0.1), (c[0] + sx * a / 2, c[1], h - 0.05), "dark", bevel=0.012)
        for yy in (-b / 4, b / 4):
            part.box((0.05, 0.07, h - 0.3), (c[0] + sx * (a / 2 - 0.1), c[1] + yy, h / 2 + 0.05), "dark", bevel=0.008)
        part.box((0.1, b * 0.8, 0.12), (c[0] + sx * (a / 2 - 0.35), c[1], 0.06), "dark", bevel=0.01)
    part.box((a * 0.5, 0.012, 0.14), (c[0], c[1] + b / 2 + 0.005, h * 0.55), "accent", bevel=0)
bin_(bn, (0, 5.35, 0), 2.0, 1.9, 1.5)
bin_(bn, (2.05, 2.6, 0), 1.3, 1.5, 1.1)     # ferrous bin under the magnet throw
bn.build()

# ---------------------------------------------------------------- export
os.makedirs(OUT, exist_ok=True)
for o in bpy.data.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "shred-line.glb"), export_format='GLB',
    export_apply=True, export_yup=True, export_normals=True, export_materials='EXPORT',
    export_draco_mesh_compression_enable=False, export_cameras=False, export_lights=False,
)
tris = sum(len(o.data.loop_triangles) or (o.data.calc_loop_triangles() or len(o.data.loop_triangles))
           for o in bpy.data.objects if o.type == 'MESH')
print("TRIS", tris, "GLB", os.path.getsize(os.path.join(OUT, "shred-line.glb")))

# ---------------------------------------------------------------- stills
if RENDER:
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = int(os.environ.get("SAMPLES", "72"))
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 5
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.005, 0.006, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    # floor
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=60)
    me = bpy.data.meshes.new("floor"); bm.to_mesh(me); bm.free()
    fm = mat("floor", (0.012, 0.013, 0.014), 0.0, 0.32)
    me.materials.append(fm); fl = bpy.data.objects.new("floor", me); col.objects.link(fl)

    def area(name, loc, target, size, power, color=(1, 1, 1), sy=None):
        l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.color = color
        l.shape = 'RECTANGLE'; l.size = size; l.size_y = sy or size
        o = bpy.data.objects.new(name, l); col.objects.link(o)
        o.location = loc
        o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        return o
    area("key", (7, -6, 9), (0, 0, 1.5), 7, 2100)
    area("rim", (-8, 7, 6), (0, 0, 2), 5, 2600, (0.82, 0.9, 1.0), 12)
    area("green", (3, 9, 1.2), (0, 2, 1.5), 3, 260, (0.1, 1.0, 0.1))
    area("top", (0, -1, 9), (0, -1, 0), 10, 700, sy=4)

    cam = bpy.data.cameras.new("cam"); co = bpy.data.objects.new("cam", cam); col.objects.link(co)
    scene.camera = co
    def shot(name, loc, target, lens, res=(1920, 1080), fstop=None):
        co.location = loc
        co.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
        cam.lens = lens
        cam.dof.use_dof = fstop is not None
        if fstop:
            cam.dof.focus_distance = (Vector(target) - Vector(loc)).length
            cam.dof.aperture_fstop = fstop
        scene.render.resolution_x, scene.render.resolution_y = res
        scene.render.filepath = os.path.join(OUT, name)
        scene.render.image_settings.file_format = 'PNG'
        bpy.ops.render.render(write_still=True)
        print("RENDERED", name)
    shots = os.environ.get("SHOTS", "line,cutters").split(",")
    if "line" in shots:
        shot("render-line.png", (15.5, -11.5, 6.0), (0, -0.5, 1.4), 50)
    if "cutters" in shots:
        shot("render-cutters.png", (1.5, -1.9, 4.6), (0.05, 0.0, 1.9), 55, fstop=2.8)
    if "poster" in shots:
        shot("render-poster.png", (9.0, -7.0, 3.6), (0.3, 0.2, 1.7), 42, res=(1600, 2000))
