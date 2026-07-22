(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.MapLabTransform=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  function solveLinear(matrix,values){
    const n=values.length,a=matrix.map((row,i)=>[...row,values[i]]);
    for(let col=0;col<n;col++){
      let pivot=col;
      for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
      if(Math.abs(a[pivot][col])<1e-12)throw new Error("Pontos de calibração degenerados ou colineares.");
      [a[col],a[pivot]]=[a[pivot],a[col]];
      const divisor=a[col][col];
      for(let j=col;j<=n;j++)a[col][j]/=divisor;
      for(let row=0;row<n;row++){
        if(row===col)continue;
        const factor=a[row][col];
        for(let j=col;j<=n;j++)a[row][j]-=factor*a[col][j];
      }
    }
    return a.map(row=>row[n]);
  }

  function fitAffine(points){
    if(!Array.isArray(points)||points.length<3)throw new Error("A calibração afim exige ao menos três pontos.");
    const rows=[],values=[];
    for(const point of points){
      const {x,y}=point.world||point.native,{pixelX,pixelY}=point.image;
      if(![x,y,pixelX,pixelY].every(Number.isFinite))throw new Error(`Referência inválida: ${point.id||"sem id"}`);
      rows.push([x,y,1,0,0,0],[0,0,0,x,y,1]);
      values.push(pixelX,pixelY);
    }
    const normal=Array.from({length:6},()=>Array(6).fill(0)),rhs=Array(6).fill(0);
    rows.forEach((row,i)=>row.forEach((value,r)=>{
      rhs[r]+=value*values[i];
      row.forEach((other,c)=>normal[r][c]+=value*other);
    }));
    const [a,b,c,d,e,f]=solveLinear(normal,rhs);
    return {pixelX:[a,b,c],pixelY:[d,e,f]};
  }

  function fitSimilarity(points){
    if(!Array.isArray(points)||points.length<2)throw new Error("A calibração por similaridade exige ao menos dois pontos.");
    const rows=[],values=[];
    for(const point of points){
      const {x,y}=point.world||point.native,{pixelX,pixelY}=point.image;
      if(![x,y,pixelX,pixelY].every(Number.isFinite))throw new Error(`Referência inválida: ${point.id||"sem id"}`);
      rows.push([x,y,1,0],[y,-x,0,1]);
      values.push(pixelX,pixelY);
    }
    const normal=Array.from({length:4},()=>Array(4).fill(0)),rhs=Array(4).fill(0);
    rows.forEach((row,i)=>row.forEach((value,r)=>{
      rhs[r]+=value*values[i];
      row.forEach((other,c)=>normal[r][c]+=value*other);
    }));
    const [a,b,c,f]=solveLinear(normal,rhs);
    return {pixelX:[a,b,c],pixelY:[-b,a,f]};
  }

  function nativeToPixel(native,coefficients){
    const [a,b,c]=coefficients.pixelX,[d,e,f]=coefficients.pixelY;
    return {pixelX:a*native.x+b*native.y+c,pixelY:d*native.x+e*native.y+f};
  }

  function pixelToNative(image,coefficients,z=null){
    const [a,b,c]=coefficients.pixelX,[d,e,f]=coefficients.pixelY;
    const determinant=a*e-b*d;
    if(Math.abs(determinant)<1e-12)throw new Error("Transformação afim sem inversa.");
    const px=image.pixelX-c,py=image.pixelY-f;
    return {x:(e*px-b*py)/determinant,y:(a*py-d*px)/determinant,z};
  }

  function normalize(image,width,height){
    return {...image,u:image.pixelX/width,v:image.pixelY/height};
  }

  function toLeaflet(image,height){return [height-image.pixelY,image.pixelX];}
  function fromLeaflet(latlng,height){return {pixelX:latlng.lng,pixelY:height-latlng.lat};}

  function validate(points,coefficients){
    const rows=points.map(point=>{
      const predicted=nativeToPixel(point.world||point.native,coefficients);
      const dx=predicted.pixelX-point.image.pixelX,dy=predicted.pixelY-point.image.pixelY;
      return {id:point.id||"",dx,dy,errorPixels:Math.hypot(dx,dy)};
    });
    const squareSum=rows.reduce((sum,row)=>sum+row.errorPixels**2,0);
    return {count:rows.length,rmsePixels:rows.length?Math.sqrt(squareSum/rows.length):null,maxErrorPixels:rows.length?Math.max(...rows.map(row=>row.errorPixels)):null,points:rows};
  }

  return {fitAffine,fitSimilarity,nativeToPixel,pixelToNative,normalize,toLeaflet,fromLeaflet,validate};
});
