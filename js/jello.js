(() => {
    'use strict';
    const canvas = document.getElementById('jello-canvas');
    const stage = document.getElementById('jello-stage');
    const panel = document.getElementById('jello-controls');
    const home = document.getElementById('home-page');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) return;
    const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
    const fragment = `
    precision highp float;
    uniform vec2 center, stretch;
    uniform float pixels, time, motion;
    uniform vec3 tint, turn;
    const float PI=3.14159265;
    mat2 rotate(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
    // Fold five identical sectors onto one star edge, then round its extrusion.
    float star(vec2 p){
        float angle=mod(atan(p.x,p.y)+PI/5.,2.*PI/5.)-PI/5.;
        vec2 q=length(p)*vec2(sin(abs(angle)),cos(angle));
        vec2 a=vec2(0.,1.15), b=vec2(sin(PI/5.),cos(PI/5.))*.53;
        vec2 edge=b-a, relative=q-a;
        float h=clamp(dot(relative,edge)/dot(edge,edge),0.,1.);
        return length(relative-edge*h)*sign(edge.x*relative.y-edge.y*relative.x);
    }
    float shape(vec3 p){
        p.xy=rotate(turn.z)*p.xy;
        p.yz=rotate(turn.x)*p.yz;
        p.xz=rotate(turn.y)*p.xz;
        p.x-=stretch.x*p.y*.35;
        p.y/=1.+stretch.y*.20;
        p.xz*=1.+stretch.y*.10;
        p.xy+=vec2(sin(p.y*5.-time*5.),sin(p.x*4.+time*4.3))*motion*.055;
        p.z+=sin(p.x*4.+time*3.)*cos(p.y*4.-time*2.7)*motion*.075;
        float bulge=.06*cos(p.x*2.)*cos(p.y*2.);
        vec2 d=vec2(star(p.xy),abs(p.z)-.16-bulge);
        return (min(max(d.x,d.y),0.)+length(max(d,0.))-.12)*.62;
    }
    vec3 normalAt(vec3 p){
        vec2 e=vec2(.002,0.);
        return normalize(vec3(shape(p+e.xyy)-shape(p-e.xyy),shape(p+e.yxy)-shape(p-e.yxy),shape(p+e.yyx)-shape(p-e.yyx)));
    }
    float card(vec2 uv,vec2 pos,vec2 halfSize,float blur){
        vec2 d=abs(uv-pos)-halfSize;
        return 1.-smoothstep(-blur,blur,max(d.x,d.y));
    }
    vec3 environment(vec3 d){
        vec2 uv=d.xy/max(abs(d.z),.12);
        float front=smoothstep(-.1,.1,d.z);
        float key=card(uv,vec2(-.85,.95),vec2(.65,.32),.06);
        float strip=card(uv,vec2(.9,.1),vec2(.075,.85),.025);
        float edge=card(uv,vec2(-1.25,-.35),vec2(.07,.65),.02);
        float rear=card(uv,vec2(.15,-.65),vec2(1.05,.32),.035);
        float ceiling=pow(max(d.y,0.),6.);
        return vec3(.012)+vec3(1.,.95,.98)*(front*(key*5.+strip*7.+edge*4.)+(1.-front)*(rear*3.8+key*1.8))+ceiling*.6;
    }
    vec3 film(vec3 c){return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
    void main(){
        vec2 uv=(gl_FragCoord.xy-center)/pixels;
        // Expensive shading is confined to the moving body's bounding square.
        if(max(abs(uv.x),abs(uv.y))>1.9){gl_FragColor=vec4(0.,0.,0.,1.);return;}
        vec3 ro=vec3(uv,4.5),rd=vec3(0.,0.,-1.);
        float t=2.6; bool hit=false;
        for(int i=0;i<90;i++){
            float d=shape(ro+rd*t);
            if(d<.0012){hit=true;break;}if(t>6.4)break;t+=d;
        }
        vec3 col=vec3(0.);
        if(hit){
            vec3 p=ro+rd*t,n=normalAt(p);
            float fres=.028+.972*pow(1.-max(dot(-rd,n),0.),5.);
            vec3 direction=refract(rd,n,1./1.40);
            vec3 ep=p+direction*.008;
            float thickness=.008;
            for(int i=0;i<54;i++){
                float d=shape(ep);if(d>0.)break;
                float stepLength=max(abs(d),.007);
                thickness+=stepLength;ep+=direction*stepLength;
            }
            vec3 en=normalAt(ep);
            vec3 exitRay=refract(direction,-en,1.40);
            vec3 bounce=reflect(direction,-en);
            float internalFres=.028+.972*pow(1.-abs(dot(direction,en)),5.);
            if(length(exitRay)<.01){exitRay=bounce;internalFres=.8;}
            vec3 pigment=tint/max(max(tint.r,max(tint.g,tint.b)),.01);
            vec3 absorption=exp(-((1.-pigment)*5.+.12)*thickness);
            vec3 transmitted=mix(environment(exitRay),environment(bounce),internalFres)*absorption;
            transmitted+=tint*.10*(1.-exp(-thickness*3.));
            col=transmitted*(1.-fres)+environment(reflect(rd,n))*fres;
            col+=tint*.12*pow(1.-abs(dot(n,-rd)),3.);
            col=pow(film(col),vec3(1./2.2));
        }
        gl_FragColor=vec4(col,1.);
    }`;
    function shader(type, source) {
        const value=gl.createShader(type);
        gl.shaderSource(value,source);gl.compileShader(value);
        if(!gl.getShaderParameter(value,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(value));
        return value;
    }
    let program;
    try {
        program=gl.createProgram();
        gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));
        gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Jelly shader could not link');
    }catch(error){console.warn('Jelly unavailable:',error);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'position');
    gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    const uniforms=Object.fromEntries(['center','pixels','stretch','time','motion','tint','turn'].map(name=>[name,gl.getUniformLocation(program,name)]));
    const fields=Object.fromEntries(['color','softness','wobble','size'].map(name=>[name,document.getElementById('jello-'+name)]));
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    if(reducedMotion.matches)fields.wobble.value='0';
    const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
    const body={x:0,y:0,vx:0,vy:0,angle:0,spin:0,tiltX:.25,tiltY:-.22};
    const gel={x:0,y:0,vx:0,vy:0};
    let width=1,height=1,ratio=1,initialized=false,drag=null,raf=0,last=0,elapsed=0,lost=false;
    function scale(){return Math.min(135,width*.25,height*.20)*Number(fields.size.value)/100;}
    function bounds(){const r=scale()*1.30;return {left:r,right:Math.max(r,width-r),top:r,bottom:Math.max(r,height-r)};}
    function contain(){const b=bounds();body.x=clamp(body.x,b.left,b.right);body.y=clamp(body.y,b.top,b.bottom);}
    function resize(){
        const rect=stage.getBoundingClientRect();
        if(initialized){body.x*=rect.width/width;body.y*=rect.height/height;}
        width=rect.width;height=rect.height;
        ratio=Math.min(devicePixelRatio||1,1.35,1920/Math.max(width,height));
        canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
        gl.viewport(0,0,canvas.width,canvas.height);
        if(!initialized){body.x=width/2;body.y=height/2+90;initialized=true;}
        contain();wake();
    }
    function active(){return home.classList.contains('active')&&home.style.opacity!=='0'&&!document.hidden&&!lost;}
    function wake(){if(!raf&&active()){last=performance.now();raf=requestAnimationFrame(frame);}}
    function impact(axis,speed){gel[axis==='x'?'vx':'vy']+=clamp(speed/110,-7,7);body.spin+=clamp(speed/550,-2.4,2.4);}
    function frame(now){
        raf=0;if(!active())return;
        const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;
        const soft=Number(fields.softness.value)/100,spring=170-soft*100;
        for(let i=0;i<4;i++){
            const step=dt/4;let targetGX=0,targetGY=0;
            if(drag){
                const dx=drag.x-drag.offsetX-body.x,dy=drag.y-drag.offsetY-body.y;
                body.vx+=(dx*spring-body.vx*15)*step;body.vy+=(dy*spring-body.vy*15)*step;
                targetGX=clamp(dx/scale(),-1.1,1.1);targetGY=clamp(-dy/scale(),-.9,.9);
            }else{
                // The center keeps its momentum; only deformation springs back to rest.
                const friction=Math.exp(-.75*step);body.vx*=friction;body.vy*=friction;
            }
            body.x+=body.vx*step;body.y+=body.vy*step;
            const b=bounds();
            if(body.x<b.left||body.x>b.right){body.x=clamp(body.x,b.left,b.right);impact('x',body.vx);body.vx*=-.72;}
            if(body.y<b.top||body.y>b.bottom){body.y=clamp(body.y,b.top,b.bottom);impact('y',body.vy);body.vy*=-.72;}
            gel.vx+=((targetGX-gel.x)*(80-soft*45)-gel.vx*(7-soft*3))*step;
            gel.vy+=((targetGY-gel.y)*(85-soft*45)-gel.vy*(7-soft*3))*step;
            gel.x=clamp(gel.x+gel.vx*step,-1.2,1.2);gel.y=clamp(gel.y+gel.vy*step,-1.2,1.2);
            body.spin*=Math.exp(-1.2*step);body.angle+=body.spin*step;
            body.tiltX+=(.25+clamp(body.vy/900,-.65,.65)-body.tiltX)*step*5;
            body.tiltY+=(-.22+clamp(body.vx/900,-.65,.65)-body.tiltY)*step*5;
        }
        const rgb=fields.color.value.match(/\w\w/g).map(value=>Math.pow(parseInt(value,16)/255,2.2));
        const activity=Math.min(1.3,(Math.abs(gel.vx)+Math.abs(gel.vy))*.18+Math.hypot(body.vx,body.vy)/1000);
        gl.uniform2f(uniforms.center,body.x*ratio,(height-body.y)*ratio);gl.uniform1f(uniforms.pixels,scale()*ratio);
        gl.uniform2f(uniforms.stretch,gel.x,gel.y);gl.uniform3f(uniforms.turn,body.tiltX+gel.y*.18,body.tiltY+gel.x*.2,body.angle);
        gl.uniform1f(uniforms.time,elapsed);gl.uniform1f(uniforms.motion,Number(fields.wobble.value)/100*.18+activity);
        gl.uniform3f(uniforms.tint,...rgb);gl.drawArrays(gl.TRIANGLES,0,6);
        const moving=Math.hypot(body.vx,body.vy)>.3||Math.abs(body.spin)>.002||Math.abs(gel.x)+Math.abs(gel.y)+Math.abs(gel.vx)+Math.abs(gel.vy)>.003;
        if(drag||Number(fields.wobble.value)>0||moving)raf=requestAnimationFrame(frame);
    }
    function point(event){const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};}
    function hitTest(p){
        const dx=(p.x-body.x)/scale(),dy=(body.y-p.y)/scale(),c=Math.cos(body.angle),s=Math.sin(body.angle);
        const px=c*dx-s*dy,py=s*dx+c*dy;
        const a=Math.abs(((Math.atan2(px,py)+Math.PI/5+Math.PI*4)%(Math.PI*2/5))-Math.PI/5);
        const qx=Math.hypot(px,py)*Math.sin(a),qy=Math.hypot(px,py)*Math.cos(a);
        const ex=Math.sin(Math.PI/5)*.53,ey=Math.cos(Math.PI/5)*.53-1.15;
        return ex*(qy-1.15)-ey*qx<.14&&Math.hypot(dx,dy)<1.4;
    }
    canvas.addEventListener('pointerdown',event=>{
        if(event.button!==0||drag)return;
        const p=point(event);if(!hitTest(p))return;
        event.preventDefault();canvas.focus({preventScroll:true});
        drag={id:event.pointerId,...p,offsetX:p.x-body.x,offsetY:p.y-body.y,samples:[{...p,t:performance.now()}]};
        canvas.setPointerCapture(event.pointerId);body.spin*=.2;wake();
    });
    canvas.addEventListener('pointermove',event=>{
        const p=point(event);canvas.classList.toggle('over-jelly',!!drag||hitTest(p));
        if(!drag||drag.id!==event.pointerId)return;
        const now=performance.now();drag.x=p.x;drag.y=p.y;
        drag.samples.push({...p,t:now});drag.samples=drag.samples.filter(sample=>now-sample.t<100);wake();
    });
    function release(event,throwBody=true){
        if(!drag||event&&event.pointerId!==undefined&&event.pointerId!==drag.id)return;
        const grab=drag;drag=null;
        if(throwBody){
            const samples=grab.samples,first=samples[0],end=samples[samples.length-1];
            if(samples.length>1&&performance.now()-end.t<110){
                const seconds=Math.max(.016,(end.t-first.t)/1000);
                body.vx=clamp((end.x-first.x)/seconds,-1800,1800);body.vy=clamp((end.y-first.y)/seconds,-1800,1800);
            }else{body.vx*=.15;body.vy*=.15;}
            body.spin=clamp((grab.offsetX*body.vy-grab.offsetY*body.vx)/(scale()*scale())*.22,-5,5);
            gel.vx+=clamp(body.vx/350,-4,4);gel.vy-=clamp(body.vy/350,-4,4);
        }else{body.vx=body.vy=0;}
        if(canvas.hasPointerCapture(grab.id))canvas.releasePointerCapture(grab.id);wake();
    }
    canvas.addEventListener('pointerup',event=>release(event));
    canvas.addEventListener('pointercancel',event=>release(event,false));
    canvas.addEventListener('lostpointercapture',event=>release(event,false));
    function jiggle(){body.vx+=260;body.vy-=230;body.spin+=1.8;gel.vx+=3;gel.vy-=4;wake();}
    canvas.addEventListener('keydown',event=>{
        if([' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
            event.preventDefault();
            if(event.key==='ArrowLeft')body.vx-=260;else if(event.key==='ArrowRight')body.vx+=260;
            else if(event.key==='ArrowUp')body.vy-=260;else if(event.key==='ArrowDown')body.vy+=260;
            else jiggle();wake();
        }
    });
    Object.values(fields).forEach(field=>field.addEventListener('input',()=>{contain();wake();}));
    document.getElementById('jello-jiggle').addEventListener('click',jiggle);
    document.getElementById('jello-reset').addEventListener('click',()=>{
        release(null,false);
        fields.color.value='#ec087b';fields.softness.value='65';fields.wobble.value=reducedMotion.matches?'0':'35';fields.size.value='100';
        Object.assign(body,{x:width/2,y:height/2+90,vx:0,vy:0,angle:0,spin:0,tiltX:.25,tiltY:-.22});
        Object.assign(gel,{x:0,y:0,vx:0,vy:0});elapsed=0;contain();wake();
    });
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)fields.wobble.value='0';wake();});
    new MutationObserver(()=>{if(!active())release(null,false);else wake();}).observe(home,{attributes:true,attributeFilter:['class','style']});
    document.addEventListener('visibilitychange',()=>{release(null,false);wake();});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stage.hidden=true;panel.hidden=true;});
    stage.hidden=false;panel.hidden=false;new ResizeObserver(resize).observe(stage);resize();
})();
