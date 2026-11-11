/* All coordinates belong to the paper, never to CSS pixels. 5 units = 1 mm. */
(function (root) {
  'use strict';
  const U = 5, EPS = 1e-8, TAU = Math.PI * 2;
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = () => 'ink-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const bearing = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const polar = (a, radius, angle) => [a[0] + radius * Math.cos(angle), a[1] + radius * Math.sin(angle)];
  const signedAngle = (a, v, b) => Math.atan2(Math.sin(bearing(v, b) - bearing(v, a)), Math.cos(bearing(v, b) - bearing(v, a)));
  const angle = (a, v, b) => Math.abs(signedAngle(a, v, b)) * 180 / Math.PI;
  const mm = value => value / U;
  function segmentDistance(p, a, b, infinite = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = dx * dx + dy * dy;
    let t = d ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d : 0;
    if (!infinite) t = Math.max(0, Math.min(1, t));
    return distance(p, [a[0] + t * dx, a[1] + t * dy]);
  }
  function lineLine(first, second) {
    const [a, b] = [first.a, first.b], [c, d] = [second.a, second.b];
    const rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1];
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < EPS) return [];
    const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
    const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
    if (first.type !== 'line' && (t < -EPS || t > 1 + EPS)) return [];
    if (second.type !== 'line' && (u < -EPS || u > 1 + EPS)) return [];
    return [[a[0] + t * rx, a[1] + t * ry]];
  }
  function lineCircle(line, circle) {
    const dx = line.b[0] - line.a[0], dy = line.b[1] - line.a[1];
    const x = line.a[0] - circle.c[0], y = line.a[1] - circle.c[1];
    const A = dx * dx + dy * dy;
    if (A < EPS) return [];
    const center = -(x * dx + y * dy) / A;
    const fx = x + center * dx, fy = y + center * dy;
    const distanceSquared = fx * fx + fy * fy, heightSquared = circle.r * circle.r - distanceSquared;
    const tolerance = EPS * Math.max(1, circle.r * circle.r, distanceSquared);
    if (heightSquared < -tolerance) return [];
    const offset = Math.sqrt(Math.max(0, heightSquared) / A);
    const values = heightSquared <= tolerance ? [center] : [center - offset, center + offset];
    return values.filter(t => line.type === 'line' || t >= -EPS && t <= 1 + EPS).map(t => [line.a[0] + dx * t, line.a[1] + dy * t]);
  }
  function circleCircle(a, b) {
    const d = distance(a.c, b.c);
    if (d < EPS || d > a.r + b.r + EPS || d < Math.abs(a.r - b.r) - EPS) return [];
    const along = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a.r * a.r - along * along));
    const dx = (b.c[0] - a.c[0]) / d, dy = (b.c[1] - a.c[1]) / d;
    const p = [a.c[0] + along * dx, a.c[1] + along * dy];
    return h < EPS ? [p] : [[p[0] - h * dy, p[1] + h * dx], [p[0] + h * dy, p[1] - h * dx]];
  }
  function edges(o) {
    if (['line', 'segment', 'ruler'].includes(o.type)) return [o];
    const p = o.type === 'rect' ? [o.a, [o.b[0], o.a[1]], o.b, [o.a[0], o.b[1]]] : o.type === 'triangle' || o.type === 'polygon' ? o.points : null;
    if (!p) return [];
    return p.map((a, i) => ({type: 'segment', a, b: p[(i + 1) % p.length]}));
  }
  function anchors(o) {
    if (o.type === 'point') return [o.p];
    if (o.type === 'circle' || o.type === 'arc') return [o.c];
    if (o.type === 'angle') return [o.a, o.v, o.b];
    if (o.type === 'rect') return [o.a, [o.b[0], o.a[1]], o.b, [o.a[0], o.b[1]]];
    if (o.type === 'triangle' || o.type === 'polygon') return o.points;
    if (o.a && o.b) return [o.a, o.b];
    return [];
  }
  function snapCandidates(objects) {
    const points = objects.flatMap(anchors).map(p => p.slice(0, 2));
    const lines = objects.flatMap(edges), circles = objects.filter(o => o.type === 'circle');
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) points.push(...lineLine(lines[i], lines[j]));
      for (const circle of circles) points.push(...lineCircle(lines[i], circle));
    }
    for (let i = 0; i < circles.length; i++) for (let j = i + 1; j < circles.length; j++) points.push(...circleCircle(circles[i], circles[j]));
    return points;
  }
  function snap(p, candidates, tolerance) {
    let best = null, nearest = tolerance;
    for (const q of candidates) { const d = distance(p, q); if (d < nearest) { best = q; nearest = d; } }
    return best ? {point: best.slice(), snapped: true} : {point: p, snapped: false};
  }
  function bounds(o) {
    let points = anchors(o);
    if (o.type === 'circle' || o.type === 'arc') points = [[o.c[0] - o.r, o.c[1] - o.r], [o.c[0] + o.r, o.c[1] + o.r]];
    if (o.type === 'pencil' || o.type === 'highlight') points = o.points;
    if (o.type === 'text') points = [[o.x, o.y - o.size], [o.x + Math.max(...o.text.split('\n').map(x => x.length), 1) * o.size * .58, o.y + (o.text.split('\n').length - 1) * o.size * 1.35]];
    if (!points.length) return [0, 0, 0, 0];
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function hit(o, p, tolerance) {
    if (o.type === 'text') { const b = bounds(o); return p[0] >= b[0] - tolerance && p[0] <= b[2] + tolerance && p[1] >= b[1] - tolerance && p[1] <= b[3] + tolerance; }
    if (o.type === 'point') return distance(o.p, p) <= tolerance + 4;
    if (o.type === 'circle' || o.type === 'arc') {
      if (distance(o.c, p) <= tolerance) return true;
      if (Math.abs(distance(o.c, p) - o.r) > tolerance + (o.width || 1)) return false;
      if (o.type === 'circle') return true;
      const t = (bearing(o.c, p) - o.start + TAU) % TAU, end = (o.end - o.start + TAU) % TAU;
      return t <= end + EPS;
    }
    if (o.type === 'angle') return segmentDistance(p, o.v, o.a) < tolerance || segmentDistance(p, o.v, o.b) < tolerance;
    if (o.type === 'pencil' || o.type === 'highlight') return o.points.some((a, i) => i ? segmentDistance(p, o.points[i - 1], a) < tolerance + o.width / 2 : distance(p, a) < tolerance + o.width / 2);
    return edges(o).some(e => segmentDistance(p, e.a, e.b, e.type === 'line') < tolerance + (o.width || 1));
  }
  function move(o, dx, dy) {
    const c = clone(o), shift = p => [p[0] + dx, p[1] + dy, ...p.slice(2)];
    for (const key of ['a', 'b', 'c', 'v', 'p']) if (c[key]) c[key] = shift(c[key]);
    if (c.points) c.points = c.points.map(shift);
    if (c.type === 'text') { c.x += dx; c.y += dy; }
    return c;
  }
  function construct(tool, points, options = {}) {
    const common = {id: id(), type: tool, color: options.color || '#24334a', width: Number(options.width) || 2.4};
    if (tool === 'point') return {...common, p: points[0], label: options.label || 'A'};
    if (tool === 'text') return {...common, x: points[0][0], y: points[0][1], text: options.text || '', size: Number(options.size) || 32};
    if (tool === 'circle') return {...common, c: points[0], r: Number(options.radius) > 0 ? Number(options.radius) * U : distance(points[0], points[1])};
    if (tool === 'arc') return {...common, c: points[0], r: Number(options.radius) > 0 ? Number(options.radius) * U : distance(points[0], points[1]), start: bearing(points[0], points[1]), end: bearing(points[0], points[2])};
    if (tool === 'angle') {
      const v = points[0], a = points[1], b = Number(options.angle) > 0 ? polar(v, distance(v, a), bearing(v, a) + Number(options.angle) * Math.PI / 180) : points[2];
      return {...common, v, a, b};
    }
    if (tool === 'triangle' || tool === 'polygon') return {...common, points: points.map(p => p.slice())};
    if (tool === 'pencil' || tool === 'highlight') return {...common, points: points.map(p => p.slice()), width: tool === 'highlight' ? Math.max(12, Number(options.width) * 7 || 18) : common.width};
    const a = points[0], b = Number(options.length) > 0 && tool !== 'rect' ? polar(a, Number(options.length) * U, bearing(a, points[1])) : points[1];
    return {...common, a, b};
  }
  function diff(before, after) {
    const previous = new Map(before.map(o => [o.id, o])), next = new Map(after.map(o => [o.id, o])), changes = [];
    for (const key of new Set([...previous.keys(), ...next.keys()])) {
      const a = previous.get(key), b = next.get(key);
      if (JSON.stringify(a) !== JSON.stringify(b)) changes.push({id: key, before: a ? clone(a) : null, after: b ? clone(b) : null});
    }
    return changes.length ? {changes, beforeOrder: before.map(o => o.id), afterOrder: after.map(o => o.id)} : null;
  }
  function apply(objects, command, direction) {
    const values = new Map(objects.map(o => [o.id, o]));
    for (const change of command.changes) { const target = change[direction]; if (target) values.set(change.id, clone(target)); else values.delete(change.id); }
    return command[direction + 'Order'].map(key => values.get(key)).filter(Boolean);
  }
  function erase(objects, p, radius) {
    const result = [];
    for (const o of objects) {
      if (!hit(o, p, radius)) { result.push(o); continue; }
      if (o.type !== 'pencil' && o.type !== 'highlight') continue;
      const dense = [];
      o.points.forEach((b, i) => {
        if (!i) { dense.push(b); return; }
        const a = o.points[i - 1], count = Math.max(1, Math.ceil(distance(a, b) / Math.max(1, radius / 3)));
        for (let k = 1; k <= count; k++) dense.push([a[0] + (b[0] - a[0]) * k / count, a[1] + (b[1] - a[1]) * k / count, b[2] || .5]);
      });
      let chunk = [];
      const finish = () => { if (chunk.length) result.push({...clone(o), id: id(), points: chunk}); chunk = []; };
      for (const q of dense) { if (distance(q, p) <= radius + o.width / 2) finish(); else chunk.push(q); }
      finish();
    }
    return result;
  }
  function edit(o, changes) {
    const result = {...clone(o), ...changes};
    if (changes.length > 0 && result.a && result.b) result.b = polar(result.a, Number(changes.length) * U, bearing(result.a, result.b));
    if (changes.radius > 0 && (result.type === 'circle' || result.type === 'arc')) result.r = Number(changes.radius) * U;
    if (changes.angle > 0 && result.type === 'angle') result.b = polar(result.v, distance(result.v, result.b), bearing(result.v, result.a) + Number(changes.angle) * Math.PI / 180);
    delete result.length; delete result.radius; delete result.angle;
    return result;
  }
  const api = {U, EPS, TAU, clone, id, distance, bearing, polar, signedAngle, angle, mm, segmentDistance, lineLine, lineCircle, circleCircle, anchors, edges, snapCandidates, snap, bounds, hit, move, construct, diff, apply, erase, edit};
  root.CermatGeometry = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
