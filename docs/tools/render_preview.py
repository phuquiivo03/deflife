"""Offline reference renderer for docs/PLAN.md (NOT app code).

Implements the plan's draw rules in Python/Pillow so the TypeScript renderer
has pixel targets: python3 docs/tools/render_preview.py
Outputs docs/art/expected_<stage>.png (3x) and docs/art/character_cut/*.png.
"""
import json, os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
A = os.path.join(ROOT, 'public', 'assets')
D = os.path.join(ROOT, 'docs', 'data-draft')
OUT = os.path.join(ROOT, 'docs', 'art')
W, H = 427, 240

KEY = np.array([209, 17, 90])
CHAR_DOWNSCALE = 3.5
POSES = {  # rects in character_sheet.jpg (1280x720): x0, y0, x1, y1
    'front': (66, 194, 196, 492), 'back': (272, 197, 399, 494),
    'left': (471, 200, 602, 494), 'right': (665, 200, 796, 494),
    'sit_back': (858, 228, 1006, 487), 'sit_side': (1071, 236, 1244, 482),
}
SIT_HIP_FROM_BOTTOM = 9


def cut_pose(rect):
    sheet = np.array(Image.open(os.path.join(A, 'character', 'character_sheet.jpg')).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = rect
    c = sheet[y0:y1, x0:x1]
    dist = np.sqrt(((c - KEY) ** 2).sum(2))
    alpha = np.clip((dist - 60) / 80, 0, 1)            # soft key in source space
    # despill: clamp magenta (R and B both above G) towards the max of the others
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    spill = np.minimum(r, b) - g
    edge = (alpha < 1) & (spill > 0)
    c[..., 0] = np.where(edge, np.minimum(r, g + 30), r)
    c[..., 2] = np.where(edge, np.minimum(b, g + 30), b)
    h, w = alpha.shape
    nw, nh = round(w / CHAR_DOWNSCALE), round(h / CHAR_DOWNSCALE)
    prem = Image.fromarray(np.clip(c * alpha[..., None], 0, 255).astype(np.uint8)).resize((nw, nh), Image.BOX)
    al = Image.fromarray((alpha * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)
    al_np = np.array(al).astype(np.float32)
    rgb = np.array(prem).astype(np.float32) / np.maximum(al_np[..., None] / 255, 1e-3)
    hard = (al_np >= 128).astype(np.uint8) * 255      # hard alpha, no semi-transparent pixels
    img = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), hard]), 'RGBA')
    return img.crop(img.getbbox())


def load(name):
    im = Image.open(os.path.join(A, name + '.png')).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 127 else 0).getbbox()
    return im.crop(bb)                                  # == atlas trim


def render(stage, character=True, loadout=None):
    items = json.load(open(os.path.join(D, 'items.json')))
    cat = {i['id']: i for i in items['items']}
    order = {s: n for n, s in enumerate(items['socketOrder'])}
    room = json.load(open(os.path.join(D, f'room_{stage}.json')))
    loadout = loadout or {}
    world = Image.open(os.path.join(A, room['background'] + '.png')).convert('RGBA')
    slots = {s['id']: s for s in room['slots']}
    chosen = {sid: loadout.get(sid, s['default']) for sid, s in slots.items()}
    placed = {}

    def resolve(sid):
        if sid in placed:
            return placed[sid]
        s, iid = slots[sid], chosen[sid]
        if iid is None:
            placed[sid] = None
            return None
        if s['kind'] in ('surface', 'seat'):
            p = resolve(s['parent'])
            if p is None:
                placed[sid] = None
                return None
            pitem = cat[p['item']]
            off = pitem.get('seat') if s['kind'] == 'seat' else pitem.get('sockets', {}).get(s['socket'])
            if off is None:
                placed[sid] = None
                return None
            anchor = [p['anchor'][0] + off[0], p['anchor'][1] + off[1]]
            base = p['base']
            sub = (1 + order.get(s['socket'], 0), anchor[1]) if s['kind'] == 'surface' else (0, 0)
            if s['kind'] == 'seat':
                base = anchor[1]
        else:
            anchor, base, sub = s['anchor'], s['anchor'][1], (0, 0)
        placed[sid] = dict(item=iid, anchor=anchor, base=base, sub=sub, kind=s['kind'])
        return placed[sid]

    for sid in slots:
        resolve(sid)
    draws = []   # (layer, baseline, sub, img, x, y)
    LAYER = {'wall': 0, 'decal': 1, 'floor': 3, 'surface': 3, 'seat': 3}
    for sid, p in placed.items():
        if not p:
            continue
        it = cat[p['item']]
        img = load(it['sprite'])
        ax, ay = p['anchor']
        x, y = ax - img.width // 2, ay - img.height
        draws.append((LAYER[p['kind']], p['base'], p['sub'], img, x, y))
        if 'shadow' in it and p['kind'] in ('floor', 'seat'):
            sh = Image.open(os.path.join(A, it['shadow'] + '.png')).convert('RGBA')
            draws.append((2, 0, (0, 0), sh, ax - sh.width // 2, ay - sh.height // 2 - 1))
        if p['kind'] == 'seat' and character:
            pose = cut_pose(POSES['sit_back'])
            sx, sy = ax + it['seatPoint'][0], ay + it['seatPoint'][1]
            draws.append((3, p['base'], (1, 0), pose, sx - pose.width // 2, sy - pose.height + SIT_HIP_FROM_BOTTOM))
            if 'overlayFromY' in it:
                cut_y = img.height + it['overlayFromY']
                draws.append((3, p['base'], (2, 0), img.crop((0, cut_y, img.width, img.height)), x, y + cut_y))
    draws.sort(key=lambda d: (d[0], d[1], d[2]))
    for _, _, _, img, x, y in draws:
        world.alpha_composite(img, (x, y)) if x >= 0 and y >= 0 else world.paste(
            Image.alpha_composite(world.crop((x, y, x + img.width, y + img.height)), img), (x, y))
    return world


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'character_cut'), exist_ok=True)
    for name, rect in POSES.items():
        im = cut_pose(rect)
        im.save(os.path.join(OUT, 'character_cut', f'char_{name}.png'))
        print('pose', name, im.size)
    for st in ['student', 'junior', 'senior']:
        img = render(st)
        img.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(OUT, f'expected_{st}.png'))
        print('rendered', st)
    # cross-stage swap example: senior desk set inside the junior room
    img = render('junior', loadout={'desk': 'senior.standing_desk', 'seat': 'senior.ergo_chair',
                                    'display': 'senior.dual_monitor', 'keyboard': 'senior.keyboard_mat', 'mouse': None})
    img.resize((W * 3, H * 3), Image.NEAREST).save(os.path.join(OUT, 'expected_junior_swap_example.png'))
