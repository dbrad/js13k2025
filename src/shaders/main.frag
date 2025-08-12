#version 300 es
precision lowp float;

in vec2 vu;
in vec4 vc;

uniform sampler2D g;

out vec4 oc;

void main() {
    if(vu.x == 2.0) {
        oc = vc;
    } else {
        oc = texture(g, vu) * vc;
    }
}