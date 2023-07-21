#ifdef GL_ES
    precision highp float;
#endif

#define TAU 6.28318530718

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform float tint_amount;
uniform float time;

vec3 gerstner_wave(vec2 pos, vec2 direction, float wavelength, float steepness) {
    float k = TAU / wavelength;
    float c = sqrt(9.8 / k);
    float a = steepness / k;

    vec2 normal_direction = normalize(direction);
    float f = k * (dot(normal_direction, pos) - c * (time * 0.001) );

    return vec3( normal_direction.y * (cos(f) * a) , sin(f) * a , normal_direction.x * (cos(f) * a) );
}

void main(void) {
    vec2 uv = vTextureCoord;

    // vec2 wave = gerstner_wave(uv, vec2(0.0, 1.0), 0.05, 0.15).xy;
    // uv += wave * 1.0;

    // float dist = -0.5 - uv.x;


    vec4 color = texture2D(uSampler, uv);

    float similarity = sin(uv.x * 10.0) * 0.5 + 0.5;
    similarity = 1.0 - (color.x + color.y + color.z) / 3.0;
    similarity = floor(similarity);

    color = vec4(similarity, 0.0, 0.0, 1.0);
    color *= tint_amount;

    gl_FragColor = texture2D(uSampler, uv) * (1.0 - tint_amount) + color;
}