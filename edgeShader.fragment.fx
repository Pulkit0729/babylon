precision highp float;

uniform sampler2D depthSampler; // Texture containing scene depth data

uniform vec4 edgeColor;
uniform vec2 textureSize; // Size of the texture

uniform float edgeThickness;

void main() {
    vec2 texelSize = 1.0 / textureSize;
    vec2 uv = gl_FragCoord.xy / textureSize;

    float depth = texture2D(depthSampler, uv).r;
    float contrast1 = abs(depth - texture2D(depthSampler, uv-vec2(edgeThickness*texelSize.x, 0.)).r);
    float contrast2 = abs(depth - texture2D(depthSampler, uv+vec2(edgeThickness*texelSize.x, 0.)).r);
    float contrast3 = abs(depth - texture2D(depthSampler, uv-vec2(0., edgeThickness*texelSize.x)).r);
    float contrast4 = abs(depth - texture2D(depthSampler, uv+vec2(0., edgeThickness*texelSize.y)).r);

    float maxContrast = max(contrast1, max(contrast2, max(contrast3, contrast4)));
    
    if(maxContrast < 0.1){
        gl_FragColor = vec4(1.0, 0., 1.0, 1.0);
    }else{
        gl_FragColor = edgeColor;
    }
}
