export const liquidVertex=`attribute vec2 position;varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

export const liquidFragment=`precision highp float;
varying vec2 uv;
uniform sampler2D channels;
uniform vec2 levels;
uniform float time,square,agitation,pixel;
float hash(float n){return fract(sin(n*127.1)*43758.5453);}
float roundedBox(vec2 p,vec2 b,float r){vec2 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,q.y),0.)-r;}
// Exact arclength, avoiding visible 8-bit steps when subpixel bubbles move.
float squareAlong(vec2 p){
 p.x=256.+abs(p.x-256.);
 const float corner=119.38052084;
 float arc;
 if(p.y<127.){
  arc=p.x<389.?p.x-304.:85.+76.*(atan(p.y-127.,p.x-389.)+1.570796327);
 }else if(p.y>392.){
  arc=p.x<389.?85.+corner*2.+265.+389.-p.x:85.+corner+265.+76.*atan(p.y-392.,p.x-389.);
 }else{arc=85.+corner+p.y-127.;}
 return clamp(arc/(435.+corner*2.),0.,1.);
}
void main(){
 vec4 channel=texture2D(channels,uv);
 if(channel.a<.01)discard;
 vec2 p=vec2(uv.x,1.-uv.y)*512.;
 float side=step(256.,p.x);
 float circleAlong=(abs(atan(p.x-256.,256.-p.y))-.3141592654)/2.513274123;
 float along=mix(clamp(circleAlong,0.,1.),squareAlong(p),square);
 float pathLength=mix(442.3362458,673.7610417,square);
 float level=mix(levels.x,levels.y,side);
 float distanceToWall=mix(length(p-256.)-176.,roundedBox(p-vec2(256.,259.5),vec2(209.,208.5),76.),square);
 float across=clamp(distanceToWall/mix(9.,5.,square),-1.,1.);
 float wave=(sin(time*2.1+across*2.5+side*4.)*.0025+sin(time*3.7-across*4.)*.0015)*(1.+agitation*3.);
 float surface=1.-level+wave*step(.001,level)*step(level,.999);
 float wet=smoothstep(surface-.003,surface+.003,along)*step(.0001,level);
 float dome=sqrt(max(0.,1.-across*across));
 // Absorption through a curved tube: deep edges, illuminated translucent core.
 vec3 tint=mix(vec3(.19,.48,.035),vec3(.53,.018,.025),side);
 vec3 bright=mix(vec3(.63,.86,.19),vec3(.94,.16,.08),side);
 float flow=sin(along*31.-time*.7+sin(across*3.+time*.3)*1.4);
 float caustic=pow(.5+.5*sin(along*74.+across*4.+time*.8+flow),7.);
 vec3 liquid=tint*(.38+dome*.95+flow*.09)+bright*caustic*.17*dome;
 float highlight=exp(-pow((across+.38+sin(along*19.-time*.45)*.08)/.18,2.));
 liquid+=mix(vec3(.85,1.,.64),vec3(1.,.61,.39),side)*highlight*(.19+.07*sin(along*35.+time));
 // Rising gas bubbles are hollow spheres with a lit rim and a dark refractive centre.
 for(int i=0;i<7;i++){
  float id=float(i)+side*19.;
  float age=fract(hash(id+7.)+time*(.018+hash(id+9.)*.026));
  float y=1.-age;
  float x=(hash(id+3.)-.5)*1.25+sin(time*.7+id+age*9.)*.12;
  vec2 delta=vec2((across-x)*mix(9.,5.,square),(along-y)*pathLength);
  float radius=.85+hash(id+17.)*.9;
  float aa=max(.4,pixel*.65);
  if(abs(delta.y)<radius+aa*2.){
   float fade=smoothstep(0.,.025,age)*(1.-smoothstep(.95,1.,age));
   float d=length(delta);
   float rim=1.-smoothstep(aa*.2,aa+radius*.2,abs(d-radius));
   float inside=1.-smoothstep(radius*.15,radius+aa,d);
   liquid*=1.-inside*.24*fade;
   liquid+=bright*rim*.48*fade;
   float glint=1.-smoothstep(radius*.15,radius*.4+aa,length(delta-vec2(-radius*.35,-radius*.4)));
   liquid+=vec3(.8,.9,.72)*glint*.25*fade;
  }
 }
 // Bright curved meniscus and a shaded pocket behind its leading edge.
 float lip=exp(-pow((along-surface-.002)/.0035,2.))*step(.001,level)*step(level,.995);
 liquid+=bright*lip*.65;
 vec3 empty=vec3(.013,.019,.019)+vec3(.045,.061,.055)*highlight*.35;
 vec3 color=mix(empty,liquid,wet);
 // A restrained glass reflection continues across the empty part of the tube.
 color+=vec3(.65,.79,.78)*pow(max(0.,1.-abs(across+.73)/.12),3.)*.15;
 gl_FragColor=vec4(color,channel.a);
}`;
