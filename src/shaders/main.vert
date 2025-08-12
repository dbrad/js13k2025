#version 300 es
precision lowp float;

in vec2 p, t, s, u;
in vec4 c;

out vec2 vu;
out vec4 vc;

const vec2 res = vec2(640, 360);

void main() {
    vu = u;
    vc = c;
    gl_Position = vec4((floor(p * s + t) / res * 2.0f - 1.0f) * vec2(1, -1), 0.0f, 1.0f);
}