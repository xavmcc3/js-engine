precision highp float;

#define PI 3.14159265359
#define TAU 6.28318530718
#define S(a,b,n) smoothstep(a,b,n)

varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

//https://github.com/Jam3/glsl-fast-gaussian-blur
vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
    vec4 color = vec4(0.0);
    vec2 off1 = vec2(1.411764705882353) * direction;
    vec2 off2 = vec2(3.2941176470588234) * direction;
    vec2 off3 = vec2(5.176470588235294) * direction;
    color += texture2D(image, uv) * 0.1964825501511404;
    color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
    color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
    color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
    color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
    return color;
}

vec3 GerstnerWave(vec2 pos, vec2 direction, float waveLength, float stepness){
    float k = TAU / waveLength;

    vec2 d = normalize(direction);
    
    float c = sqrt(9.8 / k);
    float f = k * (dot(d, pos) - c * (u_time * .01) );
    float a = stepness / k;


    return vec3( d.y * (cos(f) * a) , sin(f) * a , d.x * (cos(f) * a) );
}

void main(){
    vec2 uv = vTextureCoord;
    
    vec2 st = gl_FragCoord.xy - 0.5 * u_resolution.xy / min(u_resolution.x, u_resolution.y);


    vec2 wave = GerstnerWave(uv.xy, vec2(0., 1.), .05, 0.15).xy;
        wave += GerstnerWave(uv.xy, vec2(1., 0.), .15, 0.25).xy;
        wave += GerstnerWave(uv.xy, vec2(1., 1.), .25, 0.35).xy;

    vec2 uv2 = abs(uv - 0.5);
    
    float s = S(0.5, 0.1,  abs(uv2.x - .5) );

    uv += wave * s;

    vec4 blurColor = blur13(uSampler, uv, u_resolution, vec2(1.0, 1.0));

    vec4 color = texture2D(uSampler, uv);

    //gl_FragColor = vec4(vec3(s), 1.0);
    vec4 mixColor = mix(color, blurColor, s);
    gl_FragColor = mix(mixColor, vec4(0.0), s);
}