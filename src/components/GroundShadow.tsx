export default function GroundShadow() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2.2, -0.5]}
      receiveShadow
    >
      <planeGeometry args={[12, 12]} />
      <shadowMaterial opacity={0.12} />
    </mesh>
  );
}
