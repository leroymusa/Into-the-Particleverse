// Bounding Spheres
// Sihwa Park (shpark@yorku.ca)
// 11/07/2024

function BoundingSphere(center, radius) {
  this.center = center; // p5.Vector
  this.radius = radius; // Number
  this.originalRadius = radius; // Original radius (before scaling)

}

BoundingSphere.prototype.update = function(newCenterX, newCenterY, newCenterZ, scaleFactor) {
  this.center.x = newCenterX;
  this.center.y = newCenterY;
  this.center.z = newCenterZ;
  this.radius = this.originalRadius * scaleFactor;
};

BoundingSphere.prototype.collidesWith = function(otherSphere) {
  let distance = p5.Vector.dist(this.center, otherSphere.center);
  return distance <= (this.radius + otherSphere.radius);
};

BoundingSphere.prototype.render = function() {
  push();
  noFill();
  stroke(0);
  strokeWeight(0.5);
  translate(this.center.x, this.center.y, this.center.z);
  sphere(this.radius);
  pop();
};

function calculateBoundingSphere(geometry) {
  // Find the min and max coordinates
  
  let minX = Math.min(...geometry.vertices.map(v => v.x));
  let maxX = Math.max(...geometry.vertices.map(v => v.x));
  let minY = Math.min(...geometry.vertices.map(v => v.y));
  let maxY = Math.max(...geometry.vertices.map(v => v.y));
  let minZ = Math.min(...geometry.vertices.map(v => v.z));
  let maxZ = Math.max(...geometry.vertices.map(v => v.z));

  // Calculate the center
  let centerX = (minX + maxX) / 2;
  let centerY = (minY + maxY) / 2;
  let centerZ = (minZ + maxZ) / 2;
  let center = createVector(centerX, centerY, centerZ);

  // Calculate the radius
  let maxDistance = 0;
  for (let v of geometry.vertices) {
    let distance = p5.Vector.dist(center, v);
    if (distance > maxDistance) {
      maxDistance = distance;
    }
  }

  return new BoundingSphere(center, maxDistance);
}
