#version 300 es
precision lowp float;

in vec2 vu;
in vec4 vc;

uniform sampler2D g;

out vec4 oc;

void main() {
    vec4 tex = texture(g, vu);
    if(vu.x == 2.0f || (tex.r == 0.0f && tex.g == 0.0f && tex.b == 0.0f && tex.a == 1.0f)) {
        oc = vc;
    } else {
        oc = tex;
    }
}