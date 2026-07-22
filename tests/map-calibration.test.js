#!/usr/bin/env node
const assert=require("assert");
const T=require("../mapa-lab-transform.js");

const coefficients={pixelX:[2,.25,100],pixelY:[-.5,3,200]};
const natives=[{x:0,y:0,z:1},{x:100,y:0,z:2},{x:0,y:100,z:3},{x:100,y:100,z:4},{x:45,y:70,z:5}];
const points=natives.map((native,index)=>({id:`p${index}`,native,image:T.nativeToPixel(native,coefficients),use:index===4?"validation":"fit"}));
const fitted=T.fitAffine(points.filter(point=>point.use==="fit"));

for(const axis of ["pixelX","pixelY"]){
  fitted[axis].forEach((value,index)=>assert.ok(Math.abs(value-coefficients[axis][index])<1e-9));
}
const image=T.nativeToPixel(natives[4],fitted);
const inverse=T.pixelToNative(image,fitted,natives[4].z);
assert.ok(Math.abs(inverse.x-natives[4].x)<1e-9);
assert.ok(Math.abs(inverse.y-natives[4].y)<1e-9);
assert.strictEqual(inverse.z,5);
assert.deepStrictEqual(T.toLeaflet({pixelX:320,pixelY:240},1000),[760,320]);
assert.deepStrictEqual(T.fromLeaflet({lat:760,lng:320},1000),{pixelX:320,pixelY:240});
assert.deepStrictEqual(T.normalize({pixelX:500,pixelY:250},1000,500),{pixelX:500,pixelY:250,u:.5,v:.5});
const report=T.validate([points[4]],fitted);
assert.ok(report.rmsePixels<1e-9&&report.maxErrorPixels<1e-9);
assert.throws(()=>T.fitAffine(points.slice(0,2)),/ao menos três pontos/);

const similarity={pixelX:[0,.00565,4095],pixelY:[-.00565,0,1975]};
const similarityPoints=natives.slice(0,3).map((native,index)=>({id:`s${index}`,native,image:T.nativeToPixel(native,similarity)}));
const similarityFit=T.fitSimilarity(similarityPoints);
for(const axis of ["pixelX","pixelY"]){
  similarityFit[axis].forEach((value,index)=>assert.ok(Math.abs(value-similarity[axis][index])<1e-9));
}
assert.throws(()=>T.fitSimilarity(similarityPoints.slice(0,1)),/ao menos dois pontos/);

const worldPoints=points.map(({native,...point})=>({...point,world:native}));
const worldFit=T.fitAffine(worldPoints.filter(point=>point.use==="fit"));
assert.ok(T.validate([worldPoints[4]],worldFit).maxErrorPixels<1e-9);

console.log("map-calibration: transformação, inversa, normalização e validação aprovadas");
